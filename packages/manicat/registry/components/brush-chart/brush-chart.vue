<script setup lang="ts">
import { computed, ref } from "vue";
import Slider from "@/registry/components/slider/slider.vue";
import { areaPath, compact, linePath, linearScale, niceMax, ticks } from "@/lib/chart";

export interface BrushChartDatum {
  date: Date | number;
  value: number;
}

export interface BrushChartAnnotation {
  date: Date | number;
  label: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    data: BrushChartDatum[];
    label: string;
    unit?: string;
    formatValue?: (value: number) => string;
    formatDate?: (date: Date) => string;
    annotations?: BrushChartAnnotation[];
    height?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the chart: readout or annotation. */
    classNames?: { readout?: string; annotation?: string };
  }>(),
  { unit: "", annotations: () => [], height: 200, emptyLabel: "No data yet" },
);

const W = 640;
const LEFT = 36;
const time = (date: Date | number) => new Date(date).getTime();
const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : n.toLocaleString());
const day = (date: Date) => (props.formatDate ? props.formatDate(date) : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

const sorted = computed(() => [...props.data].sort((a, b) => time(a.date) - time(b.date)));
const first = computed(() => time(sorted.value[0]?.date ?? 0));
const last = computed(() => time(sorted.value[sorted.value.length - 1]?.date ?? 0));
/** `v-model:range` binds the visible window as two timestamps; it starts as the whole series. */
const range = defineModel<[number, number] | undefined>("range");
const window = computed<[number, number]>(() => range.value ?? [first.value, last.value]);
const active = ref<number | null>(null);
const svg = ref<SVGSVGElement>();

const visible = computed(() => sorted.value.filter((datum) => time(datum.date) >= window.value[0] && time(datum.date) <= window.value[1]));
const shown = computed(() => (visible.value.length > 1 ? visible.value : sorted.value));
const max = computed(() => niceMax(Math.max(...shown.value.map((datum) => datum.value), 0)));
const x = computed(() => linearScale([time(shown.value[0]?.date ?? 0), time(shown.value[shown.value.length - 1]?.date ?? 1)], [LEFT, W - 8]));
const y = computed(() => linearScale([0, max.value], [props.height - 8, 8]));
const points = computed<[number, number][]>(() => shown.value.map((datum) => [x.value(time(datum.date)), y.value(datum.value)]));
const picked = computed(() => (active.value === null ? null : shown.value[active.value]));
const notes = computed(() => props.annotations.filter((note) => time(note.date) >= window.value[0] && time(note.date) <= window.value[1]));

function onMove(event: PointerEvent) {
  const box = svg.value?.getBoundingClientRect();
  if (!box) return;
  const px = ((event.clientX - box.left) / box.width) * W;
  active.value = shown.value.reduce((best, datum, index) => (Math.abs(x.value(time(datum.date)) - px) < Math.abs(x.value(time(shown.value[best].date)) - px) ? index : best), 0);
}
</script>

<template>
  <figure class="mc-brush">
    <figcaption class="mc-brush__title">{{ label }}</figcaption>
    <p v-if="sorted.length === 0" class="mc-brush__empty">{{ emptyLabel }}</p>
    <template v-else>
      <p :class="['mc-brush__readout', classNames?.readout]" aria-live="polite">{{ picked ? `${day(new Date(picked.date))}: ${fmt(picked.value)}${unit ? ` ${unit}` : ""}` : `${day(new Date(window[0]))} – ${day(new Date(window[1]))}` }}</p>
      <svg ref="svg" class="mc-brush__svg" :viewBox="`0 0 ${W} ${height}`" role="img" :aria-label="`${label}, ${day(new Date(window[0]))} to ${day(new Date(window[1]))}`" @pointermove="onMove" @pointerleave="active = null">
        <g v-for="tick in ticks(max, 3)" :key="tick"><line :x1="LEFT" :x2="W - 8" :y1="y(tick)" :y2="y(tick)" class="mc-brush__grid" /><text :x="LEFT - 6" :y="y(tick) + 3" class="mc-brush__tick">{{ compact(tick) }}</text></g>
        <path :d="areaPath(points, y(0), 'smooth')" class="mc-brush__area" /><path :d="linePath(points, 'smooth')" class="mc-brush__line" />
        <line v-for="note in notes" :key="String(note.date)" :x1="x(time(note.date))" :x2="x(time(note.date))" y1="8" :y2="height - 8" class="mc-brush__note" />
        <circle v-if="picked" :cx="x(time(picked.date))" :cy="y(picked.value)" r="4" class="mc-brush__dot" />
      </svg>
      <Slider :model-value="[window[0], window[1]]" label="Window" :min="first" :max="last" :step="Math.max(1, Math.round((last - first) / 200))" :show-value="false" :format="(n) => day(new Date(n))" @update:model-value="(next) => (range = next as [number, number])" />
      <p v-for="note in notes" :key="String(note.date)" :class="['mc-brush__annotation', classNames?.annotation]">{{ day(new Date(note.date)) }} · {{ note.label }}<template v-if="note.description"> — {{ note.description }}</template></p>
    </template>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-brush { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-brush__title { font-size: var(--text-sm); font-weight: 500; } .mc-brush__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-brush__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-brush__svg { width: 100%; height: auto; overflow: visible; }
.mc-brush__grid { stroke: var(--border); } .mc-brush__tick { fill: var(--text-muted); font-size: 10px; text-anchor: end; }
.mc-brush__line { fill: none; stroke: var(--series-1, var(--accent)); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; } .mc-brush__area { fill: var(--series-1, var(--accent)); fill-opacity: .1; }
.mc-brush__note { stroke: var(--warning); stroke-dasharray: 3 3; } .mc-brush__dot { fill: var(--surface); stroke: var(--series-1, var(--accent)); stroke-width: 2; }
.mc-brush__annotation { margin: 0; color: var(--warning); font-size: var(--text-xs); }
</style>
