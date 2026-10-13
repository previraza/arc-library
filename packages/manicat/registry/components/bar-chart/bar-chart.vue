<script setup lang="ts">
import { computed, ref } from "vue";
import { compact, niceMax, ticks } from "@/lib/chart";

export interface BarChartDatum {
  key: string;
  label: string;
  axisLabel?: string;
  value: number;
}

const props = withDefaults(
  defineProps<{
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
  }>(),
  { unit: "", averageLabel: "Average", showAverage: false, height: 180 },
);

const active = ref<string | null>(null);
const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : n.toLocaleString());
const max = computed(() => niceMax(Math.max(...props.data.map((datum) => datum.value), 0)));
const average = computed(() => props.data.reduce((sum, datum) => sum + datum.value, 0) / Math.max(1, props.data.length));
const picked = computed(() => props.data.find((datum) => datum.key === active.value));
const grid = computed(() => ticks(max.value, 2).slice(1));
</script>

<template>
  <figure class="mc-bar" :aria-label="`${label}, ${period}`">
    <figcaption class="mc-bar__head"><strong>{{ label }}</strong><span>{{ period }}</span></figcaption>
    <p :class="['mc-bar__readout', classNames?.readout]" aria-live="polite">{{ picked ? `${picked.label}: ${fmt(picked.value)}${unit ? ` ${unit}` : ""}` : showAverage ? `${averageLabel}: ${fmt(Math.round(average))}${unit ? ` ${unit}` : ""}` : " " }}</p>
    <div :class="['mc-bar__plot', classNames?.plot]" :style="{ height: `${height}px` }">
      <span v-for="tick in grid" :key="tick" class="mc-bar__grid" :style="{ bottom: `${(tick / max) * 100}%` }"><small>{{ compact(tick) }}</small></span>
      <span v-if="showAverage" class="mc-bar__average" :style="{ bottom: `${(average / max) * 100}%` }" />
      <button v-for="datum in data" :key="datum.key" type="button" class="mc-bar__column" :aria-label="`${datum.label}, ${fmt(datum.value)}`" :aria-pressed="active === datum.key" @click="active = active === datum.key ? null : datum.key" @pointerenter="active = datum.key" @pointerleave="active = null" @focus="active = datum.key" @blur="active = null">
        <span :class="['mc-bar__bar', classNames?.bar]" :data-dim="(active !== null && active !== datum.key) || undefined" :style="{ height: `${Math.max(1, (datum.value / max) * 100)}%` }" />
      </button>
    </div>
    <div class="mc-bar__axis"><span v-for="datum in data" :key="datum.key" :class="classNames?.axis">{{ datum.axisLabel ?? datum.label }}</span></div>
  </figure>
</template>

<style>
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
</style>
