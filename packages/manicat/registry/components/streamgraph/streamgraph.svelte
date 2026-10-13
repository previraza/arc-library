<script lang="ts" module>
  export interface StreamgraphSeries {
    key: string;
    label: string;
    color?: string;
  }

  export interface StreamgraphDatum {
    key: string;
    label: string;
    axisLabel?: string;
    values: Record<string, number | undefined>;
  }
</script>

<script lang="ts">
  import { bandPath, linearScale } from "@/lib/chart";

  interface Props {
    data: StreamgraphDatum[];
    series: StreamgraphSeries[];
    label: string;
    unit?: string;
    height?: number;
    /** `silhouette` centres the stack; `zero` sits it on a baseline. */
    offset?: "silhouette" | "zero";
    formatValue?: (value: number, series: StreamgraphSeries) => string;
    legend?: boolean;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: readout, legend or axis. */
    classNames?: { readout?: string; legend?: string; axis?: string };
  }

  let { data, series, label, unit = "", height = 220, offset = "silhouette", formatValue, legend = true, emptyLabel = "No data yet", classNames }: Props = $props();

  const W = 640;
  let focus = $state<string | null>(null);
  const fmt = (n: number, entry: StreamgraphSeries) => (formatValue ? formatValue(n, entry) : n.toLocaleString());
  const color = (entry: StreamgraphSeries) => entry.color ?? `var(--series-${(series.indexOf(entry) % 4) + 1})`;

  const bands = $derived.by(() => {
    const totals = data.map((datum) => series.reduce((sum, entry) => sum + (datum.values[entry.key] ?? 0), 0));
    const peak = Math.max(...totals, 1);
    const x = linearScale([0, Math.max(1, data.length - 1)], [0, W]);
    const y = linearScale(offset === "zero" ? [0, peak] : [-peak / 2, peak / 2], [height, 0]);
    let lower = data.map((_, index) => (offset === "zero" ? 0 : -totals[index] / 2));
    return series.map((entry) => {
      const upper = lower.map((value, index) => value + (data[index].values[entry.key] ?? 0));
      const d = bandPath(upper.map((value, index): [number, number] => [x(index), y(value)]), lower.map((value, index): [number, number] => [x(index), y(value)]), "smooth");
      lower = upper;
      return { entry, d };
    });
  });
  const picked = $derived(series.find((entry) => entry.key === focus));
</script>

<figure class="mc-stream">
  <figcaption class="mc-stream__title">{label}</figcaption>
  {#if data.length === 0}
    <p class="mc-stream__empty">{emptyLabel}</p>
  {:else}
    <p class={["mc-stream__readout", classNames?.readout]} aria-live="polite">{picked ? `${picked.label}: peak ${fmt(Math.max(...data.map((datum) => datum.values[picked.key] ?? 0)), picked)}${unit ? ` ${unit}` : ""}` : " "}</p>
    <svg class="mc-stream__svg" viewBox="0 0 {W} {height}" role="img" aria-label="{label}. {series.map((entry) => entry.label).join(', ')}">
      {#each bands as { entry, d } (entry.key)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <path {d} class="mc-stream__band" tabindex="0" role="img" aria-label={entry.label} style="fill: {color(entry)}; opacity: {focus === null || focus === entry.key ? 0.85 : 0.2}" onpointerenter={() => (focus = entry.key)} onpointerleave={() => (focus = null)} onfocus={() => (focus = entry.key)} onblur={() => (focus = null)} />
      {/each}
    </svg>
    <div class="mc-stream__axis">{#each data.filter((item) => item.axisLabel) as datum (datum.key)}<span class={classNames?.axis}>{datum.axisLabel}</span>{/each}</div>
    {#if legend}
      <div class={["mc-stream__legend", classNames?.legend]}>
        {#each series as entry (entry.key)}
          <button type="button" aria-pressed={focus === entry.key} onclick={() => (focus = focus === entry.key ? null : entry.key)}><span class="mc-stream__swatch" style="background: {color(entry)}"></span>{entry.label}</button>
        {/each}
      </div>
    {/if}
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-stream { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-stream__title { font-size: var(--text-sm); font-weight: 500; } .mc-stream__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-stream__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-stream__svg { width: 100%; height: auto; overflow: visible; }
.mc-stream__band { outline: none; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-stream__axis { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 11px; }
.mc-stream__legend { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.mc-stream__legend button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-stream__swatch { width: 10px; height: 10px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) { .mc-stream__band { transition: none; } }
}
</style>
