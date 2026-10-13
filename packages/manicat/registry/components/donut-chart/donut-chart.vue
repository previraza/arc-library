<script setup lang="ts">
import { computed, ref } from "vue";
import { arcPath } from "@/lib/chart";

export interface DonutChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

const props = withDefaults(
  defineProps<{
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
  }>(),
  { unit: "", totalLabel: "Total", size: 180, thickness: 22, groupBelow: 0, otherLabel: "Other", legend: true, emptyLabel: "No data yet" },
);

const hidden = ref<string[]>([]);
const active = ref<string | null>(null);
const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : n.toLocaleString());

const grandTotal = computed(() => props.data.reduce((sum, datum) => sum + datum.value, 0));
const items = computed<DonutChartDatum[]>(() => {
  const small = props.groupBelow > 0 ? props.data.filter((datum) => datum.value / Math.max(1, grandTotal.value) < props.groupBelow) : [];
  return small.length > 1 ? [...props.data.filter((datum) => !small.includes(datum)), { key: "other", label: props.otherLabel, value: small.reduce((sum, datum) => sum + datum.value, 0) }] : props.data;
});
const visible = computed(() => items.value.filter((datum) => !hidden.value.includes(datum.key)));
const total = computed(() => visible.value.reduce((sum, datum) => sum + datum.value, 0));
const color = (datum: DonutChartDatum) => datum.color ?? `var(--series-${(items.value.indexOf(datum) % 4) + 1})`;
const picked = computed(() => items.value.find((datum) => datum.key === active.value));

const arcs = computed(() => {
  const radius = props.size / 2;
  let angle = 0;
  return visible.value.map((datum) => {
    const span = (datum.value / Math.max(1, total.value)) * Math.PI * 2;
    const d = arcPath(radius, radius, radius - 2, radius - props.thickness, angle, angle + Math.max(0.001, span - 0.02));
    angle += span;
    return { datum, d };
  });
});
</script>

<template>
  <figure class="mc-donut">
    <p v-if="grandTotal <= 0" class="mc-donut__empty">{{ emptyLabel }}</p>
    <template v-else>
      <div class="mc-donut__visual" :style="{ width: `${size}px`, height: `${size}px` }" role="img" :aria-label="`${label}. ${items.map((datum) => `${datum.label} ${fmt(datum.value)}`).join(', ')}`">
        <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
          <path v-for="{ datum, d } in arcs" :key="datum.key" :d="d" class="mc-donut__arc" :style="{ fill: color(datum), opacity: active === null || active === datum.key ? 1 : 0.35 }" tabindex="0" :aria-label="`${datum.label}, ${fmt(datum.value)}`" @pointerenter="active = datum.key" @pointerleave="active = null" @focus="active = datum.key" @blur="active = null" />
        </svg>
        <div :class="['mc-donut__center', classNames?.center]">
          <strong :class="classNames?.total">{{ fmt(picked ? picked.value : total) }}</strong>
          <span>{{ picked ? picked.label : `${totalLabel}${unit ? ` · ${unit}` : ""}` }}</span>
        </div>
      </div>
      <figcaption v-if="legend" :class="['mc-donut__legend', classNames?.legend]">
        <button v-for="datum in items" :key="datum.key" type="button" :aria-pressed="!hidden.includes(datum.key)" @click="hidden = hidden.includes(datum.key) ? hidden.filter((key) => key !== datum.key) : [...hidden, datum.key]">
          <span class="mc-donut__swatch" :style="{ background: hidden.includes(datum.key) ? 'var(--border)' : color(datum) }" />{{ datum.label }}<small>{{ Math.round((datum.value / grandTotal) * 100) }}%</small>
        </button>
      </figcaption>
    </template>
  </figure>
</template>

<style>
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
</style>
