<script setup lang="ts">
import { useId } from "vue";

export interface BillingToggleOption {
  value: string;
  label: string;
  badge?: string;
}

const props = withDefaults(
  defineProps<{
    options?: BillingToggleOption[];
    label?: string;
    /** Extend the inner, named parts of the toggle: track, button or badge. */
    classNames?: { track?: string; button?: string; badge?: string };
  }>(),
  {
    options: () => [
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly", badge: "Save 20%" },
    ],
    label: "Billing period",
  },
);

/** `v-model` binds the selected period. Pair it with a price you compute from the value. */
const model = defineModel<string>();
const id = useId();

function onKeydown(event: KeyboardEvent, index: number) {
  const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  const next = (index + step + props.options.length) % props.options.length;
  model.value = props.options[next].value;
  document.getElementById(`${id}-${next}`)?.focus();
}
</script>

<template>
  <div :class="['mc-billing', classNames?.track]" role="radiogroup" :aria-label="label">
    <button
      v-for="(option, index) in options"
      :id="`${id}-${index}`"
      :key="option.value"
      type="button"
      role="radio"
      :class="['mc-billing__button', classNames?.button]"
      :aria-checked="model === option.value"
      :tabindex="model === option.value || (model === undefined && index === 0) ? 0 : -1"
      :data-state="model === option.value ? 'checked' : 'unchecked'"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
      <span v-if="option.badge" :class="['mc-billing__badge', classNames?.badge]">{{ option.badge }}</span>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-billing { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-billing__button { display: inline-flex; align-items: center; gap: 6px; min-height: var(--control-height-sm); padding: 0 var(--space-4); border: 1px solid transparent; border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-billing__button:hover { color: var(--foreground); } }
.mc-billing__button[data-state="checked"] { border-color: var(--border); background: var(--surface); color: var(--accent-strong); box-shadow: var(--shadow-resting); }
.mc-billing__badge { color: var(--success); font-size: 11px; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .mc-billing__button { transition: none; } }
</style>
