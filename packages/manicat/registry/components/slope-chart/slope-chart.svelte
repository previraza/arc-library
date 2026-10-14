<script lang="ts">
  // @manicat-dependencies motion
  import { onMount, tick } from "svelte";
  import SlopeChartRank from "@/registry/components/slope-chart/slope-chart-rank.svelte";
  import { HEAD, clamp, createSlopeMotion, createTooltipFollow, grouped, layoutSlope } from "@/lib/slope-chart";
  import type { SlopeItem, SlopeRow } from "@/lib/slope-chart";

  export type { SlopeItem };

  interface Props {
    data: SlopeItem[];
    /** What is measured, such as "Conversion rate by channel". Names the chart for assistive technology. */
    label: string;
    /** Heading of the first column, such as "Q1". */
    startLabel: string;
    /** Heading of the second column, such as "Q2". */
    endLabel: string;
    formatValue?: (value: number) => string;
    /** Formats the change in the tooltip. Defaults to the difference in formatValue's terms. */
    formatChange?: (change: number, item: SlopeItem) => string;
    /** Plot height in pixels. Defaults to 44 pixels per item. */
    height?: number;
    /** The item drawn in the accent, such as the one the story is about. */
    highlightKey?: string | null;
    /** The item in focus. Bind it with `bind:activeKey`. The others fade while one is in focus. */
    activeKey?: string | null;
    onActiveChange?: (key: string | null) => void;
    /** Rank movement beside each end value. */
    ranks?: boolean;
    emptyLabel?: string;
    class?: string;
    /** Extend the inner, named parts of the slope chart: stage, columns, column, plot, svg, axis, item, leader, line, dot, labels, start, name, value, end, tooltip, tipTitle, tipRow, tipName, tipValue, tipMeta, message, rank or rankSwap. */
    classNames?: Record<string, string | undefined>;
  }

  let { data, label, startLabel, endLabel, formatValue, formatChange, height, highlightKey = null, activeKey = $bindable(), onActiveChange, ranks = true, emptyLabel = "No data", class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let figure: HTMLElement;
  let stage: HTMLElement;
  let tip: HTMLElement;
  let width = $state(0);
  let seen = $state(reduced);
  let ownActive = $state<string | null>(null);
  let shownKey = $state<string | null>(null);
  let motion: ReturnType<typeof createSlopeMotion> | undefined;
  let follow: ReturnType<typeof createTooltipFollow> | undefined;

  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const empty = $derived(data.length === 0);
  const plotHeight = $derived(height ?? Math.max(200, data.length * 44));
  const narrow = $derived(width < 440);
  const leftRoom = $derived(narrow ? (width < 300 ? 116 : 132) : 168);
  const rightRoom = $derived(ranks ? (narrow ? 76 : 96) : narrow ? 52 : 64);
  const x0 = $derived(leftRoom);
  const x1 = $derived(Math.max(x0 + 40, width - rightRoom));
  const layout = $derived(layoutSlope(data, plotHeight));
  const rows = $derived(layout.rows);
  const byEnd = $derived(layout.byEnd);
  const wanted = $derived(activeKey !== undefined ? activeKey : ownActive);
  const active = $derived(wanted && data.some((item) => item.key === wanted) ? wanted : null);
  const activeRow = $derived(rows.find((row) => row.item.key === active) ?? null);
  // The tooltip keeps the last item's content while it fades out, so it never collapses to an empty box mid-fade.
  $effect.pre(() => {
    if (active) shownKey = active;
  });
  const tipRow = $derived(activeRow ?? rows.find((row) => row.item.key === shownKey) ?? null);

  function setActive(key: string | null) {
    ownActive = key;
    if (key !== active) {
      activeKey = key;
      onActiveChange?.(key);
    }
  }

  const format = (value: number) => (formatValue ? formatValue(value) : grouped.format(value));
  const change = (item: SlopeItem) => (formatChange ? formatChange(item.end - item.start, item) : `${item.end >= item.start ? "+" : "−"}${format(Math.abs(item.end - item.start))}`);
  const rankText = (row: SlopeRow) => (row.rank0 === row.rank1 ? "same rank" : row.rank1 < row.rank0 ? `up ${row.rank0 - row.rank1} to rank ${row.rank1}` : `down ${row.rank1 - row.rank0} to rank ${row.rank1}`);
  const announce = $derived(activeRow ? `${activeRow.item.label}, ${startLabel} ${format(activeRow.item.start)}, ${endLabel} ${format(activeRow.item.end)}, ${change(activeRow.item)}, ${rankText(activeRow)}` : "");
  const summary = $derived(empty ? `${label}. ${emptyLabel}.` : `${label}, ${startLabel} to ${endLabel}. ${byEnd.map((row) => `${row.item.label} ${format(row.item.start)} to ${format(row.item.end)}`).join(", ")}.`);

  // The line nearest the pointer, measured at the pointer's position along the plot.
  function nearest(clientX: number, clientY: number) {
    const rect = stage?.getBoundingClientRect();
    if (!rect || empty) return null;
    const x = clamp(clientX - rect.left, x0, x1);
    const y = clientY - rect.top - HEAD;
    const t = (x - x0) / Math.max(1, x1 - x0);
    let best: SlopeRow | null = null;
    let distance = Infinity;
    for (const row of rows) {
      const inLine = Math.abs(row.y0 + (row.y1 - row.y0) * t - y);
      const onLabel = clientX - rect.left < x0 ? Math.abs(row.l0 - y) : clientX - rect.left > x1 ? Math.abs(row.l1 - y) : Infinity;
      const d = Math.min(inLine, onLabel);
      if (d < distance) {
        distance = d;
        best = row;
      }
    }
    return distance <= 22 ? (best?.item.key ?? null) : null;
  }
  function onkeydown(event: KeyboardEvent) {
    if (empty) return;
    if (event.key === "Escape" && active) {
      event.preventDefault();
      setActive(null);
      return;
    }
    const at = activeRow ? activeRow.order : -1;
    const moves: Record<string, number> = { ArrowDown: at + 1, ArrowRight: at + 1, ArrowUp: at < 0 ? 0 : at - 1, ArrowLeft: at < 0 ? 0 : at - 1, Home: 0, End: byEnd.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(byEnd[clamp(moves[event.key], 0, byEnd.length - 1)].item.key);
  }

  onMount(() => {
    const read = () => (width = stage.clientWidth);
    read();
    const resize = new ResizeObserver(read);
    resize.observe(stage);
    motion = createSlopeMotion(stage, { reduced });
    follow = createTooltipFollow(tip, reduced);
    let observer: IntersectionObserver | undefined;
    if (!reduced) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer?.disconnect();
        seen = true;
      }, { threshold: 0.3 });
      observer.observe(figure);
    }
    return () => {
      resize.disconnect();
      observer?.disconnect();
    };
  });

  // Lines, dots and labels move to their new places on a spring; the tooltip rides the middle of the line in focus.
  $effect(() => {
    rows;
    x0;
    x1;
    seen;
    width;
    active;
    plotHeight;
    tick().then(() => {
      motion?.update(rows, { x0, x1, visible: seen && width > 0 });
      const row = activeRow;
      if (!row || !tip || !width) return follow?.hide();
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const mid = (row.y0 + row.y1) / 2;
      const cx = (x0 + x1) / 2;
      const above = mid - th - 16 >= 0;
      const left = clamp(cx - tw / 2, 0, Math.max(0, width - tw));
      const top = clamp(HEAD + (above ? mid - th - 16 : mid + 16), 0, Math.max(0, plotHeight + HEAD - th));
      follow?.to(left, top);
    });
  });
</script>

<figure bind:this={figure} class={["mc-slope-chart__figure", className]} aria-label={label}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div bind:this={stage} class={cn("mc-slope-chart__stage", "stage")} data-narrow={narrow || undefined} data-active={active ? true : undefined} role="group" tabindex={empty ? -1 : 0} aria-roledescription="slope chart" aria-label={`${label}. Use up and down arrows to move between items in ${endLabel} order.`}
    onpointermove={(event) => { if (event.pointerType === "mouse" || event.buttons) setActive(nearest(event.clientX, event.clientY)); }}
    onpointerdown={(event) => { if (event.pointerType !== "mouse") { (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId); setActive(nearest(event.clientX, event.clientY)); } }}
    onpointerup={(event) => { if (event.pointerType !== "mouse") setActive(null); }} onpointercancel={() => setActive(null)} onpointerleave={(event) => { if (event.pointerType === "mouse") setActive(null); }}
    {onkeydown} onblur={() => setActive(null)} onfocus={(event) => { if ((event.currentTarget as HTMLElement).matches(":focus-visible") && !empty && !active) setActive(byEnd[0].item.key); }}>
    {#if width > 0}
      <div class={cn("mc-slope-chart__columns", "columns")} aria-hidden="true">
        <span class={cn("mc-slope-chart__column", "column")} style={`left: ${x0}px; translate: -50% 0`}>{startLabel}</span>
        <span class={cn("mc-slope-chart__column", "column")} style={`left: ${x1}px; translate: -50% 0`}>{endLabel}</span>
      </div>
      <div class={cn("mc-slope-chart__plot", "plot")} style={`height: ${plotHeight}px`}>
        <svg class={cn("mc-slope-chart__svg", "svg")} {width} height={plotHeight} aria-hidden="true" focusable="false">
          <line class={cn("mc-slope-chart__axis", "axis")} x1={x0} x2={x0} y1={0} y2={plotHeight} />
          <line class={cn("mc-slope-chart__axis", "axis")} x1={x1} x2={x1} y1={0} y2={plotHeight} />
          {#each rows as row (row.item.key)}
            <g class={cn("mc-slope-chart__item", "item")} data-on={active === row.item.key || undefined} data-accent={highlightKey === row.item.key || undefined} data-dim={(active !== null && active !== row.item.key) || undefined}>
              <path class={cn("mc-slope-chart__leader", "leader")} data-leader="0" data-key={row.item.key} d={`M${x0 - 6},${row.l0}L${x0 - 1},${row.y0}`} />
              <path class={cn("mc-slope-chart__leader", "leader")} data-leader="1" data-key={row.item.key} d={`M${x1 + 6},${row.l1}L${x1 + 1},${row.y1}`} />
              <line class={cn("mc-slope-chart__line", "line")} data-line data-key={row.item.key} x1={x0} x2={x1} y1={row.y0} y2={row.y1} />
              <circle class={cn("mc-slope-chart__dot", "dot")} data-dot="0" data-key={row.item.key} cx={x0} cy={row.y0} r="4" />
              <circle class={cn("mc-slope-chart__dot", "dot")} data-dot="1" data-key={row.item.key} cx={x1} cy={row.y1} r="4" />
            </g>
          {/each}
        </svg>
        {#each rows as row (row.item.key)}
          <div class={cn("mc-slope-chart__labels", "labels")} data-on={active === row.item.key || undefined} data-accent={highlightKey === row.item.key || undefined} data-dim={(active !== null && active !== row.item.key) || undefined} aria-hidden="true">
            <span class={cn("mc-slope-chart__start", "start")} data-label="0" data-key={row.item.key} style={`right: ${width - x0 + 10}px; max-width: ${x0 - 10}px; transform: translateY(${row.l0}px)`}>
              <span class={cn("mc-slope-chart__name", "name")}>{row.item.label}</span>
              <span class={cn("mc-slope-chart__value", "value")}>{format(row.item.start)}</span>
            </span>
            <span class={cn("mc-slope-chart__end", "end")} data-label="1" data-key={row.item.key} style={`left: ${x1 + 10}px; transform: translateY(${row.l1}px)`}>
              <span class={cn("mc-slope-chart__value", "value")}>{format(row.item.end)}</span>
              {#if ranks}<SlopeChartRank move={row.rank0 - row.rank1} {classNames} />{/if}
            </span>
          </div>
        {/each}
      </div>
    {/if}
    <div bind:this={tip} class={cn("mc-slope-chart__tooltip", "tooltip")} aria-hidden="true">
      <p class={cn("mc-slope-chart__tipTitle", "tipTitle")}>{tipRow?.item.label ?? ""}</p>
      <p class={cn("mc-slope-chart__tipRow", "tipRow")}><span class={cn("mc-slope-chart__tipName", "tipName")}>{startLabel}</span><span class={cn("mc-slope-chart__tipValue", "tipValue")}>{tipRow ? format(tipRow.item.start) : ""}</span></p>
      <p class={cn("mc-slope-chart__tipRow", "tipRow")}><span class={cn("mc-slope-chart__tipName", "tipName")}>{endLabel}</span><span class={cn("mc-slope-chart__tipValue", "tipValue")}>{tipRow ? format(tipRow.item.end) : ""}</span></p>
      <p class={cn("mc-slope-chart__tipMeta", "tipMeta")}>{tipRow ? `${change(tipRow.item)}, ${rankText(tipRow)}` : ""}</p>
    </div>
    {#if empty}<p class={cn("mc-slope-chart__message", "message")}>{emptyLabel}</p>{/if}
  </div>
  <p class="mc-slope-chart__srOnly" aria-live="polite" aria-atomic="true">{announce}</p>
  <p class="mc-slope-chart__srOnly">{summary}</p>
  {#if !empty}
    <div class="mc-slope-chart__srOnly"><table>
      <caption>{label}</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">{startLabel}</th><th scope="col">{endLabel}</th><th scope="col">Change</th><th scope="col">Rank</th></tr></thead>
      <tbody>{#each byEnd as row (row.item.key)}<tr><th scope="row">{row.item.label}</th><td>{format(row.item.start)}</td><td>{format(row.item.end)}</td><td>{change(row.item)}</td><td>{row.rank0} to {row.rank1}</td></tr>{/each}</tbody>
    </table></div>
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slope-chart__figure { position: relative; display: grid; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-slope-chart__css. */

.mc-slope-chart__stage { position: relative; min-width: 0; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-slope-chart__columns { position: relative; height: 28px; }
.mc-slope-chart__column { position: absolute; top: 0; color: var(--text-muted); font-size: var(--text-sm); line-height: 20px; white-space: nowrap; }

.mc-slope-chart__plot { position: relative; }
.mc-slope-chart__svg { display: block; overflow: visible; }
.mc-slope-chart__axis { stroke: var(--border); stroke-width: 1; shape-rendering: crispEdges; }

/* Every line is one neutral ink; the story item takes the first series (derived from the accent) and the item in focus comes forward. */
.mc-slope-chart__item { --ink: color-mix(in oklab, var(--foreground) 36%, var(--surface)); transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-slope-chart__item[data-accent] { --ink: var(--series-1); }
.mc-slope-chart__item[data-on]:not([data-accent]) { --ink: var(--foreground); }
.mc-slope-chart__item[data-dim] { opacity: .14; }
.mc-slope-chart__line { stroke: var(--ink); stroke-width: 2; stroke-linecap: round; fill: none; transition: stroke var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__dot { fill: var(--ink); stroke: var(--surface); stroke-width: 2; transform-box: fill-box; transform-origin: center; transition: fill var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__leader { fill: none; stroke: var(--border-strong); stroke-width: 1; }

.mc-slope-chart__labels { transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-slope-chart__labels[data-dim] { opacity: .3; }
.mc-slope-chart__start, .mc-slope-chart__end { position: absolute; top: 0; display: flex; height: 20px; align-items: center; gap: 8px; margin-top: -10px; font-size: var(--text-sm); line-height: 20px; white-space: nowrap; pointer-events: none; }
.mc-slope-chart__start { justify-content: flex-end; max-width: 100%; }
/* On a phone the labels step down a size so the longest names fit beside the first column instead of running off the edge. */
.mc-slope-chart__stage[data-narrow] .mc-slope-chart__start, .mc-slope-chart__stage[data-narrow] .mc-slope-chart__end { gap: 6px; font-size: var(--text-xs); }
.mc-slope-chart__name { min-width: 0; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; }
.mc-slope-chart__value { color: var(--foreground); font-variant-numeric: tabular-nums; }
.mc-slope-chart__labels[data-on] .mc-slope-chart__name, .mc-slope-chart__labels[data-accent] .mc-slope-chart__name { color: var(--foreground); }
/* Only the story item is medium; the item in focus changes color, not weight, so its label never shifts sideways. */
.mc-slope-chart__labels[data-accent] .mc-slope-chart__value { font-weight: 500; }

.mc-slope-chart__rank { display: inline-flex; min-width: 30px; align-items: center; gap: 2px; color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-slope-chart__rank[data-move="up"] { color: var(--text-secondary); }
.mc-slope-chart__rankSwap { position: relative; display: inline-flex; overflow: hidden; }

.mc-slope-chart__tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 168px; max-width: min(240px, 100%); gap: 3px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__stage[data-active] .mc-slope-chart__tooltip { opacity: 1; scale: 1; }
.mc-slope-chart__tipTitle { margin: 0 0 2px; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; }
.mc-slope-chart__tipRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; font-size: var(--text-sm); line-height: 1.3; }
.mc-slope-chart__tipName { color: var(--text-secondary); }
.mc-slope-chart__tipValue { color: var(--foreground); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-slope-chart__tipMeta { margin: 2px 0 0; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }

.mc-slope-chart__message { display: grid; min-height: 160px; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-slope-chart__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-slope-chart__item, .mc-slope-chart__line, .mc-slope-chart__dot, .mc-slope-chart__labels, .mc-slope-chart__tooltip { transition: none; }
}
}
</style>
