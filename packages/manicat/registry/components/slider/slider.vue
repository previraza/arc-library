<script setup lang="ts">
import { computed, ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    min?: number;
    max?: number;
    step?: number;
    /** Step for Page Up and Page Down. */
    largeStep?: number;
    format?: (value: number) => string;
    showValue?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the slider: head, track, range or thumb. */
    classNames?: { head?: string; track?: string; range?: string; thumb?: string };
  }>(),
  { min: 0, max: 100, step: 1, showValue: true, disabled: false },
);

const emit = defineEmits<{ commit: [value: number | [number, number]] }>();
/** `v-model` binds a number for one thumb, or a `[low, high]` pair for a range. */
const model = defineModel<number | [number, number]>({ default: 0 });
const id = useId();
const track = ref<HTMLElement>();
const active = ref<0 | 1>(1);

const range = computed(() => Array.isArray(model.value));
const low = computed(() => (Array.isArray(model.value) ? model.value[0] : props.min));
const high = computed(() => (Array.isArray(model.value) ? model.value[1] : model.value));
const fmt = (n: number) => (props.format ? props.format(n) : String(n));
const pct = (n: number) => ((n - props.min) / Math.max(1, props.max - props.min)) * 100;
const snap = (n: number) => Math.max(props.min, Math.min(props.max, Math.round((n - props.min) / props.step) * props.step + props.min));

function set(thumb: 0 | 1, next: number, commit = false) {
  const value = snap(next);
  const result: number | [number, number] = range.value ? (thumb === 0 ? [Math.min(value, high.value), high.value] : [low.value, Math.max(value, low.value)]) : value;
  model.value = result;
  if (commit) emit("commit", result);
}

function at(event: PointerEvent) {
  const box = track.value!.getBoundingClientRect();
  return props.min + (Math.max(0, Math.min(1, (event.clientX - box.left) / box.width))) * (props.max - props.min);
}

function down(event: PointerEvent) {
  if (props.disabled) return;
  const value = at(event);
  active.value = range.value && Math.abs(value - low.value) < Math.abs(value - high.value) ? 0 : 1;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  set(active.value, value);
}

function move(event: PointerEvent) {
  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) set(active.value, at(event));
}

function up(event: PointerEvent) {
  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) set(active.value, at(event), true);
}

function onKeydown(event: KeyboardEvent, thumb: 0 | 1) {
  const current = thumb === 0 ? low.value : high.value;
  const big = props.largeStep ?? props.step * 10;
  const next = { ArrowRight: current + props.step, ArrowUp: current + props.step, ArrowLeft: current - props.step, ArrowDown: current - props.step, PageUp: current + big, PageDown: current - big, Home: props.min, End: props.max }[event.key as "Home"];
  if (next === undefined) return;
  event.preventDefault();
  set(thumb, next, true);
}
</script>

<template>
  <div class="mc-slider" :data-disabled="disabled || undefined">
    <div :class="['mc-slider__head', classNames?.head]">
      <span :id="`${id}-label`" class="mc-slider__label">{{ label }}</span>
      <span v-if="showValue" class="mc-slider__value">{{ range ? `${fmt(low)} – ${fmt(high)}` : fmt(high) }}</span>
    </div>
    <div ref="track" class="mc-slider__hit" @pointerdown="down" @pointermove="move" @pointerup="up">
      <div :class="['mc-slider__track', classNames?.track]">
        <div :class="['mc-slider__range', classNames?.range]" :style="{ left: `${range ? pct(low) : 0}%`, width: `${pct(high) - (range ? pct(low) : 0)}%` }" />
      </div>
      <span
        v-for="thumb in range ? ([0, 1] as const) : ([1] as const)"
        :key="thumb"
        role="slider"
        :class="['mc-slider__thumb', classNames?.thumb]"
        :tabindex="disabled ? -1 : 0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="thumb === 1 && range ? low : min"
        :aria-valuemax="thumb === 0 && range ? high : max"
        :aria-valuenow="thumb === 0 ? low : high"
        :aria-valuetext="fmt(thumb === 0 ? low : high)"
        :style="{ left: `${pct(thumb === 0 ? low : high)}%` }"
        @keydown="onKeydown($event, thumb)"
      />
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slider { display: grid; gap: var(--space-2); }
.mc-slider[data-disabled] { opacity: .5; pointer-events: none; }
.mc-slider__head { display: flex; justify-content: space-between; gap: var(--space-3); font-size: var(--text-sm); }
.mc-slider__label { font-weight: 500; }
.mc-slider__value { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.mc-slider__hit { position: relative; display: flex; align-items: center; height: 28px; margin: 0 12px; cursor: pointer; touch-action: none; }
.mc-slider__track { position: relative; width: 100%; height: 6px; border-radius: 3px; background: var(--control-track); }
.mc-slider__range { position: absolute; top: 0; bottom: 0; border-radius: inherit; background: var(--control-on); }
.mc-slider__thumb { position: absolute; top: 50%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--control-thumb); box-shadow: var(--control-thumb-shadow); transition: transform var(--duration-instant) var(--ease-standard); }
.mc-slider__thumb:active { transform: scale(1.08); }
.mc-slider__thumb:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .mc-slider__thumb { transition: none; } }
</style>
