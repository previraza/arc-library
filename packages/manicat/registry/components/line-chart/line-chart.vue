<script setup lang="ts">
import { computed, ref } from "vue";
import { areaPath, compact, linePath, linearScale, niceMax, ticks } from "@/lib/chart";

export interface LineChartSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
  area?: boolean;
}

export interface LineChartDatum {
  key: string;
  label: string;
  axisLabel?: string;
  values: Record<string, number | undefined>;
}

const props = withDefaults(
  defineProps<{
    data: LineChartDatum[];
    series: LineChartSeries[];
    label: string;
    unit?: string;
    height?: number;
    curve?: "smooth" | "linear";
    legend?: boolean;
    emptyLabel?: string;
    formatValue?: (value: number, series: LineChartSeries) => string;
    formatTick?: (value: number) => string;
    /** Extend the inner, named parts of the chart: readout, legend or axis. */
    classNames?: { readout?: string; legend?: string; axis?: string };
  }>(),
  { unit: "", height: 220, curve: "smooth", legend: true, emptyLabel: "No data yet" },
);

const W = 640;
const LEFT = 36;
const hidden = ref<string[]>([]);
const active = ref<number | null>(null);
const svg = ref<SVGSVGElement>();

const shown = computed(() => props.series.filter((entry) => !hidden.value.includes(entry.key)));
const color = (entry: LineChartSeries) => entry.color ?? `var(--series-${(props.series.indexOf(entry) % 4) + 1})`;
const fmt = (n: number, entry: LineChartSeries) => (props.formatValue ? props.formatValue(n, entry) : n.toLocaleString());
const max = computed(() => niceMax(Math.max(...shown.value.flatMap((entry) => props.data.map((datum) => datum.values[entry.key] ?? 0)), 0)));
const x = computed(() => linearScale([0, Math.max(1, props.data.length - 1)], [LEFT, W - 8]));
const y = computed(() => linearScale([0, max.value], [props.height - 22, 8]));
const grid = computed(() => ticks(max.value, 4));
const paths = computed(() =>
  shown.value.map((entry) => {
    const points = props.data.map((datum, index) => [index, datum.values[entry.key]] as const).filter((p): p is readonly [number, number] => p[1] !== undefined).map(([index, v]): [number, number] => [x.value(index), y.value(v)]);
    return { entry, line: linePath(points, props.curve), area: entry.area ? areaPath(points, y.value(0), props.curve) : "" };
  }),
);
const datum = computed(() => (active.value === null ? null : props.data[active.value]));

function onMove(event: PointerEvent) {
  const box = svg.value?.getBoundingClientRect();
  if (!box) return;
  const px = ((event.clientX - box.left) / box.width) * W;
  active.value = Math.max(0, Math.min(props.data.length - 1, Math.round(((px - LEFT) / (W - 8 - LEFT)) * (props.data.length - 1))));
}

function onKeydown(event: KeyboardEvent) {
  const last = props.data.length - 1;
  if (event.key === "ArrowRight") active.value = Math.min(last, (active.value ?? -1) + 1);
  else if (event.key === "ArrowLeft") active.value = Math.max(0, (active.value ?? 1) - 1);
  else if (event.key === "Escape") active.value = null;
  else return;
  event.preventDefault();
}
</script>

<template>
  <figure class="mc-line">
    <figcaption class="mc-line__title">{{ label }}</figcaption>
    <p v-if="data.length === 0" class="mc-line__empty">{{ emptyLabel }}</p>
    <template v-else>
      <p :class="['mc-line__readout', classNames?.readout]" aria-live="polite">{{ datum ? `${datum.label} · ${shown.map((entry) => `${entry.label} ${fmt(datum!.values[entry.key] ?? 0, entry)}${unit ? ` ${unit}` : ""}`).join(" · ")}` : " " }}</p>
      <svg ref="svg" class="mc-line__svg" :viewBox="`0 0 ${W} ${height}`" role="img" tabindex="0" :aria-label="`${label}. ${shown.map((entry) => entry.label).join(', ')}. Use the arrow keys to read values.`" @pointermove="onMove" @pointerleave="active = null" @keydown="onKeydown" @blur="active = null">
        <g v-for="tick in grid" :key="tick"><line :x1="LEFT" :x2="W - 8" :y1="y(tick)" :y2="y(tick)" class="mc-line__grid" /><text :x="LEFT - 6" :y="y(tick) + 3" class="mc-line__tick">{{ (formatTick ?? compact)(tick) }}</text></g>
        <g v-for="item in paths" :key="item.entry.key" :style="{ '--mc-series': color(item.entry) }">
          <path v-if="item.area" :d="item.area" class="mc-line__area" />
          <path :d="item.line" class="mc-line__line" :stroke-dasharray="item.entry.dashed ? '5 5' : undefined" />
        </g>
        <template v-if="active !== null">
          <line :x1="x(active)" :x2="x(active)" y1="8" :y2="height - 22" class="mc-line__cursor" />
          <circle v-for="entry in shown.filter((e) => data[active!].values[e.key] !== undefined)" :key="entry.key" :cx="x(active)" :cy="y(data[active].values[entry.key] as number)" r="4" class="mc-line__dot" :style="{ '--mc-series': color(entry) }" />
        </template>
      </svg>
      <div class="mc-line__axis"><span v-for="d in data.filter((item) => item.axisLabel)" :key="d.key" :class="classNames?.axis">{{ d.axisLabel }}</span></div>
      <div v-if="legend" :class="['mc-line__legend', classNames?.legend]">
        <button v-for="entry in series" :key="entry.key" type="button" :aria-pressed="!hidden.includes(entry.key)" @click="hidden = hidden.includes(entry.key) ? hidden.filter((key) => key !== entry.key) : [...hidden, entry.key]">
          <span class="mc-line__swatch" :style="{ background: hidden.includes(entry.key) ? 'var(--border)' : color(entry) }" />{{ entry.label }}
        </button>
      </div>
    </template>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-line { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-line__title { font-size: var(--text-sm); font-weight: 500; }
.mc-line__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-line__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-line__svg { width: 100%; height: auto; overflow: visible; outline: none; touch-action: pan-y; }
.mc-line__svg:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 4px; border-radius: 8px; }
.mc-line__grid { stroke: var(--border); stroke-width: 1; } .mc-line__tick { fill: var(--text-muted); font-size: 10px; text-anchor: end; }
.mc-line__line { fill: none; stroke: var(--mc-series); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; } .mc-line__area { fill: var(--mc-series); fill-opacity: .12; }
.mc-line__cursor { stroke: var(--border-strong); } .mc-line__dot { fill: var(--surface); stroke: var(--mc-series); stroke-width: 2; }
.mc-line__axis { display: flex; justify-content: space-between; padding-left: 36px; color: var(--text-muted); font-size: 11px; }
.mc-line__legend { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.mc-line__legend button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-line__legend button[aria-pressed="false"] { color: var(--text-muted); }
.mc-line__swatch { width: 10px; height: 10px; border-radius: 50%; }
</style>
