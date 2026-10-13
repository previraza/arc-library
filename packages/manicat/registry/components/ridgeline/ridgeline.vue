<script setup lang="ts">
import { computed, ref } from "vue";
import { areaPath, linearScale } from "@/lib/chart";

export interface RidgelineSeries {
  id: string;
  label: string;
  values: number[];
}

const props = withDefaults(
  defineProps<{
    series: RidgelineSeries[];
    label: string;
    unit?: string;
    formatValue?: (value: number) => string;
    /** How far each ridge climbs into the one above, as a multiple of the row height. */
    overlap?: number;
    rowHeight?: number;
    /** Colour each ridge from the series palette instead of one tone. */
    tint?: boolean;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: readout or rowLabel. */
    classNames?: { readout?: string; rowLabel?: string };
  }>(),
  { unit: "", overlap: 0.6, rowHeight: 56, tint: false, emptyLabel: "No data yet" },
);

const W = 560;
const active = ref<string | null>(null);
const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : n.toLocaleString());
const mean = (entry: RidgelineSeries) => entry.values.reduce((sum, value) => sum + value, 0) / Math.max(1, entry.values.length);
const step = computed(() => props.rowHeight * (1 - props.overlap));
const height = computed(() => step.value * (props.series.length - 1) + props.rowHeight + 4);
const top = computed(() => Math.max(1, ...props.series.flatMap((entry) => entry.values)));
const ridges = computed(() =>
  props.series.map((entry, index) => {
    const base = index * step.value + props.rowHeight;
    const x = linearScale([0, Math.max(1, entry.values.length - 1)], [0, W]);
    const y = linearScale([0, top.value], [base, base - props.rowHeight]);
    return { entry, base, d: areaPath(entry.values.map((value, at): [number, number] => [x(at), y(value)]), base, "smooth"), color: props.tint ? `var(--series-${(index % 4) + 1})` : "var(--series-1)" };
  }),
);
const picked = computed(() => props.series.find((entry) => entry.id === active.value));
</script>

<template>
  <figure class="mc-ridge">
    <figcaption class="mc-ridge__title">{{ label }}</figcaption>
    <p v-if="series.length === 0" class="mc-ridge__empty">{{ emptyLabel }}</p>
    <template v-else>
      <p :class="['mc-ridge__readout', classNames?.readout]" aria-live="polite">{{ picked ? `${picked.label}: average ${fmt(Math.round(mean(picked)))}${unit ? ` ${unit}` : ""}` : " " }}</p>
      <svg class="mc-ridge__svg" :viewBox="`0 0 ${W} ${height}`" role="img" :aria-label="`${label}. ${series.map((entry) => `${entry.label} average ${fmt(Math.round(mean(entry)))}`).join(', ')}`">
        <g v-for="ridge in ridges" :key="ridge.entry.id" tabindex="0" :aria-label="`${ridge.entry.label}, average ${fmt(Math.round(mean(ridge.entry)))}`" class="mc-ridge__item" :style="{ '--mc-ridge': ridge.color }" :data-dim="(active !== null && active !== ridge.entry.id) || undefined" @pointerenter="active = ridge.entry.id" @pointerleave="active = null" @focus="active = ridge.entry.id" @blur="active = null">
          <path :d="ridge.d" class="mc-ridge__area" />
          <text x="0" :y="ridge.base - 4" :class="['mc-ridge__label', classNames?.rowLabel]">{{ ridge.entry.label }}</text>
        </g>
      </svg>
    </template>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-ridge { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-ridge__title { font-size: var(--text-sm); font-weight: 500; } .mc-ridge__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-ridge__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-ridge__svg { width: 100%; height: auto; overflow: visible; }
.mc-ridge__item { outline: none; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-standard); } .mc-ridge__item[data-dim] { opacity: .45; }
.mc-ridge__area { fill: var(--mc-ridge); fill-opacity: .35; stroke: var(--mc-ridge); stroke-width: 1.5; }
.mc-ridge__label { fill: var(--text-muted); font-size: 11px; }
@media (prefers-reduced-motion: reduce) { .mc-ridge__item { transition: none; } }
</style>
