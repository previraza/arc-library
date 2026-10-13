<script lang="ts" module>
  export interface BrushChartDatum {
    date: Date | number;
    value: number;
  }

  export interface BrushChartAnnotation {
    date: Date | number;
    label: string;
    description?: string;
  }
</script>

<script lang="ts">
  import Slider from "@/registry/components/slider/slider.svelte";
  import { areaPath, compact, linePath, linearScale, niceMax, ticks } from "@/lib/chart";

  interface Props {
    data: BrushChartDatum[];
    label: string;
    unit?: string;
    formatValue?: (value: number) => string;
    formatDate?: (date: Date) => string;
    annotations?: BrushChartAnnotation[];
    height?: number;
    emptyLabel?: string;
    /** The visible window as two timestamps; it starts as the whole series. Bind it with `bind:range`. */
    range?: [number, number];
    /** Extend the inner, named parts of the chart: readout or annotation. */
    classNames?: { readout?: string; annotation?: string };
  }

  let { data, label, unit = "", formatValue, formatDate, annotations = [], height = 200, emptyLabel = "No data yet", range = $bindable(), classNames }: Props = $props();

  const W = 640;
  const LEFT = 36;
  const time = (date: Date | number) => new Date(date).getTime();
  const fmt = (n: number) => (formatValue ? formatValue(n) : n.toLocaleString());
  const day = (date: Date) => (formatDate ? formatDate(date) : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

  const sorted = $derived([...data].sort((a, b) => time(a.date) - time(b.date)));
  const first = $derived(time(sorted[0]?.date ?? 0));
  const last = $derived(time(sorted[sorted.length - 1]?.date ?? 0));
  const bounds = $derived<[number, number]>(range ?? [first, last]);
  let active = $state<number | null>(null);
  let svg = $state<SVGSVGElement>();

  const visible = $derived(sorted.filter((datum) => time(datum.date) >= bounds[0] && time(datum.date) <= bounds[1]));
  const shown = $derived(visible.length > 1 ? visible : sorted);
  const max = $derived(niceMax(Math.max(...shown.map((datum) => datum.value), 0)));
  const x = $derived(linearScale([time(shown[0]?.date ?? 0), time(shown[shown.length - 1]?.date ?? 1)], [LEFT, W - 8]));
  const y = $derived(linearScale([0, max], [height - 8, 8]));
  const points = $derived<[number, number][]>(shown.map((datum) => [x(time(datum.date)), y(datum.value)]));
  const picked = $derived(active === null ? null : shown[active]);
  const notes = $derived(annotations.filter((note) => time(note.date) >= bounds[0] && time(note.date) <= bounds[1]));

  function onMove(event: PointerEvent) {
    const box = svg?.getBoundingClientRect();
    if (!box) return;
    const px = ((event.clientX - box.left) / box.width) * W;
    active = shown.reduce((best, datum, index) => (Math.abs(x(time(datum.date)) - px) < Math.abs(x(time(shown[best].date)) - px) ? index : best), 0);
  }
</script>

<figure class="mc-brush">
  <figcaption class="mc-brush__title">{label}</figcaption>
  {#if sorted.length === 0}
    <p class="mc-brush__empty">{emptyLabel}</p>
  {:else}
    <p class={["mc-brush__readout", classNames?.readout]} aria-live="polite">{picked ? `${day(new Date(picked.date))}: ${fmt(picked.value)}${unit ? ` ${unit}` : ""}` : `${day(new Date(bounds[0]))} – ${day(new Date(bounds[1]))}`}</p>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <svg bind:this={svg} class="mc-brush__svg" viewBox="0 0 {W} {height}" role="img" aria-label="{label}, {day(new Date(bounds[0]))} to {day(new Date(bounds[1]))}" onpointermove={onMove} onpointerleave={() => (active = null)}>
      {#each ticks(max, 3) as tick (tick)}
        <g><line x1={LEFT} x2={W - 8} y1={y(tick)} y2={y(tick)} class="mc-brush__grid" /><text x={LEFT - 6} y={y(tick) + 3} class="mc-brush__tick">{compact(tick)}</text></g>
      {/each}
      <path d={areaPath(points, y(0), "smooth")} class="mc-brush__area" /><path d={linePath(points, "smooth")} class="mc-brush__line" />
      {#each notes as note (String(note.date))}
        <line x1={x(time(note.date))} x2={x(time(note.date))} y1="8" y2={height - 8} class="mc-brush__note" />
      {/each}
      {#if picked}<circle cx={x(time(picked.date))} cy={y(picked.value)} r="4" class="mc-brush__dot" />{/if}
    </svg>
    <Slider label="Window" min={first} max={last} step={Math.max(1, Math.round((last - first) / 200))} showValue={false} format={(n) => day(new Date(n))} bind:value={() => [bounds[0], bounds[1]], (next) => (range = next as [number, number])} />
    {#each notes as note (String(note.date))}
      <p class={["mc-brush__annotation", classNames?.annotation]}>{day(new Date(note.date))} · {note.label}{#if note.description} — {note.description}{/if}</p>
    {/each}
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-brush { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-brush__title { font-size: var(--text-sm); font-weight: 500; } .mc-brush__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-brush__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-brush__svg { width: 100%; height: auto; overflow: visible; }
.mc-brush__grid { stroke: var(--border); } .mc-brush__tick { fill: var(--text-muted); font-size: 10px; text-anchor: end; }
.mc-brush__line { fill: none; stroke: var(--series-1, var(--accent)); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; } .mc-brush__area { fill: var(--series-1, var(--accent)); fill-opacity: .1; }
.mc-brush__note { stroke: var(--warning); stroke-dasharray: 3 3; } .mc-brush__dot { fill: var(--surface); stroke: var(--series-1, var(--accent)); stroke-width: 2; }
.mc-brush__annotation { margin: 0; color: var(--warning); font-size: var(--text-xs); }
}
</style>
