<script lang="ts" module>
  import type { WaffleCategory } from "@/lib/waffle-chart";

  export type { WaffleCategory };
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount, tick } from "svelte";
  import WaffleChartRolling from "@/registry/components/waffle-chart/waffle-chart-rolling.svelte";
  import { SHADES, SHAPES, allocate, clamp, createWaffleMotion, grouped, reassign, GAP } from "@/lib/waffle-chart";
  import type { Cell } from "@/lib/waffle-chart";
  import { createTooltipFollow } from "@/lib/slope-chart";

  type Pointer = { key: string; slot: number } | null;

  interface Props {
    /** Categories in fill order. The first fills from the bottom-left corner, column by column. */
    data: WaffleCategory[];
    /** What the whole is, such as "Electricity generation, 2023". Names the chart for assistive technology. */
    label: string;
    unit?: string;
    formatValue?: (value: number, category: WaffleCategory) => string;
    rows?: number;
    columns?: number;
    /** The category painted in the accent. Pass null to keep every category neutral. Defaults to the first category. */
    accentKey?: string | null;
    /** The focused category, bindable. Others dim while one is focused. */
    activeKey?: string | null;
    legend?: boolean;
    decimals?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the waffle chart: body, board, grid, cell, tooltip, tipRow, tipSwatch, tipName, tipValue, tipMeta, message, legend, item, swatch, itemLabel or itemShare. */
    classNames?: Record<string, string | undefined>;
    class?: string;
    [key: string]: unknown;
  }

  let { data, label, unit = "", formatValue, rows = 10, columns = 10, accentKey = undefined, activeKey = $bindable(null), legend = true, decimals = 0, emptyLabel = "No data", classNames, class: className, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let figure = $state<HTMLElement>();
  let grid = $state<HTMLElement>();
  let tip = $state<HTMLElement>();
  let seen = $state(reduced);
  let side = $state(0);
  let motion: ReturnType<typeof createWaffleMotion> | undefined;
  let follow: ReturnType<typeof createTooltipFollow> | undefined;

  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const count = $derived(Math.max(1, rows * columns));
  const total = $derived(data.reduce((sum, item) => sum + Math.max(0, item.value), 0));
  const empty = $derived(!data.length || total <= 0);
  const accent = $derived(accentKey === undefined ? (data[0]?.key ?? null) : accentKey);
  const counts = $derived(allocate(data, total, count));

  // Cells are persistent objects; each data change reassigns them so they travel instead of repainting.
  const signature = $derived(`${count}|${data.map((item) => `${item.key}:${item.value}`).join(",")}`);
  let layout = $state.raw({ cells: [] as Cell[], moved: new Set<number>(), version: 0, signature: "" });
  $effect.pre(() => {
    if (layout.signature === signature) return;
    const base = Array.from({ length: count }, (_, id) => layout.cells[id] ?? { id, key: null, slot: id });
    const next = reassign(base, data, counts);
    layout = { cells: next, moved: layout.signature ? new Set(next.filter((cell) => base[cell.id].slot !== cell.slot || base[cell.id].key !== cell.key).map((cell) => cell.id)) : new Set(), version: layout.version + 1, signature };
  });
  const cells = $derived(layout.cells);

  let pinned = $state<string | null>(null);
  let pointer = $state.raw<Pointer>(null);
  let preview = $state<string | null>(null);
  const pinnedKey = $derived(activeKey ?? pinned);
  const focusKey = $derived(pointer?.key ?? preview ?? pinnedKey);
  const active = $derived(focusKey && data.some((item) => item.key === focusKey) ? focusKey : null);
  const setPinned = (key: string | null) => { pinned = key; activeKey = key; };

  const size = $derived(side ? (side - GAP * (columns - 1)) / columns : 0);
  const height = $derived(size ? size * rows + GAP * (rows - 1) : 0);
  const place = (slot: number) => ({ x: Math.floor(slot / rows) * (size + GAP), y: (rows - 1 - (slot % rows)) * (size + GAP) });

  const rankOf = (key: string) => data.filter((entry) => entry.key !== accent).findIndex((entry) => entry.key === key);
  const colorOf = (key: string | null) => {
    if (key === null) return "transparent";
    const item = data.find((entry) => entry.key === key);
    if (!item) return "transparent";
    if (item.color) return item.color;
    if (key === accent) return "var(--series-1)";
    const rank = rankOf(key);
    return rank < 3 ? `var(--series-${rank + 2})` : `color-mix(in oklab, var(--foreground) ${SHADES[(rank - 3) % SHADES.length]}%, var(--surface))`;
  };
  const shapeOf = (key: string | null) => {
    if (key === null || key === accent) return "square";
    const rank = rankOf(key);
    return rank < 0 ? "square" : SHAPES[rank % SHAPES.length];
  };

  const format = (value: number, item: WaffleCategory) => `${formatValue ? formatValue(value, item) : grouped.format(value)}${unit ? ` ${unit}` : ""}`;
  const share = (item: WaffleCategory) => (total > 0 ? (Math.max(0, item.value) / total) * 100 : 0);
  const reading = $derived(pointer ? (data.find((item) => item.key === pointer!.key) ?? null) : null);
  const announce = $derived(reading ? `${reading.label}, ${share(reading).toFixed(decimals)}%, ${format(reading.value, reading)}` : "");
  const summary = $derived(empty ? `${label}. ${emptyLabel}.` : `${label}. ${data.map((item) => `${item.label} ${share(item).toFixed(decimals)}%`).join(", ")}.`);

  const slotAt = (clientX: number, clientY: number) => {
    const box = grid?.getBoundingClientRect();
    if (!box || !size) return null;
    const col = clamp(Math.floor((clientX - box.left) / (size + GAP)), 0, columns - 1);
    const row = clamp(Math.floor((clientY - box.top) / (size + GAP)), 0, rows - 1);
    return col * rows + (rows - 1 - row);
  };
  const pointAt = (slot: number | null): Pointer => {
    if (slot === null) return null;
    const cell = cells.find((item) => item.slot === slot);
    return cell?.key ? { key: cell.key, slot } : null;
  };

  // Arrows walk the grid cell by cell; Page keys jump between categories.
  function onKeydown(event: KeyboardEvent) {
    if (empty) return;
    if (event.key === "Escape" && pointer) { event.preventDefault(); pointer = null; return; }
    const filled = cells.filter((cell) => cell.key !== null).length;
    const at = pointer?.slot ?? 0;
    const col = Math.floor(at / rows);
    const row = at % rows;
    const blocks = counts.map((blockSize, index) => ({ start: counts.slice(0, index).reduce((sum, value) => sum + value, 0), size: blockSize })).filter((block) => block.size > 0);
    const block = Math.max(0, blocks.findIndex((item) => at >= item.start && at < item.start + item.size));
    const moves: Record<string, () => number> = {
      ArrowUp: () => col * rows + Math.min(rows - 1, row + 1),
      ArrowDown: () => col * rows + Math.max(0, row - 1),
      ArrowRight: () => Math.min(columns - 1, col + 1) * rows + row,
      ArrowLeft: () => Math.max(0, col - 1) * rows + row,
      PageDown: () => blocks[Math.min(blocks.length - 1, block + 1)].start,
      PageUp: () => (at > blocks[block].start ? blocks[block].start : blocks[Math.max(0, block - 1)].start),
      Home: () => 0,
      End: () => filled - 1,
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    pointer = pointAt(clamp(pointer ? move() : 0, 0, Math.max(0, filled - 1)));
  }

  onMount(() => {
    const node = grid!;
    const read = () => (side = node.clientWidth);
    read();
    const resize = new ResizeObserver(read);
    resize.observe(node);
    motion = createWaffleMotion(node, { reduced, rows });
    follow = createTooltipFollow(tip!, reduced, { stiffness: 520, damping: 44 });
    let observer: IntersectionObserver | undefined;
    if (!reduced) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer?.disconnect();
        seen = true;
      }, { threshold: 0.35 });
      observer.observe(figure!);
    }
    return () => { resize.disconnect(); observer?.disconnect(); };
  });

  // Cells fly between blocks; the tooltip glides between cells on its own spring and stays inside the figure.
  $effect(() => {
    const current = { cells, size, seen, layout, pointer, reading };
    void tick().then(() => {
      if (current.size) motion?.update(current.cells, { size: current.size, visible: current.seen, moved: current.layout.moved, version: current.layout.version });
      const bubble = tip;
      if (!current.pointer || !bubble || !figure || !grid || !current.size) return follow?.hide();
      const hostBox = figure.getBoundingClientRect();
      const boardBox = grid.getBoundingClientRect();
      const { x, y } = place(current.pointer.slot);
      const cx = boardBox.left - hostBox.left + x + current.size / 2;
      const cy = boardBox.top - hostBox.top + y;
      const tw = bubble.offsetWidth;
      const th = bubble.offsetHeight;
      let top = cy - th - 10;
      if (top < 0) top = cy + current.size + 10;
      const left = clamp(cx - tw / 2, 0, Math.max(0, hostBox.width - tw));
      follow?.to(left, clamp(top, 0, Math.max(0, hostBox.height - th)));
    });
  });
</script>

<figure bind:this={figure} {...rest} class={["mc-waffle-chart__figure", className]} aria-label={label} data-legend={legend || undefined}>
  <div class={cn("mc-waffle-chart__body", "body")}>
    <div class={cn("mc-waffle-chart__board", "board")}>
      <div
        bind:this={grid}
        class={cn("mc-waffle-chart__grid", "grid")}
        style:height={height ? `${height}px` : undefined}
        style:aspect-ratio={height ? undefined : `${columns} / ${rows}`}
        data-active={active ? true : undefined}
        role="group"
        tabindex={empty ? -1 : 0}
        aria-roledescription="waffle chart"
        aria-label={`${label}. ${count} cells. Use arrow keys to move between cells, Page Up and Page Down to jump between categories.`}
        onpointermove={(event) => { if (event.pointerType === "mouse" || event.buttons) pointer = pointAt(slotAt(event.clientX, event.clientY)); }}
        onpointerdown={(event) => { if (event.pointerType !== "mouse") event.currentTarget.setPointerCapture?.(event.pointerId); pointer = pointAt(slotAt(event.clientX, event.clientY)); }}
        onpointerup={(event) => { if (event.pointerType !== "mouse") pointer = null; }}
        onpointercancel={() => (pointer = null)}
        onpointerleave={(event) => { if (event.pointerType === "mouse") pointer = null; }}
        onkeydown={onKeydown}
        onblur={() => (pointer = null)}
        onfocus={(event) => { if (event.currentTarget.matches(":focus-visible") && !empty) pointer = pointer ?? pointAt(0); }}
      >
        {#if size > 0}
          {#each cells as cell (cell.id)}
            <span
              class={cn("mc-waffle-chart__cell", "cell")}
              aria-hidden="true"
              data-cell={cell.id}
              data-on={(cell.key !== null && cell.key === active) || undefined}
              data-cursor={pointer?.slot === cell.slot || undefined}
              data-empty={cell.key === null || undefined}
              data-shape={shapeOf(cell.key)}
              style:width={`${size}px`}
              style:height={`${size}px`}
              style:--cell={colorOf(cell.key)}
              style:--delay={`${reduced ? 0 : (cell.slot / count) * 0.32}s`}
            ></span>
          {/each}
        {/if}
      </div>
      {#if !empty}
        <div bind:this={tip} class={cn("mc-waffle-chart__tooltip", "tooltip")} data-shown={pointer ? true : undefined} aria-hidden="true">
          <p class={cn("mc-waffle-chart__tipRow", "tipRow")}>
            <span class={cn("mc-waffle-chart__tipSwatch", "tipSwatch")} data-shape={shapeOf(reading?.key ?? null)} style:--cell={colorOf(reading?.key ?? null)}></span>
            <span class={cn("mc-waffle-chart__tipName", "tipName")}>{reading?.label ?? ""}</span>
            <span class={cn("mc-waffle-chart__tipValue", "tipValue")}>{reading ? `${share(reading).toFixed(decimals)}%` : ""}</span>
          </p>
          <p class={cn("mc-waffle-chart__tipMeta", "tipMeta")}>{reading ? format(reading.value, reading) : ""}</p>
        </div>
      {/if}
      {#if empty}<p class={cn("mc-waffle-chart__message", "message")}>{emptyLabel}</p>{/if}
    </div>
    {#if legend && !empty}
      <ul class={cn("mc-waffle-chart__legend", "legend")} aria-label={`${label} categories`} onpointerleave={() => (preview = null)}>
        {#each data as item (item.key)}
          <li>
            <button
              type="button"
              class={cn("mc-waffle-chart__item", "item")}
              aria-pressed={pinnedKey === item.key}
              data-on={active === item.key || undefined}
              data-dim={(active !== null && active !== item.key) || undefined}
              onclick={() => setPinned(pinnedKey === item.key ? null : item.key)}
              onpointerenter={(event) => { if (event.pointerType === "mouse") preview = item.key; }}
              onfocus={(event) => { if (event.currentTarget.matches(":focus-visible")) preview = item.key; }}
              onblur={() => (preview = null)}
            >
              <span class={cn("mc-waffle-chart__swatch", "swatch")} data-shape={shapeOf(item.key)} style:--cell={colorOf(item.key)} aria-hidden="true"></span>
              <span class={cn("mc-waffle-chart__itemLabel", "itemLabel")}>{item.label}</span>
              <span class={cn("mc-waffle-chart__itemShare", "itemShare")}><WaffleChartRolling value={share(item)} {decimals} /></span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <p class="mc-waffle-chart__srOnly" aria-live="polite" aria-atomic="true">{announce}</p>
  <p class="mc-waffle-chart__srOnly">{summary}</p>
  {#if !empty}
    <div class="mc-waffle-chart__srOnly"><table>
      <caption>{label}</caption>
      <thead><tr><th scope="col">Category</th><th scope="col">Value</th><th scope="col">Share</th><th scope="col">Cells</th></tr></thead>
      <tbody>{#each data as item, index (item.key)}<tr><th scope="row">{item.label}</th><td>{format(item.value, item)}</td><td>{share(item).toFixed(decimals)}%</td><td>{counts[index]}</td></tr>{/each}</tbody>
    </table></div>
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-waffle-chart__figure { position: relative; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); container-type: inline-size; }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-waffle-chart__css. */
.mc-waffle-chart__body { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr); align-items: center; gap: var(--space-6); }
@container (min-width: 420px) {
  .mc-waffle-chart__figure[data-legend] .mc-waffle-chart__body { grid-template-columns: minmax(0, 232px) minmax(0, 1fr); gap: var(--space-6); }
}

.mc-waffle-chart__board { min-width: 0; }
.mc-waffle-chart__grid { position: relative; width: 100%; max-width: 300px; margin-inline: auto; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: default; }

/* Each cell is one unit. Its colour changes mid-flight with the same stagger as its travel. */
.mc-waffle-chart__cell { --inner: 0 0 0 0 transparent; --outer: 0 0 0 0 transparent; position: absolute; top: 0; left: 0; border-radius: 22%; background: var(--cell); box-shadow: var(--inner), var(--outer); will-change: transform; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), box-shadow var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__grid[data-active] .mc-waffle-chart__cell:not([data-on]) { opacity: .26 !important; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-standard) var(--ease-standard); }
.mc-waffle-chart__cell[data-cursor] { --outer: 0 0 0 2px var(--surface), 0 0 0 3.5px color-mix(in oklab, var(--foreground) 55%, transparent); }

/* Shape is the colour-free second channel: a cell morphs between these as it changes category. */
.mc-waffle-chart__cell[data-shape="round"], .mc-waffle-chart__swatch[data-shape="round"], .mc-waffle-chart__tipSwatch[data-shape="round"] { border-radius: 50%; }
.mc-waffle-chart__cell[data-shape="framed"] { --inner: inset 0 0 0 2.5px var(--cell), inset 0 0 0 3.25px var(--surface); }
.mc-waffle-chart__swatch[data-shape="framed"], .mc-waffle-chart__tipSwatch[data-shape="framed"] { box-shadow: inset 0 0 0 2px var(--cell), inset 0 0 0 3px var(--surface); }

.mc-waffle-chart__tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 150px; max-width: min(240px, 100%); gap: 2px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__tooltip[data-shown] { opacity: 1; scale: 1; }
.mc-waffle-chart__tipRow { display: flex; min-width: 0; align-items: center; gap: 8px; margin: 0; font-size: var(--text-sm); line-height: 1.3; }
.mc-waffle-chart__tipSwatch { width: 10px; height: 10px; flex: none; border-radius: 3px; background: var(--cell); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__tipName { min-width: 0; flex: 1; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.mc-waffle-chart__tipValue { flex: none; margin-left: 8px; font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-waffle-chart__tipMeta { margin: 0 0 0 18px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; white-space: nowrap; }

.mc-waffle-chart__message { display: grid; min-height: 160px; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }

/* The legend doubles as the reading: each share rolls to its new value. */
.mc-waffle-chart__legend { display: grid; min-width: 0; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 2px var(--space-2); margin: 0; padding: 0; list-style: none; }
@container (min-width: 420px) { .mc-waffle-chart__figure[data-legend] .mc-waffle-chart__legend { grid-template-columns: minmax(0, 1fr); } }
/* Below the side-by-side layout two columns would clip names like "Wind and solar", so the legend reads as one list. */
/* Stacked, the legend shares the grid's measure and its row padding hangs outside, so swatches and shares line up with the cell edges. */
@container (max-width: 419px) { .mc-waffle-chart__legend { grid-template-columns: minmax(0, 1fr); margin-inline: max(-10px, calc((100% - 320px) / 2)); } }
.mc-waffle-chart__item { display: grid; width: 100%; min-height: 36px; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 4px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); text-align: left; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-waffle-chart__item:active { transform: scale(.98); }
.mc-waffle-chart__item[data-on] { color: var(--foreground); background: color-mix(in oklab, var(--foreground) 5%, transparent); }
.mc-waffle-chart__item[data-dim] { opacity: .5; }
.mc-waffle-chart__item[aria-pressed="true"] { color: var(--foreground); }
@media (hover: hover) and (pointer: fine) { .mc-waffle-chart__item:hover { color: var(--foreground); } }
.mc-waffle-chart__swatch { width: 10px; height: 10px; border-radius: 3px; background: var(--cell); }
.mc-waffle-chart__itemLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-waffle-chart__itemShare { color: var(--foreground); font-size: var(--text-base); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; min-width: 3.2em; }

.mc-waffle-chart__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-waffle-chart__cell, .mc-waffle-chart__grid[data-active] .mc-waffle-chart__cell:not([data-on]), .mc-waffle-chart__tooltip, .mc-waffle-chart__tipSwatch, .mc-waffle-chart__item { transition: none; }
}
}
</style>
