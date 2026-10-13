<script lang="ts" module>
  export interface SlopeItem {
    key: string;
    label: string;
    start: number;
    end: number;
  }
</script>

<script lang="ts">
  import { linearScale } from "@/lib/chart";

  interface Props {
    data: SlopeItem[];
    label: string;
    startLabel: string;
    endLabel: string;
    formatValue?: (value: number) => string;
    formatChange?: (change: number, item: SlopeItem) => string;
    height?: number;
    highlightKey?: string | null;
    ranks?: boolean;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: heading or readout. */
    classNames?: { heading?: string; readout?: string };
  }

  let { data, label, startLabel, endLabel, formatValue, formatChange, height = 220, highlightKey = null, ranks = false, emptyLabel = "No data yet", classNames }: Props = $props();

  const W = 560;
  const SIDE = 110;
  let active = $state<string | null>(null);
  const fmt = (n: number) => (formatValue ? formatValue(n) : String(n));
  const change = (item: SlopeItem) => (formatChange ? formatChange(item.end - item.start, item) : `${item.end - item.start > 0 ? "+" : ""}${item.end - item.start}`);
  const y = $derived(linearScale([Math.min(...data.flatMap((i) => [i.start, i.end])), Math.max(...data.flatMap((i) => [i.start, i.end]))], [height - 12, 12]));
  const focus = $derived(active ?? highlightKey);
  const picked = $derived(data.find((item) => item.key === active));
</script>

<figure class="mc-slope">
  <figcaption class="mc-slope__title">{label}</figcaption>
  {#if data.length === 0}
    <p class="mc-slope__empty">{emptyLabel}</p>
  {:else}
    <p class={["mc-slope__readout", classNames?.readout]} aria-live="polite">{picked ? `${picked.label}: ${fmt(picked.start)} → ${fmt(picked.end)} (${change(picked)})` : " "}</p>
    <svg class="mc-slope__svg" viewBox="0 0 {W} {height}" role="img" aria-label="{label}. {data.map((item) => `${item.label} ${fmt(item.start)} to ${fmt(item.end)}`).join(', ')}">
      {#each data as item (item.key)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <g
          data-dim={(focus !== null && focus !== item.key) || undefined}
          data-up={item.end >= item.start || undefined}
          tabindex="0"
          role="img"
          aria-label="{item.label}, {fmt(item.start)} to {fmt(item.end)}"
          class="mc-slope__item"
          onpointerenter={() => (active = item.key)}
          onpointerleave={() => (active = null)}
          onfocus={() => (active = item.key)}
          onblur={() => (active = null)}
        >
          <line x1={SIDE} y1={y(item.start)} x2={W - SIDE} y2={y(item.end)} class="mc-slope__line" />
          <circle cx={SIDE} cy={y(item.start)} r="4" /><circle cx={W - SIDE} cy={y(item.end)} r="4" />
          <text x={SIDE - 10} y={y(item.start) + 4} class="mc-slope__text" text-anchor="end">{item.label} {fmt(item.start)}</text>
          <text x={W - SIDE + 10} y={y(item.end) + 4} class="mc-slope__text">{fmt(item.end)}</text>
        </g>
      {/each}
    </svg>
    <div class="mc-slope__heads"><span class={classNames?.heading}>{startLabel}</span><span class={classNames?.heading}>{endLabel}</span></div>
    {#if ranks}<p class="mc-slope__ranks">Ranked by {endLabel}: {[...data].sort((a, b) => b.end - a.end).map((item) => item.label).join(" › ")}</p>{/if}
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slope { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-slope__title { font-size: var(--text-sm); font-weight: 500; } .mc-slope__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-slope__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-slope__svg { width: 100%; height: auto; overflow: visible; }
.mc-slope__item { --mc-tone: var(--danger); outline: none; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-slope__item[data-up] { --mc-tone: var(--success); } .mc-slope__item[data-dim] { opacity: .35; }
.mc-slope__line { stroke: var(--mc-tone); stroke-width: 2; stroke-linecap: round; }
.mc-slope__item circle { fill: var(--surface); stroke: var(--text-secondary); stroke-width: 1.5; }
.mc-slope__text { fill: var(--foreground); font-size: 11px; font-variant-numeric: tabular-nums; }
.mc-slope__item:focus-visible .mc-slope__line { stroke-width: 4; }
.mc-slope__heads { display: flex; justify-content: space-between; padding: 0 86px; color: var(--text-muted); font-size: var(--text-xs); }
.mc-slope__ranks { margin: 0; color: var(--text-muted); font-size: 11px; }
@media (prefers-reduced-motion: reduce) { .mc-slope__item { transition: none; } }
}
</style>
