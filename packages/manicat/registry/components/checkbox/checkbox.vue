<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    disabled?: boolean;
    /** Extend the inner, named parts of the checkbox: box, mark, label or description. */
    classNames?: { box?: string; mark?: string; label?: string; description?: string };
  }>(),
  { disabled: false },
);

/** `v-model` binds the state: true, false, or "indeterminate" for a parent whose children are only partly checked. */
const model = defineModel<boolean | "indeterminate">({ default: false });
const id = useId();
const state = computed(() => (model.value === "indeterminate" ? "indeterminate" : model.value ? "checked" : "unchecked"));

function toggle() {
  // An indeterminate box resolves to checked, like the React version.
  model.value = model.value !== true;
}
</script>

<template>
  <div class="mc-checkbox">
    <button
      :id="id"
      type="button"
      role="checkbox"
      class="mc-checkbox__box"
      :aria-checked="model === 'indeterminate' ? 'mixed' : model"
      :aria-label="props.label"
      :data-state="state"
      :disabled="disabled"
      @click="toggle"
    >
      <span :class="['mc-checkbox__visual', classNames?.box]">
        <svg v-if="state !== 'unchecked'" :class="['mc-checkbox__mark', classNames?.mark]" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path v-if="state === 'checked'" d="M4.5 9.5 7.5 12.5 13.5 5.5" />
          <path v-else d="M5 9h8" />
        </svg>
      </span>
    </button>
    <span v-if="label || description" class="mc-checkbox__copy">
      <label v-if="label" :for="id" :class="['mc-checkbox__label', classNames?.label]">{{ label }}</label>
      <span v-if="description" :class="['mc-checkbox__description', classNames?.description]">{{ description }}</span>
    </span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-checkbox { display: inline-flex; align-items: flex-start; min-width: 0; }
.mc-checkbox__box { position: relative; flex: 0 0 auto; display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 0; border-radius: var(--radius-control); padding: 0; background: transparent; color: var(--control-glyph); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-checkbox__box:disabled { opacity: .5; cursor: not-allowed; }
.mc-checkbox__visual { position: relative; display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring, .3s) var(--ease-standard); }
.mc-checkbox__box[data-state="checked"] .mc-checkbox__visual, .mc-checkbox__box[data-state="indeterminate"] .mc-checkbox__visual { border-color: var(--control-on); background: var(--control-on); }
@media (hover: hover) and (pointer: fine) { .mc-checkbox__box[data-state="unchecked"]:hover:not(:disabled) .mc-checkbox__visual { border-color: var(--text-muted); } }
.mc-checkbox__box:active:not(:disabled) .mc-checkbox__visual { transform: scale(.95); }
.mc-checkbox__mark { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.mc-checkbox__box:focus-visible { outline: none; }
.mc-checkbox__copy { display: grid; gap: 2px; min-width: 0; margin-left: 1px; padding-top: calc((var(--control-height-md) - var(--text-sm) * 1.4) / 2); }
.mc-checkbox__label { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); cursor: pointer; }
.mc-checkbox__description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-checkbox__visual, .mc-checkbox__box:active:not(:disabled) .mc-checkbox__visual { transition: none; transform: none; } }
</style>
