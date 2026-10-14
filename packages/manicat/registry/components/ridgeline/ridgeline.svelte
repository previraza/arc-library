<script lang="ts">
  // @manicat-dependencies motion
  import { onMount, tick, untrack } from "svelte";
  import { AXIS, LIFT, TIP, buildModel, clamp, createRidgelineMotion, follow, grouped, heightAt, niceStep, percent } from "@/lib/ridgeline";
  import type { RidgelineEntry, Shape } from "@/lib/ridgeline";
  import { createTooltipFollow } from "@/lib/slope-chart";

  export type RidgelineSeries = RidgelineEntry;

  /** Use a ridgeline to compare the shape of many distributions at once, such as daily temperatures by month or response times by region. */
  interface Props {
    /** One ridge per series, drawn top to bottom. */
    series: RidgelineSeries[];
    /** What is measured, such as "Daily highs in Zurich". Names the chart for assistive technology. */
    label: string;
    /** Unit after each value, such as "°C". */
    unit?: string;
    formatValue?: (value: number) => string;
    /** Value range of the axis. Defaults to the data with a little room on each side. */
    domain?: [number, number];
    /** How far a ridge may rise into the rows above, in row heights. */
    overlap?: number;
    /** Height of one row in pixels. */
    rowHeight?: number;
    /** Smoothing in value units. Defaults to Silverman's rule per series. */
    bandwidth?: number;
    /** Shades each ridge by its median, from a light tint to the full first series color, and shows the scale under the axis. */
    tint?: boolean;
    /** The id of the lifted ridge, bindable with `bind:active`. */
    active?: string | null;
    defaultActive?: string | null;
    emptyLabel?: string;
    /** Extend the inner, named parts of the ridgeline: plot, ticks, tick, tickLabel, crosshair, svg, ridge, fill, median, line, lens, lensFill, lensBand, lensMedian, lensLine, labels, rowLabel, message, tooltip, tipTitle, tipValue, tipRow, tipKey, tipNote, scale, scaleLabel, steps or step. */
    classNames?: Record<string, string | undefined>;
    class?: string;
    [key: string]: unknown;
  }

  let { series, label, unit = "", formatValue, domain, overlap = 2.4, rowHeight = 30, bandwidth, tint = true, active = $bindable(undefined), defaultActive = null, emptyLabel = "No data yet", classNames, class: className, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const format = (value: number) => (formatValue ? formatValue(value) : `${grouped.format(value).replace("-", "\u2212")}${unit}`);

  let figure = $state<HTMLElement>();
  let plot = $state<HTMLElement>();
  let tip = $state<HTMLElement>();
  let cross = $state<HTMLElement>();
  let width = $state(0);
  let inView = $state(false);
  let motion = $state.raw<ReturnType<typeof createRidgelineMotion>>();
  let tooltip: ReturnType<typeof createTooltipFollow> | undefined;

  const model = $derived(buildModel(series, domain, bandwidth));
  let ownActive = $state<string | null>(untrack(() => defaultActive));
  const current = $derived(active !== undefined ? active : ownActive);
  const setCurrent = (id: string | null) => { ownActive = id; active = id; };
  let cursor = $state.raw<{ value: number; pointerY: number | null } | null>(null);

  const narrow = $derived(width > 0 && width < 420);
  const gutter = $derived(narrow ? 36 : 52);
  const top = $derived(Math.ceil((overlap - 1) * rowHeight) + LIFT + 8);
  const height = $derived(top + series.length * rowHeight + AXIS);
  const plotWidth = $derived(Math.max(40, width - gutter - 4));
  const baselineOf = (row: number) => top + (row + 1) * rowHeight;

  // Axis ticks for the target domain; their positions follow the drawn domain every frame.
  const tickCount = $derived(Math.max(2, Math.floor(plotWidth / 72)));
  const step = $derived(niceStep(model.hi - model.lo, tickCount));
  const ticks = $derived.by(() => {
    const list: number[] = [];
    for (let value = Math.ceil(model.lo / step) * step; value <= model.hi + 1e-9; value += step) list.push(Math.round(value * 1e6) / 1e6 || 0);
    return list;
  });

  const activeStats = $derived(current ? model.stats.get(current) : undefined);
  const activeSeries = $derived(current ? series.find((entry) => entry.id === current) : undefined);
  const reading = $derived(cursor && activeStats ? { value: cursor.value, below: activeStats.n ? activeStats.sorted.filter((value) => value <= cursor!.value).length / activeStats.n : 0 } : null);
  // The tooltip keeps its last content while it fades out, so it never collapses to an empty box on leave.
  let held = $state.raw<{ id: string; value: number | null } | null>(null);
  $effect.pre(() => {
    const id = current;
    const value = reading?.value ?? null;
    if (id && (untrack(() => held)?.id !== id || untrack(() => held)!.value !== value)) held = { id, value };
  });
  const tipSeries = $derived(held ? series.find((entry) => entry.id === held!.id) : undefined);
  const tipStats = $derived(held ? model.stats.get(held.id) : undefined);
  const tipBelow = $derived(held && held.value !== null && tipStats?.n ? tipStats.sorted.filter((value) => value <= held!.value!).length / tipStats.n : 0);

  const empty = $derived(!series.length || series.every((entry) => !entry.values.length));
  /** Ridge tone: one hue, the first series color, from a light tint (low median) to full strength (high median), so the scale never passes through a muddy middle. */
  const toneOf = (t: number) => `color-mix(in oklab, var(--series-1) ${Math.round(38 + clamp(t, 0, 1) * 62)}%, var(--surface))`;
  const ridgeColor = (value: number) => (tint ? toneOf((value - model.lo) / (model.hi - model.lo || 1)) : "var(--series-1)");
  const describe = (entry: RidgelineSeries) => { const s = model.stats.get(entry.id)!; return `${entry.label}: median ${format(s.median)}, middle half ${format(s.q1)} to ${format(s.q3)}, range ${format(s.min)} to ${format(s.max)}, ${s.n} values`; };

  const shown = $derived(inView || reduced);

  // The tooltip trails the pointer or the keyboard cursor and stays inside the chart.
  function placeTip() {
    const bubble = tip;
    const shape = current ? model.shapes.get(current) : undefined;
    if (cross) cross.style.transform = `translate3d(${reading && motion ? motion.xOf(reading.value).toFixed(2) : 0}px, 0, 0)`;
    if (!bubble || !shape || !width || !motion) return tooltip?.hide();
    const tw = bubble.offsetWidth;
    const th = bubble.offsetHeight;
    const ax = reading ? motion.xOf(reading.value) : motion.xOf(shape.median);
    const ay = cursor?.pointerY ?? baselineOf(shape.row) - heightAt(shape, shape.median) * rowHeight * overlap - LIFT;
    let left = ax + TIP;
    if (left + tw > width) left = ax - TIP - tw;
    let y = ay - th - TIP;
    if (y < 0) y = ay + TIP;
    tooltip?.to(clamp(left, 0, Math.max(0, width - tw)), clamp(y, 0, Math.max(0, height - th)));
  }

  onMount(() => {
    const node = plot!;
    const read = () => (width = node.clientWidth);
    const resize = new ResizeObserver(read);
    resize.observe(node);
    read();
    motion = createRidgelineMotion(node, { reduced, layout: () => ({ gutter, plotWidth, rowHeight, overlap, top, current }) });
    tooltip = createTooltipFollow(tip!, reduced, follow);
    let observer: IntersectionObserver | undefined;
    if (!reduced) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer?.disconnect();
        inView = true;
      }, { threshold: 0.3 });
      observer.observe(figure!);
    }
    return () => { resize.disconnect(); observer?.disconnect(); motion?.stop(); };
  });
  $effect(() => {
    const target = { model, shown };
    void tick().then(() => { if (target.shown) motion?.run(target.model); });
  });
  $effect(() => {
    void [model, current, cursor, width, height, gutter, plotWidth, rowHeight, overlap, tint, series];
    void tick().then(() => { motion?.paint(); placeTip(); });
  });

  const pick = (x: number, y: number) => {
    const value = motion!.valueAt(x);
    const lift = rowHeight * overlap;
    let best: Shape | null = null;
    let bestId: string | null = null;
    for (const [id, shape] of motion!.shapes()) {
      const base = baselineOf(shape.row);
      const h = heightAt(shape, value) * lift;
      if (y <= base + 2 && y >= base - h - 4 && (!best || shape.row > best.row)) { best = shape; bestId = id; }
    }
    if (!bestId) { const row = clamp(Math.floor((y - top) / rowHeight), 0, series.length - 1); bestId = series[row]?.id ?? null; }
    return { id: bestId, value };
  };
  const onPointerMove = (event: PointerEvent & { currentTarget: HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < gutter - 8 || y > height - AXIS + 4) {
      if (event.pointerType === "mouse") { setCurrent(null); cursor = null; }
      return;
    }
    if (!motion) return;
    const hit = pick(x, y);
    setCurrent(hit.id);
    cursor = { value: hit.value, pointerY: y };
  };
  const onKeydown = (event: KeyboardEvent) => {
    const at = current ? series.findIndex((entry) => entry.id === current) : -1;
    const stats = (id: string | undefined) => (id ? model.stats.get(id) : undefined);
    const choose = (index: number) => {
      event.preventDefault();
      const next = series[clamp(index, 0, series.length - 1)];
      if (!next) return;
      setCurrent(next.id);
      cursor = { value: cursor?.value ?? stats(next.id)?.median ?? model.lo, pointerY: null };
    };
    const nudge = (direction: number) => {
      event.preventDefault();
      if (!current) return choose(0);
      const base = cursor?.value ?? stats(current)?.median ?? model.lo;
      cursor = { value: clamp((Math.round(base / step) + direction) * step, model.lo, model.hi), pointerY: null };
    };
    if (event.key === "ArrowDown") choose(at + 1);
    else if (event.key === "ArrowUp") choose(at < 0 ? 0 : at - 1);
    else if (event.key === "Home") choose(0);
    else if (event.key === "End") choose(series.length - 1);
    else if (event.key === "ArrowRight") nudge(1);
    else if (event.key === "ArrowLeft") nudge(-1);
    else if (event.key === "Escape" && current) { event.preventDefault(); setCurrent(null); cursor = null; }
  };
</script>

<figure bind:this={figure} {...rest} class={["mc-ridgeline__figure", className]} aria-label={label}>
  <div
    bind:this={plot}
    class={cn("mc-ridgeline__plot", "plot")}
    style:height={`${height}px`}
    data-active={current ? true : undefined}
    data-cursor={reading ? true : undefined}
    role="group"
    tabindex={empty ? -1 : 0}
    aria-roledescription="ridgeline chart"
    aria-label={`${label}. Up and down arrows choose a ridge, left and right arrows move along the values.`}
    onpointermove={onPointerMove}
    onpointerdown={onPointerMove}
    onpointerleave={(event) => { if (event.pointerType === "mouse") { setCurrent(null); cursor = null; } }}
    onkeydown={onKeydown}
    onblur={() => { setCurrent(null); cursor = null; }}
  >
    <div class={cn("mc-ridgeline__ticks", "ticks")} aria-hidden="true" style:height={`${height - AXIS + 22}px`}>
      {#each ticks as value (value)}
        <div data-tick={value} class={cn("mc-ridgeline__tick", "tick")} style:top={`${top - rowHeight * 0.5}px`}>
          <span class={cn("mc-ridgeline__tickLabel", "tickLabel")}>{format(value)}</span>
        </div>
      {/each}
    </div>
    <div bind:this={cross} class={cn("mc-ridgeline__crosshair", "crosshair")} style:top={`${top - rowHeight * 0.5}px`} style:height={`${height - AXIS - top + rowHeight * 0.5}px`} aria-hidden="true"></div>
    <svg class={cn("mc-ridgeline__svg", "svg")} width={width || undefined} {height} viewBox={`0 0 ${Math.max(1, width)} ${height}`} aria-hidden="true" focusable="false">
      {#each series as entry (entry.id)}
        <g data-ridge={entry.id} class={cn("mc-ridgeline__ridge", "ridge")} data-dim={(current !== null && current !== entry.id) || undefined} data-lifted={current === entry.id || undefined} style:--ridge={ridgeColor(model.stats.get(entry.id)?.median ?? model.lo)}>
          <path data-part="fill" class={cn("mc-ridgeline__fill", "fill")} />
          <line data-part="median" class={cn("mc-ridgeline__median", "median")} />
          <path data-part="line" class={cn("mc-ridgeline__line", "line")} />
        </g>
      {/each}
      <g class={cn("mc-ridgeline__lens", "lens")} data-on={current ? true : undefined} style:--ridge={tipStats ? ridgeColor(tipStats.median) : undefined}>
        <path data-lens="fill" class={cn("mc-ridgeline__lensFill", "lensFill")} />
        <path data-lens="band" class={cn("mc-ridgeline__lensBand", "lensBand")} />
        <line data-lens="median" class={cn("mc-ridgeline__lensMedian", "lensMedian")} />
        <path data-lens="line" class={cn("mc-ridgeline__lensLine", "lensLine")} />
      </g>
    </svg>
    <div class={cn("mc-ridgeline__labels", "labels")} aria-hidden="true">
      {#each series as entry, index (entry.id)}
        <span class={cn("mc-ridgeline__rowLabel", "rowLabel")} data-active={current === entry.id || undefined} style:top={`${baselineOf(index) - 18}px`} style:width={`${gutter - 10}px`}>{entry.label}</span>
      {/each}
    </div>
    {#if empty}<p class={cn("mc-ridgeline__message", "message")}>{emptyLabel}</p>{/if}
    <div bind:this={tip} class={cn("mc-ridgeline__tooltip", "tooltip")} aria-hidden="true">
      {#if tipSeries && tipStats}
        <p class={cn("mc-ridgeline__tipTitle", "tipTitle")}>{tipSeries.label}</p>
        <p class={cn("mc-ridgeline__tipValue", "tipValue")}><span class={cn("mc-ridgeline__tipKey", "tipKey")}>Median</span><span>{format(tipStats.median)}</span></p>
        <p class={cn("mc-ridgeline__tipRow", "tipRow")}><span class={cn("mc-ridgeline__tipKey", "tipKey")}>Middle half</span><span>{format(tipStats.q1)} to {format(tipStats.q3)}</span></p>
        <p class={cn("mc-ridgeline__tipRow", "tipRow")}><span class={cn("mc-ridgeline__tipKey", "tipKey")}>Range</span><span>{format(tipStats.min)} to {format(tipStats.max)}</span></p>
        {#if held?.value != null}<p class={cn("mc-ridgeline__tipNote", "tipNote")}>{percent.format(tipBelow)} at or below {format(held.value)}</p>{/if}
      {/if}
    </div>
  </div>
  {#if tint && !empty}
    <div class={cn("mc-ridgeline__scale", "scale")} aria-hidden="true">
      <span class={cn("mc-ridgeline__scaleLabel", "scaleLabel")}>Median</span>
      <span>{format(model.lo)}</span>
      <span class={cn("mc-ridgeline__steps", "steps")}>{#each [0, 0.25, 0.5, 0.75, 1] as level (level)}<span class={cn("mc-ridgeline__step", "step")} style:--ridge={toneOf(level)}></span>{/each}</span>
      <span>{format(model.hi)}</span>
    </div>
  {/if}
  <p class="mc-ridgeline__srOnly" aria-live="polite" aria-atomic="true">{activeSeries ? `${describe(activeSeries)}${reading ? `. ${percent.format(reading.below)} at or below ${format(reading.value)}` : ""}` : ""}</p>
  {#if !empty}
    <div class="mc-ridgeline__srOnly"><table>
      <caption>{label}</caption>
      <thead><tr><th scope="col">Series</th><th scope="col">Median</th><th scope="col">First quartile</th><th scope="col">Third quartile</th><th scope="col">Lowest</th><th scope="col">Highest</th><th scope="col">Count</th></tr></thead>
      <tbody>{#each series as entry (entry.id)}{@const s = model.stats.get(entry.id)!}<tr><th scope="row">{entry.label}</th><td>{format(s.median)}</td><td>{format(s.q1)}</td><td>{format(s.q3)}</td><td>{format(s.min)}</td><td>{format(s.max)}</td><td>{s.n}</td></tr>{/each}</tbody>
    </table></div>
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-ridgeline__figure { display: grid; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-ridgeline__css. */

.mc-ridgeline__plot { position: relative; min-width: 0; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: crosshair; }
.mc-ridgeline__svg { position: absolute; inset: 0; display: block; overflow: visible; }

/* Ridges are opaque, so each one hides the valleys of the row behind it. */
.mc-ridgeline__ridge { transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-ridgeline__fill { fill: color-mix(in oklab, var(--ridge) 34%, var(--surface)); stroke: none; transition: fill var(--duration-considered) var(--ease-standard); }
.mc-ridgeline__line { fill: none; stroke: var(--ridge); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; transition: stroke var(--duration-considered) var(--ease-standard); }
.mc-ridgeline__median { stroke: color-mix(in oklab, var(--ridge) 55%, var(--surface)); stroke-width: 1; transition: stroke var(--duration-considered) var(--ease-standard); }
.mc-ridgeline__plot[data-active] .mc-ridgeline__ridge[data-dim] { opacity: .38; }
.mc-ridgeline__ridge[data-lifted] { opacity: 0; transition-duration: var(--duration-instant); }

/* The lifted ridge is a copy drawn above the rest, so it can rise over its neighbours. */
.mc-ridgeline__lens { opacity: 0; pointer-events: none; transform: translateY(0); transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-ridgeline__lens[data-on] { opacity: 1; transform: translateY(-6px); }
.mc-ridgeline__lensFill { fill: color-mix(in oklab, var(--ridge) 18%, var(--surface)); stroke: none; }
.mc-ridgeline__lensBand { fill: color-mix(in oklab, var(--ridge) 48%, var(--surface)); stroke: none; }
.mc-ridgeline__lensMedian { stroke: var(--foreground); stroke-width: 1.5; stroke-linecap: round; }
.mc-ridgeline__lensLine { fill: none; stroke: var(--ridge); stroke-width: 2.25; stroke-linejoin: round; stroke-linecap: round; }

.mc-ridgeline__ticks { position: absolute; top: 0; right: 0; left: 0; pointer-events: none; }
.mc-ridgeline__tick { position: absolute; bottom: 0; left: 0; width: 1px; background: var(--border-subtle); will-change: transform; animation: mc-ridgeline-tickIn var(--duration-standard) var(--ease-standard); }
.mc-ridgeline__tickLabel { position: absolute; bottom: 0; left: 0; color: var(--text-muted); font-size: var(--text-xs); line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums; translate: -50% 0; }
@keyframes mc-ridgeline-tickIn { from { opacity: 0; } }

.mc-ridgeline__crosshair { position: absolute; left: 0; width: 1px; background: var(--foreground); opacity: 0; pointer-events: none; transition: opacity var(--duration-instant) var(--ease-standard); }
.mc-ridgeline__plot[data-cursor] .mc-ridgeline__crosshair { opacity: .35; }

.mc-ridgeline__labels { position: absolute; inset: 0; pointer-events: none; }
.mc-ridgeline__rowLabel { position: absolute; left: 0; overflow: hidden; color: var(--text-secondary); font-size: var(--text-xs); line-height: 18px; text-overflow: ellipsis; white-space: nowrap; transition: color var(--duration-fast) var(--ease-standard); }
.mc-ridgeline__rowLabel[data-active] { color: var(--foreground); font-weight: 500; }

.mc-ridgeline__message { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); pointer-events: none; }

.mc-ridgeline__tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 170px; max-width: min(240px, 100%); gap: 2px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-ridgeline__plot[data-active] .mc-ridgeline__tooltip { opacity: 1; scale: 1; }
.mc-ridgeline__tipTitle { margin: 0 0 2px; color: var(--text-secondary); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-ridgeline__tipValue, .mc-ridgeline__tipRow { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mc-ridgeline__tipValue { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: 1.4; }
.mc-ridgeline__tipRow { color: var(--foreground); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-ridgeline__tipKey { color: var(--text-muted); font-weight: 400; }
.mc-ridgeline__tipValue .mc-ridgeline__tipKey { font-size: var(--text-xs); }
.mc-ridgeline__tipNote { margin: 4px 0 0; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }

.mc-ridgeline__scale { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; margin-top: var(--space-3); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }
.mc-ridgeline__scaleLabel { margin-right: 4px; color: var(--text-secondary); }
.mc-ridgeline__steps { display: inline-flex; gap: 2px; }
.mc-ridgeline__step { width: 18px; height: 10px; border-radius: 3px; background: var(--ridge); }

.mc-ridgeline__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-ridgeline__ridge, .mc-ridgeline__lens, .mc-ridgeline__crosshair, .mc-ridgeline__tooltip, .mc-ridgeline__rowLabel { transition: none; }
  .mc-ridgeline__tick { animation: none; }
}
}
</style>
