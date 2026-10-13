<script setup lang="ts">
import { useId } from "vue";

export interface Segment {
  value: string;
  label: string;
}

const props = defineProps<{
  options: Segment[];
  label?: string;
  /** Extend the inner, named parts of the segmented control: track, button or text. */
  classNames?: { track?: string; button?: string; text?: string };
}>();

/** `v-model` binds the selected segment's value. An `accessory-<value>` slot adds content after a label. */
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
  <div :class="['mc-segmented', classNames?.track]" role="radiogroup" :aria-label="label">
    <button
      v-for="(option, index) in options"
      :id="`${id}-${index}`"
      :key="option.value"
      type="button"
      role="radio"
      :class="['mc-segmented__button', classNames?.button]"
      :aria-checked="model === option.value"
      :tabindex="model === option.value || (model === undefined && index === 0) ? 0 : -1"
      :data-state="model === option.value ? 'checked' : 'unchecked'"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      <span :class="classNames?.text">{{ option.label }}</span>
      <slot :name="`accessory-${option.value}`" />
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-segmented { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); }
.mc-segmented__button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid transparent; border-radius: calc(var(--radius-control) - 3px); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-segmented__button:hover { color: var(--foreground); } }
.mc-segmented__button[data-state="checked"] { border-color: var(--border); background: var(--surface); color: var(--accent-strong); box-shadow: var(--shadow-resting); }
.mc-segmented__button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .mc-segmented__button { transition: none; } }
</style>
