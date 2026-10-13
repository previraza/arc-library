<script setup lang="ts">
import { computed } from "vue";

export type GaugeTone = "accent" | "success" | "warning" | "danger";

/** A band that starts at `from`: the highest band the value reaches sets the tone and names the state. */
export interface GaugeThreshold {
  from: number;
  tone: GaugeTone;
  label: string;
}

const props = withDefaults(
  defineProps<{
    value: number;
    min?: number;
    max?: number;
    label: string;
    detail?: string;
    tone?: GaugeTone;
    thresholds?: GaugeThreshold[];
    /** Extend the inner, named parts of the gauge: visual, readout, label or detail. */
    classNames?: { visual?: string; readout?: string; label?: string; detail?: string };
  }>(),
  { min: 0, max: 100, tone: "accent" },
);

const clamped = computed(() => Math.max(props.min, Math.min(props.max, props.value)));
const percent = computed(() => (props.max === props.min ? 0 : ((clamped.value - props.min) / (props.max - props.min)) * 100));
const band = computed(() => (props.thresholds ? [...props.thresholds].sort((a, b) => a.from - b.from).filter((entry) => clamped.value >= entry.from).at(-1) : undefined));
const tone = computed(() => band.value?.tone ?? props.tone);

// A 270° dial: the arc is drawn with a dash, so the fill animates with a plain CSS transition.
const radius = 42;
const full = 2 * Math.PI * radius;
const arc = full * 0.75;
</script>

<template>
  <div class="mc-gauge" role="meter" :aria-label="`${label}${band ? `, ${band.label}` : ''}`" :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="clamped" :data-tone="tone">
    <div :class="['mc-gauge__visual', classNames?.visual]">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="mc-gauge__track" cx="50" cy="50" :r="radius" :stroke-dasharray="`${arc} ${full}`" transform="rotate(135 50 50)" />
        <circle class="mc-gauge__fill" cx="50" cy="50" :r="radius" :stroke-dasharray="`${(arc * percent) / 100} ${full}`" transform="rotate(135 50 50)" />
      </svg>
      <span :class="['mc-gauge__readout', classNames?.readout]">{{ Math.round(percent) }}%</span>
    </div>
    <span :class="['mc-gauge__label', classNames?.label]">{{ label }}</span>
    <span :class="['mc-gauge__detail', classNames?.detail]">{{ band?.label ?? detail }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-gauge { --mc-tone: var(--accent); display: grid; justify-items: center; gap: 2px; text-align: center; }
.mc-gauge[data-tone="success"] { --mc-tone: var(--success); } .mc-gauge[data-tone="warning"] { --mc-tone: var(--warning); } .mc-gauge[data-tone="danger"] { --mc-tone: var(--danger); }
.mc-gauge__visual { position: relative; width: 112px; height: 112px; }
.mc-gauge__visual svg { width: 100%; height: 100%; }
.mc-gauge circle { fill: none; stroke-width: 8; stroke-linecap: round; }
.mc-gauge__track { stroke: var(--surface-muted); }
.mc-gauge__fill { stroke: var(--mc-tone); transition: stroke-dasharray .6s var(--ease-standard), stroke var(--duration-standard) var(--ease-standard); }
.mc-gauge__readout { position: absolute; inset: 0; display: grid; place-items: center; font-size: var(--text-xl); font-weight: 600; font-variant-numeric: tabular-nums; }
.mc-gauge__label { font-size: var(--text-sm); font-weight: 500; }
.mc-gauge__detail { color: var(--text-muted); font-size: var(--text-xs); }
.mc-gauge[data-tone="danger"] .mc-gauge__detail, .mc-gauge[data-tone="warning"] .mc-gauge__detail { color: var(--mc-tone); }
@media (prefers-reduced-motion: reduce) { .mc-gauge__fill { transition: none; } }
</style>
