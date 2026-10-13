<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";
import { createGauge, gaugeTrack } from "@/lib/gauge";
import type { GaugeThreshold, GaugeTone } from "@/lib/gauge";

export type { GaugeThreshold };

const props = withDefaults(
  defineProps<{
    value: number;
    min?: number;
    max?: number;
    label: string;
    detail?: string;
    tone?: GaugeTone;
    /** A band that starts at `from`: the highest band the value reaches sets the tone and names the state, so it never rests on color alone. */
    thresholds?: GaugeThreshold[];
    /** Extend the inner, named parts of the gauge: visual, readout, number, unit, sizer, status or detail. */
    classNames?: { visual?: string; readout?: string; number?: string; unit?: string; sizer?: string; status?: string; detail?: string };
  }>(),
  { min: 0, max: 100, tone: "accent" },
);

const safeMax = computed(() => (props.max > props.min ? props.max : props.min + 1));
const percentage = computed(() => Math.min(1, Math.max(0, (props.value - props.min) / (safeMax.value - props.min))));
const displayValue = computed(() => Math.round(percentage.value * 100));
const band = computed(() => [...(props.thresholds ?? [])].sort((a, b) => a.from - b.from).filter((threshold) => props.value >= threshold.from - 1e-6).pop());

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const figure = ref<HTMLElement>();
const arc = ref<SVGPathElement>();
const digits = ref<HTMLElement>();
const sizer = ref<HTMLElement>();
const status = ref<HTMLElement>();
const labelText = ref<HTMLElement>();
const detailText = ref<HTMLElement>();
let direction = 1;
let gauge: ReturnType<typeof createGauge> | undefined;
const swaps: LabelSwap[] = [];

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const options = () => ({ value: props.value, min: props.min, max: props.max, tone: props.tone, thresholds: props.thresholds, reduced, toneClass: (tone: GaugeTone) => `mc-gauge__${tone}`, onDirection: (next: number) => (direction = next) });

onMounted(() => {
  gauge = createGauge({ figure: figure.value!, arc: arc.value!, digits: digits.value!, sizer: sizer.value!, status: status.value?.querySelector<HTMLElement>(".mc-gauge__text") ?? undefined }, options());
  // Label, status and detail copy swap in place: the outgoing line is popped out of flow while the new one rises in.
  for (const [text, dir] of [[labelText.value, () => 1], [detailText.value, () => direction], [status.value?.querySelector<HTMLElement>(".mc-gauge__text"), () => direction]] as const) {
    const box = text?.parentElement;
    if (text && box) swaps.push(createLabelSwap(box, box, text, { reduced, width: false, variant: "rise", direction: dir }));
  }
});
watch([() => props.value, () => props.min, () => props.max, () => props.tone, () => props.thresholds], () => gauge?.update(options()), { deep: true });
onBeforeUnmount(() => {
  gauge?.destroy();
  swaps.forEach((swap) => swap.destroy());
});
</script>

<template>
  <figure ref="figure" :class="cn('mc-gauge__figure', `mc-gauge__${tone}`)" :aria-label="`${label}: ${value} of ${safeMax}${band ? `, ${band.label}` : ''}`">
    <div :class="cn('mc-gauge__visual', classNames?.visual)" role="meter" :aria-label="label" :aria-valuemin="min" :aria-valuemax="safeMax" :aria-valuenow="Math.min(safeMax, Math.max(min, value))" :aria-valuetext="`${displayValue}%${band ? `, ${band.label}` : ''}`">
      <svg viewBox="0 0 100 90" aria-hidden="true" focusable="false"><path class="mc-gauge__track" :d="gaugeTrack" /><path ref="arc" class="mc-gauge__arc" /></svg>
      <div :class="cn('mc-gauge__readout', classNames?.readout)" aria-hidden="true">
        <span :class="cn('mc-gauge__number', classNames?.number)"><span ref="digits" class="mc-gauge__digits" /><span :class="cn('mc-gauge__unit', classNames?.unit)">%</span><span ref="sizer" :class="cn('mc-gauge__sizer', classNames?.sizer)">{{ displayValue }}</span></span>
        <span v-if="thresholds" ref="status" :class="cn('mc-gauge__status', classNames?.status)"><span class="mc-gauge__swap"><span class="mc-gauge__text" /></span></span>
      </div>
    </div>
    <figcaption>
      <strong><span class="mc-gauge__swap"><span ref="labelText" class="mc-gauge__text">{{ label }}</span></span></strong>
      <span v-if="detail" :class="cn('mc-gauge__detail', classNames?.detail)"><span class="mc-gauge__swap"><span ref="detailText" class="mc-gauge__text">{{ detail }}</span></span></span>
    </figcaption>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-gauge__figure { display: grid; justify-items: center; min-width: 0; gap: 10px; margin: 0; text-align: center; }.mc-gauge__figure figcaption { display: grid; gap: 3px; min-width: 0; }.mc-gauge__figure strong { font-size: var(--text-sm); font-weight: 500; }.mc-gauge__detail { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-gauge__accent { --gauge-color: var(--accent); --gauge-text: var(--accent-strong); }.mc-gauge__success { --gauge-color: var(--success); --gauge-text: var(--success); }.mc-gauge__warning { --gauge-color: var(--warning); --gauge-text: var(--warning); }.mc-gauge__danger { --gauge-color: var(--danger); --gauge-text: var(--danger); }

/* An activity style ring: a thick stroke with round caps over a faint tint of its own color. The stroke scales with the ring. */
.mc-gauge__visual { position: relative; width: min(100%, 176px); aspect-ratio: 100 / 90; }
.mc-gauge__visual svg { display: block; width: 100%; height: 100%; overflow: visible; }
.mc-gauge__track, .mc-gauge__arc { fill: none; stroke-width: 9; stroke-linecap: round; transition: stroke var(--duration-standard) var(--ease-standard); }
.mc-gauge__track { stroke: color-mix(in oklab, var(--gauge-color) 13%, transparent); }
.mc-gauge__arc { stroke: var(--gauge-color); }

/* The readout sits on the ring's true centre, which is the middle of a square as wide as the ring. */
.mc-gauge__readout { position: absolute; top: 0; left: 0; display: grid; width: 100%; aspect-ratio: 1; place-content: center; justify-items: center; gap: 4px; pointer-events: none; }
.mc-gauge__number { position: relative; display: inline-flex; align-items: baseline; color: var(--foreground); font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 500; letter-spacing: var(--tracking-display); line-height: 1; font-variant-numeric: tabular-nums; }
.mc-gauge__digits { display: inline-flex; justify-content: flex-end; white-space: nowrap; }
.mc-gauge__unit { margin-left: 1px; color: var(--text-secondary); font-family: var(--font-body); font-size: .5em; letter-spacing: 0; }
.mc-gauge__sizer { position: absolute; top: 0; left: 0; visibility: hidden; white-space: nowrap; pointer-events: none; }
.mc-gauge__status { min-width: 100px; min-height: 1.4em; color: var(--gauge-text); font-size: var(--text-xs); font-weight: 500; line-height: 1.4; transition: color var(--duration-standard) var(--ease-standard); }

/* Label, status and detail copy swap in place: the outgoing line is popped out of flow while the new one rises in. */
.mc-gauge__swap { position: relative; display: block; }
.mc-gauge__swap > .mc-gauge__text { display: inline-block; }
@media (prefers-reduced-motion: reduce) { .mc-gauge__track, .mc-gauge__arc, .mc-gauge__status { transition: none; } }
</style>
