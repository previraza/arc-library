<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  value: number;
  suffix?: string;
  /** One line of context under the number, such as the previous period. */
  context: string;
  /** Change since the previous period, such as "+15.2%". A leading minus reads as a decrease. */
  change?: string;
  /** Extend the inner, named parts of the metric card: label, value, change or context. */
  classNames?: { label?: string; value?: string; change?: string; context?: string };
}>();

const down = computed(() => /^[-−]/.test(props.change?.trim() ?? ""));
</script>

<template>
  <div class="mc-metric" role="group" :aria-label="`${label}: ${value.toLocaleString()}${suffix ?? ''}${change ? `, ${change}` : ''}. ${context}`">
    <span :class="['mc-metric__label', classNames?.label]">{{ label }}</span>
    <div class="mc-metric__row">
      <span :class="['mc-metric__value', classNames?.value]">{{ value.toLocaleString() }}<small v-if="suffix">{{ suffix }}</small></span>
      <span v-if="change" :class="['mc-metric__change', { 'mc-metric__change--down': down }, classNames?.change]">{{ change }}</span>
    </div>
    <span :class="['mc-metric__context', classNames?.context]">{{ context }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-metric { display: inline-grid; gap: var(--space-2); min-width: 200px; padding: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-metric__label { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-metric__row { display: flex; align-items: baseline; gap: var(--space-3); }
.mc-metric__value { font-size: 1.875rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-display); }
.mc-metric__value small { margin-left: 2px; color: var(--text-muted); font-size: var(--text-sm); font-weight: 400; }
.mc-metric__change { padding: 2px 8px; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--success) 10%, var(--surface)); color: var(--success); font-size: var(--text-xs); font-weight: 500; }
.mc-metric__change--down { background: color-mix(in oklab, var(--danger) 10%, var(--surface)); color: var(--danger); }
.mc-metric__context { color: var(--text-muted); font-size: var(--text-xs); }
</style>
