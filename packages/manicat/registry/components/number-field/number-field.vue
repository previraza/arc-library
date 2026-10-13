<script setup lang="ts">
import { computed, ref, useId } from "vue";

export type NumberFieldAffix = string | ((value: number) => string);

const props = withDefaults(
  defineProps<{
    label: string;
    min?: number;
    max?: number;
    step?: number;
    /** Step for Page Up and Page Down. */
    largeStep?: number;
    description?: string;
    disabled?: boolean;
    prefix?: NumberFieldAffix;
    suffix?: NumberFieldAffix;
    locale?: string;
    /** Extend the inner, named parts of the number field: shell, input, button or hint. */
    classNames?: { shell?: string; input?: string; button?: string; hint?: string };
  }>(),
  { min: -Infinity, max: Infinity, step: 1, disabled: false, locale: "en-US" },
);

const model = defineModel<number>({ default: 0 });
const id = useId();
const draft = ref<string | null>(null);

const clamp = (n: number) => Math.min(props.max, Math.max(props.min, n));
const affix = (value: NumberFieldAffix | undefined) => (typeof value === "function" ? value(model.value) : (value ?? ""));
const text = computed(() => draft.value ?? model.value.toLocaleString(props.locale));

function set(next: number) {
  model.value = clamp(Number.isFinite(next) ? next : model.value);
}

function commit() {
  if (draft.value !== null) set(Number(draft.value.replace(/[^0-9.\-]/g, "")));
  draft.value = null;
}

function onKeydown(event: KeyboardEvent) {
  const big = props.largeStep ?? props.step * 10;
  const delta = { ArrowUp: props.step, ArrowDown: -props.step, PageUp: big, PageDown: -big }[event.key as "ArrowUp"];
  if (event.key === "Home" && Number.isFinite(props.min)) set(props.min);
  else if (event.key === "End" && Number.isFinite(props.max)) set(props.max);
  else if (event.key === "Enter") commit();
  else if (delta !== undefined) set(model.value + delta);
  else return;
  event.preventDefault();
}
</script>

<template>
  <div class="mc-number" :data-disabled="disabled || undefined">
    <label :for="id" class="mc-number__label">{{ label }}</label>
    <div :class="['mc-number__shell', classNames?.shell]">
      <button type="button" :class="['mc-number__button', classNames?.button]" :aria-label="`Decrease ${label}`" :disabled="disabled || model <= min" tabindex="-1" @click="set(model - step)">−</button>
      <span class="mc-number__center">
        <span v-if="affix(prefix)" class="mc-number__affix">{{ affix(prefix) }}</span>
        <input :id="id" :value="text" role="spinbutton" inputmode="decimal" :aria-valuenow="model" :aria-valuemin="Number.isFinite(min) ? min : undefined" :aria-valuemax="Number.isFinite(max) ? max : undefined" :disabled="disabled" :class="['mc-number__input', classNames?.input]" @input="draft = ($event.target as HTMLInputElement).value" @blur="commit" @keydown="onKeydown" />
        <span v-if="affix(suffix)" class="mc-number__affix">{{ affix(suffix) }}</span>
      </span>
      <button type="button" :class="['mc-number__button', classNames?.button]" :aria-label="`Increase ${label}`" :disabled="disabled || model >= max" tabindex="-1" @click="set(model + step)">+</button>
    </div>
    <span v-if="description" :class="['mc-number__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-number { display: grid; gap: var(--space-2); min-width: 0; }
.mc-number[data-disabled] { opacity: .5; }
.mc-number__label { font-size: var(--text-sm); font-weight: 500; }
.mc-number__shell { display: flex; align-items: center; min-height: var(--control-height-md); overflow: hidden; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-number__shell:focus-within { border-color: var(--foreground); }
.mc-number__button { display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: 18px; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-number__button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); } }
.mc-number__button:disabled { opacity: .4; cursor: not-allowed; }
.mc-number__center { display: flex; flex: 1; align-items: center; justify-content: center; gap: 2px; }
.mc-number__input { width: 6ch; min-width: 40px; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: center; }
.mc-number__affix { color: var(--text-muted); font-size: var(--text-sm); }
.mc-number__hint { color: var(--text-muted); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-number__shell { transition: none; } }
</style>
