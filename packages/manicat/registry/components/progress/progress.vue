<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    /** Extend the inner, named parts of the progress: meta, label, value, track or fill. */
    classNames?: { meta?: string; label?: string; value?: string; track?: string; fill?: string };
  }>(),
  { value: 0, max: 100, showValue: false },
);

const percent = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)));
</script>

<template>
  <div
    class="mc-progress"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
    :data-complete="percent >= 100 ? '' : undefined"
  >
    <div v-if="label || showValue" :class="['mc-progress__meta', classNames?.meta]">
      <span :class="classNames?.label">{{ label }}</span>
      <span v-if="showValue" :class="['mc-progress__value', classNames?.value]">{{ Math.round(percent) }}%</span>
    </div>
    <div :class="['mc-progress__track', classNames?.track]">
      <span :class="['mc-progress__fill', classNames?.fill]" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-progress { width: 100%; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-progress__meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; line-height: var(--leading-body); }
.mc-progress__value { flex: none; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.mc-progress[data-complete] .mc-progress__value { color: var(--success); }
.mc-progress__track { height: 7px; overflow: hidden; border: 1px solid var(--border); border-radius: 99px; background: var(--surface-muted); }
.mc-progress__fill { display: block; height: 100%; border-radius: inherit; background: var(--accent); transition: width .32s var(--ease-enter), background-color var(--duration-standard) var(--ease-standard); }
.mc-progress[data-complete] .mc-progress__fill { background: var(--success); }
@media (prefers-reduced-motion: reduce) { .mc-progress__fill { transition: none; } }
</style>
