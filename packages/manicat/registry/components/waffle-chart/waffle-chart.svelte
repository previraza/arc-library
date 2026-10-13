<script lang="ts" module>
  export interface WaffleCategory {
    key: string;
    label: string;
    value: number;
    color?: string;
  }
</script>

<script lang="ts">
  interface Props {
    data: WaffleCategory[];
    label: string;
    unit?: string;
    formatValue?: (value: number, category: WaffleCategory) => string;
    rows?: number;
    columns?: number;
    accentKey?: string | null;
    legend?: boolean;
    decimals?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: grid, cell, readout or legend. */
    classNames?: { grid?: string; cell?: string; readout?: string; legend?: string };
  }

  let { data, label, unit = "", formatValue, rows = 10, columns = 10, accentKey = null, legend = true, decimals = 0, emptyLabel = "No data yet", classNames }: Props = $props();

  let active = $state<string | null>(null);
  const fmt = (n: number, category: WaffleCategory) => (formatValue ? formatValue(n, category) : n.toLocaleString());
  const total = $derived(data.reduce((sum, category) => sum + category.value, 0));
  const color = (index: number) => data[index].color ?? `var(--series-${(index % 4) + 1})`;
  const picked = $derived(data.find((category) => category.key === active));

  // Largest-remainder allocation, so the squares always add up to the grid.
  const owners = $derived.by(() => {
    const cells = rows * columns;
    const exact = data.map((category) => (category.value / Math.max(1, total)) * cells);
    const counts = exact.map(Math.floor);
    const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
    for (let left = cells - counts.reduce((sum, count) => sum + count, 0), at = 0; left > 0 && order.length; left -= 1, at += 1) counts[order[at % order.length].index] += 1;
    return counts.flatMap((count, index) => Array<number>(count).fill(index));
  });
</script>

<figure class="mc-waffle">
  {#if total <= 0}
    <p class="mc-waffle__empty">{emptyLabel}</p>
  {:else}
    <p class={["mc-waffle__readout", classNames?.readout]} aria-live="polite">{picked ? `${picked.label}: ${fmt(picked.value, picked)}${unit ? ` ${unit}` : ""} · ${((picked.value / total) * 100).toFixed(decimals)}%` : " "}</p>
    <div class={["mc-waffle__grid", classNames?.grid]} role="img" aria-label="{label}. {data.map((category) => `${category.label} ${fmt(category.value, category)}, ${((category.value / total) * 100).toFixed(decimals)}%`).join(', ')}" style="grid-template-columns: repeat({columns}, 1fr)">
      {#each owners as owner, index (index)}
        <span
          class={["mc-waffle__cell", classNames?.cell]}
          style="background: {color(owner)}; opacity: {(accentKey && data[owner].key !== accentKey) || (active && data[owner].key !== active) ? 0.3 : 1}"
          role="presentation"
          onpointerenter={() => (active = data[owner].key)}
          onpointerleave={() => (active = null)}
        ></span>
      {/each}
    </div>
    {#if legend}
      <figcaption class={["mc-waffle__legend", classNames?.legend]}>
        {#each data as category, index (category.key)}
          <button type="button" onpointerenter={() => (active = category.key)} onpointerleave={() => (active = null)} onfocus={() => (active = category.key)} onblur={() => (active = null)}><span class="mc-waffle__swatch" style="background: {color(index)}"></span>{category.label}</button>
        {/each}
      </figcaption>
    {/if}
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-waffle { display: grid; gap: var(--space-3); margin: 0; width: fit-content; }
.mc-waffle__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-waffle__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-waffle__grid { display: grid; gap: 4px; width: 14rem; }
.mc-waffle__cell { aspect-ratio: 1; border-radius: 4px; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-waffle__legend { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.mc-waffle__legend button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-waffle__swatch { width: 10px; height: 10px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) { .mc-waffle__cell { transition: none; } }
}
</style>
