<script lang="ts" module>
  export interface DonutChartDatum {
    key: string;
    label: string;
    value: number;
    color?: string;
  }
</script>

<script lang="ts">
  import { arcPath } from "@/lib/chart";

  interface Props {
    data: DonutChartDatum[];
    label: string;
    unit?: string;
    formatValue?: (value: number) => string;
    totalLabel?: string;
    size?: number;
    thickness?: number;
    /** Segments below this share of the total fold into one "Other". */
    groupBelow?: number;
    otherLabel?: string;
    legend?: boolean;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: center, total or legend. */
    classNames?: { center?: string; total?: string; legend?: string };
  }

  let { data, label, unit = "", formatValue, totalLabel = "Total", size = 180, thickness = 22, groupBelow = 0, otherLabel = "Other", legend = true, emptyLabel = "No data yet", classNames }: Props = $props();

  let hidden = $state<string[]>([]);
  let active = $state<string | null>(null);
  const fmt = (n: number) => (formatValue ? formatValue(n) : n.toLocaleString());

  const grandTotal = $derived(data.reduce((sum, datum) => sum + datum.value, 0));
  const items = $derived.by<DonutChartDatum[]>(() => {
    const small = groupBelow > 0 ? data.filter((datum) => datum.value / Math.max(1, grandTotal) < groupBelow) : [];
    return small.length > 1 ? [...data.filter((datum) => !small.includes(datum)), { key: "other", label: otherLabel, value: small.reduce((sum, datum) => sum + datum.value, 0) }] : data;
  });
  const visible = $derived(items.filter((datum) => !hidden.includes(datum.key)));
  const total = $derived(visible.reduce((sum, datum) => sum + datum.value, 0));
  const color = (datum: DonutChartDatum) => datum.color ?? `var(--series-${(items.indexOf(datum) % 4) + 1})`;
  const picked = $derived(items.find((datum) => datum.key === active));

  const arcs = $derived.by(() => {
    const radius = size / 2;
    let angle = 0;
    return visible.map((datum) => {
      const span = (datum.value / Math.max(1, total)) * Math.PI * 2;
      const d = arcPath(radius, radius, radius - 2, radius - thickness, angle, angle + Math.max(0.001, span - 0.02));
      angle += span;
      return { datum, d };
    });
  });
</script>

<figure class="mc-donut">
  {#if grandTotal <= 0}
    <p class="mc-donut__empty">{emptyLabel}</p>
  {:else}
    <div class="mc-donut__visual" style="width: {size}px; height: {size}px" role="img" aria-label="{label}. {items.map((datum) => `${datum.label} ${fmt(datum.value)}`).join(', ')}">
      <svg width={size} height={size} viewBox="0 0 {size} {size}">
        {#each arcs as { datum, d } (datum.key)}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
          <path {d} class="mc-donut__arc" style="fill: {color(datum)}; opacity: {active === null || active === datum.key ? 1 : 0.35}" tabindex="0" role="img" aria-label="{datum.label}, {fmt(datum.value)}" onpointerenter={() => (active = datum.key)} onpointerleave={() => (active = null)} onfocus={() => (active = datum.key)} onblur={() => (active = null)} />
        {/each}
      </svg>
      <div class={["mc-donut__center", classNames?.center]}>
        <strong class={classNames?.total}>{fmt(picked ? picked.value : total)}</strong>
        <span>{picked ? picked.label : `${totalLabel}${unit ? ` · ${unit}` : ""}`}</span>
      </div>
    </div>
    {#if legend}
      <figcaption class={["mc-donut__legend", classNames?.legend]}>
        {#each items as datum (datum.key)}
          <button type="button" aria-pressed={!hidden.includes(datum.key)} onclick={() => (hidden = hidden.includes(datum.key) ? hidden.filter((key) => key !== datum.key) : [...hidden, datum.key])}>
            <span class="mc-donut__swatch" style="background: {hidden.includes(datum.key) ? 'var(--border)' : color(datum)}"></span>{datum.label}<small>{Math.round((datum.value / grandTotal) * 100)}%</small>
          </button>
        {/each}
      </figcaption>
    {/if}
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-donut { display: grid; justify-items: center; gap: var(--space-3); margin: 0; }
.mc-donut__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-donut__visual { position: relative; }
.mc-donut__arc { transition: opacity var(--duration-fast) var(--ease-standard); outline: none; cursor: pointer; }
.mc-donut__arc:focus-visible { stroke: var(--foreground); stroke-width: 2; }
.mc-donut__center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; }
.mc-donut__center strong { font-size: var(--text-xl); font-variant-numeric: tabular-nums; } .mc-donut__center span { color: var(--text-muted); font-size: var(--text-xs); }
.mc-donut__legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }
.mc-donut__legend button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-donut__legend button[aria-pressed="false"] { color: var(--text-muted); } .mc-donut__legend small { color: var(--text-muted); font-variant-numeric: tabular-nums; }
.mc-donut__swatch { width: 10px; height: 10px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) { .mc-donut__arc { transition: none; } }
}
</style>
