<script setup lang="ts">
import { computed, ref } from "vue";

export interface WaffleCategory {
  key: string;
  label: string;
  value: number;
  color?: string;
}

const props = withDefaults(
  defineProps<{
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
  }>(),
  { unit: "", rows: 10, columns: 10, accentKey: null, legend: true, decimals: 0, emptyLabel: "No data yet" },
);

const active = ref<string | null>(null);
const fmt = (n: number, category: WaffleCategory) => (props.formatValue ? props.formatValue(n, category) : n.toLocaleString());
const total = computed(() => props.data.reduce((sum, category) => sum + category.value, 0));
const color = (index: number) => props.data[index].color ?? `var(--series-${(index % 4) + 1})`;
const picked = computed(() => props.data.find((category) => category.key === active.value));

// Largest-remainder allocation, so the squares always add up to the grid.
const owners = computed(() => {
  const cells = props.rows * props.columns;
  const exact = props.data.map((category) => (category.value / Math.max(1, total.value)) * cells);
  const counts = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  for (let left = cells - counts.reduce((sum, count) => sum + count, 0), at = 0; left > 0 && order.length; left -= 1, at += 1) counts[order[at % order.length].index] += 1;
  return counts.flatMap((count, index) => Array<number>(count).fill(index));
});
</script>

<template>
  <figure class="mc-waffle">
    <p v-if="total <= 0" class="mc-waffle__empty">{{ emptyLabel }}</p>
    <template v-else>
      <p :class="['mc-waffle__readout', classNames?.readout]" aria-live="polite">{{ picked ? `${picked.label}: ${fmt(picked.value, picked)}${unit ? ` ${unit}` : ""} · ${((picked.value / total) * 100).toFixed(decimals)}%` : " " }}</p>
      <div :class="['mc-waffle__grid', classNames?.grid]" role="img" :aria-label="`${label}. ${data.map((category) => `${category.label} ${fmt(category.value, category)}, ${((category.value / total) * 100).toFixed(decimals)}%`).join(', ')}`" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
        <span v-for="(owner, index) in owners" :key="index" :class="['mc-waffle__cell', classNames?.cell]" :style="{ background: color(owner), opacity: (accentKey && data[owner].key !== accentKey) || (active && data[owner].key !== active) ? 0.3 : 1 }" @pointerenter="active = data[owner].key" @pointerleave="active = null" />
      </div>
      <figcaption v-if="legend" :class="['mc-waffle__legend', classNames?.legend]">
        <button v-for="(category, index) in data" :key="category.key" type="button" @pointerenter="active = category.key" @pointerleave="active = null" @focus="active = category.key" @blur="active = null"><span class="mc-waffle__swatch" :style="{ background: color(index) }" />{{ category.label }}</button>
      </figcaption>
    </template>
  </figure>
</template>

<style>
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
</style>
