<script lang="ts" module>
  export interface BarChartDatum {
    key: string;
    label: string;
    axisLabel?: string;
    value: number;
  }
</script>

<script lang="ts">
  import { compact, niceMax, ticks } from "@/lib/chart";

  interface Props {
    data: BarChartDatum[];
    label: string;
    period: string;
    unit?: string;
    averageLabel?: string;
    showAverage?: boolean;
    height?: number;
    formatValue?: (value: number) => string;
    /** Extend the inner, named parts of the chart: readout, plot, bar or axis. */
    classNames?: { readout?: string; plot?: string; bar?: string; axis?: string };
  }

  let { data, label, period, unit = "", averageLabel = "Average", showAverage = false, height = 180, formatValue, classNames }: Props = $props();

  let active = $state<string | null>(null);
  const fmt = (n: number) => (formatValue ? formatValue(n) : n.toLocaleString());
  const max = $derived(niceMax(Math.max(...data.map((datum) => datum.value), 0)));
  const average = $derived(data.reduce((sum, datum) => sum + datum.value, 0) / Math.max(1, data.length));
  const picked = $derived(data.find((datum) => datum.key === active));
  const grid = $derived(ticks(max, 2).slice(1));
</script>

<figure class="mc-bar" aria-label="{label}, {period}">
  <figcaption class="mc-bar__head"><strong>{label}</strong><span>{period}</span></figcaption>
  <p class={["mc-bar__readout", classNames?.readout]} aria-live="polite">{picked ? `${picked.label}: ${fmt(picked.value)}${unit ? ` ${unit}` : ""}` : showAverage ? `${averageLabel}: ${fmt(Math.round(average))}${unit ? ` ${unit}` : ""}` : " "}</p>
  <div class={["mc-bar__plot", classNames?.plot]} style="height: {height}px">
    {#each grid as tick (tick)}
      <span class="mc-bar__grid" style="bottom: {(tick / max) * 100}%"><small>{compact(tick)}</small></span>
    {/each}
    {#if showAverage}<span class="mc-bar__average" style="bottom: {(average / max) * 100}%"></span>{/if}
    {#each data as datum (datum.key)}
      <button
        type="button"
        class="mc-bar__column"
        aria-label="{datum.label}, {fmt(datum.value)}"
        aria-pressed={active === datum.key}
        onclick={() => (active = active === datum.key ? null : datum.key)}
        onpointerenter={() => (active = datum.key)}
        onpointerleave={() => (active = null)}
        onfocus={() => (active = datum.key)}
        onblur={() => (active = null)}
      >
        <span class={["mc-bar__bar", classNames?.bar]} data-dim={(active !== null && active !== datum.key) || undefined} style="height: {Math.max(1, (datum.value / max) * 100)}%"></span>
      </button>
    {/each}
  </div>
  <div class="mc-bar__axis">{#each data as datum (datum.key)}<span class={classNames?.axis}>{datum.axisLabel ?? datum.label}</span>{/each}</div>
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-bar { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-bar__head { display: flex; justify-content: space-between; font-size: var(--text-sm); } .mc-bar__head span { color: var(--text-muted); font-size: var(--text-xs); }
.mc-bar__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-bar__plot { position: relative; display: flex; align-items: flex-end; gap: 6px; }
.mc-bar__grid { position: absolute; left: 0; right: 0; border-top: 1px solid var(--border); pointer-events: none; } .mc-bar__grid small { position: absolute; top: -14px; color: var(--text-muted); font-size: 10px; }
.mc-bar__average { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--text-muted); pointer-events: none; }
.mc-bar__column { display: flex; flex: 1; align-items: flex-end; height: 100%; padding: 0; border: 0; background: transparent; cursor: pointer; }
.mc-bar__bar { display: block; width: 100%; border-radius: 6px 6px 0 0; background: var(--series-1, var(--accent)); transition: height .5s var(--ease-enter), opacity var(--duration-fast) var(--ease-standard); }
.mc-bar__bar[data-dim] { opacity: .35; }
.mc-bar__column:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-bar__axis { display: flex; gap: 6px; } .mc-bar__axis span { flex: 1; color: var(--text-muted); font-size: 11px; text-align: center; }
@media (prefers-reduced-motion: reduce) { .mc-bar__bar { transition: none; } }
}
</style>
