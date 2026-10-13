<script setup lang="ts">
import { useId } from "vue";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
  disabled?: boolean;
}

const props = defineProps<{
  options: RadioCardOption[];
  layout?: "grid" | "list";
  /** Extend the inner, named parts of the radio cards: card, title, description or meta. */
  classNames?: { card?: string; title?: string; description?: string; meta?: string };
}>();

/** `v-model` binds the selected value. Arrow keys move the selection, as in a native radio group. */
const model = defineModel<string | null>({ default: null });
const id = useId();

function onKeydown(event: KeyboardEvent, index: number) {
  const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  let next = index;
  for (let tries = 0; tries < props.options.length; tries += 1) {
    next = (next + step + props.options.length) % props.options.length;
    if (!props.options[next].disabled) break;
  }
  model.value = props.options[next].value;
  document.getElementById(`${id}-${next}`)?.focus();
}
</script>

<template>
  <div :class="['mc-cards', `mc-cards--${layout ?? 'grid'}`]" role="radiogroup">
    <button
      v-for="(option, index) in options"
      :id="`${id}-${index}`"
      :key="option.value"
      type="button"
      role="radio"
      :class="['mc-cards__card', classNames?.card]"
      :aria-checked="model === option.value"
      :disabled="option.disabled"
      :tabindex="model === option.value || (model === null && index === 0) ? 0 : -1"
      :data-state="model === option.value ? 'checked' : 'unchecked'"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      <span class="mc-cards__copy">
        <span :class="['mc-cards__title', classNames?.title]">{{ option.label }}</span>
        <span v-if="option.description" :class="['mc-cards__description', classNames?.description]">{{ option.description }}</span>
      </span>
      <span v-if="option.meta" :class="['mc-cards__meta', classNames?.meta]">{{ option.meta }}</span>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-cards { display: grid; gap: var(--space-2); }
.mc-cards--grid { grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
.mc-cards__card { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-cards__card:hover:not(:disabled) { border-color: var(--border-strong); } }
.mc-cards__card[data-state="checked"] { border-color: var(--foreground); background: var(--surface-muted); }
.mc-cards__card:disabled { opacity: .5; cursor: not-allowed; }
.mc-cards__card:focus-visible { outline: none; border-color: var(--foreground); }
.mc-cards__copy { display: grid; gap: 2px; }
.mc-cards__title { font-size: var(--text-sm); font-weight: 500; }
.mc-cards__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-cards__meta { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .mc-cards__card { transition: none; } }
</style>
