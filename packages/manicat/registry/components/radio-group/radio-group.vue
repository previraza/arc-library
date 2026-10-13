<script setup lang="ts">
import { useId } from "vue";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

const props = defineProps<{
  label: string;
  options: RadioOption[];
  name?: string;
  /** Extend the inner, named parts of the radio group: label, option, mark, dot, optionLabel or description. */
  classNames?: { label?: string; option?: string; mark?: string; dot?: string; optionLabel?: string; description?: string };
}>();

/** `v-model` binds the selected value. Arrow keys move the selection, as in a native radio group. */
const model = defineModel<string>();
const id = useId();

function onKeydown(event: KeyboardEvent, index: number) {
  const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  const next = (index + step + props.options.length) % props.options.length;
  model.value = props.options[next].value;
  document.getElementById(`${id}-${next}`)?.focus();
}
</script>

<template>
  <div class="mc-radio" role="radiogroup" :aria-labelledby="`${id}-label`">
    <span :id="`${id}-label`" :class="['mc-radio__label', classNames?.label]">{{ label }}</span>
    <button
      v-for="(option, index) in options"
      :id="`${id}-${index}`"
      :key="option.value"
      type="button"
      role="radio"
      :class="['mc-radio__option', classNames?.option]"
      :aria-checked="model === option.value"
      :tabindex="model === option.value || (model === undefined && index === 0) ? 0 : -1"
      :data-state="model === option.value ? 'checked' : 'unchecked'"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      <span class="mc-radio__hit"><span :class="['mc-radio__mark', classNames?.mark]"><span :class="['mc-radio__dot', classNames?.dot]" /></span></span>
      <span class="mc-radio__copy">
        <span :class="['mc-radio__title', classNames?.optionLabel]">{{ option.label }}</span>
        <span v-if="option.description" :class="['mc-radio__description', classNames?.description]">{{ option.description }}</span>
      </span>
      <input v-if="name" type="radio" :name="name" :value="option.value" :checked="model === option.value" hidden tabindex="-1" />
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-radio { display: grid; }
.mc-radio__label { margin-bottom: var(--space-1); font-size: var(--text-sm); font-weight: 500; }
.mc-radio__option { display: flex; align-items: flex-start; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-radio__hit { display: grid; flex: 0 0 auto; place-items: center; width: var(--control-height-md); height: var(--control-height-md); }
.mc-radio__mark { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-radio__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--control-on); transform: scale(0); transition: transform .24s var(--ease-spring, var(--ease-standard)); }
.mc-radio__option[data-state="checked"] .mc-radio__mark { border-color: var(--control-on); }
.mc-radio__option[data-state="checked"] .mc-radio__dot { transform: scale(1); }
@media (hover: hover) and (pointer: fine) { .mc-radio__option[data-state="unchecked"]:hover .mc-radio__mark { border-color: var(--text-muted); } }
.mc-radio__option:focus-visible { outline: none; }
.mc-radio__copy { display: grid; gap: 2px; padding-top: calc((var(--control-height-md) - var(--text-sm) * 1.4) / 2); }
.mc-radio__title { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-radio__description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-radio__mark, .mc-radio__dot { transition: none; } }
</style>
