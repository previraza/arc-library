<script setup lang="ts">
import { computed, ref } from "vue";

export interface ChipOption {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    options: ChipOption[];
    label: string;
    multiple?: boolean;
    /** How many chips show before the rest collapse into a "+N more" chip. */
    maxVisible?: number;
    /** Extend the inner, named parts of the chip group: chip or more. */
    classNames?: { chip?: string; more?: string };
  }>(),
  { multiple: true, maxVisible: Infinity },
);

/** `v-model` binds the selected values. */
const model = defineModel<string[]>({ default: () => [] });
const expanded = ref(false);
const shown = computed(() => (expanded.value ? props.options : props.options.slice(0, props.maxVisible)));
const hidden = computed(() => props.options.length - shown.value.length);

function toggle(value: string) {
  if (!props.multiple) model.value = model.value.includes(value) ? [] : [value];
  else model.value = model.value.includes(value) ? model.value.filter((entry) => entry !== value) : [...model.value, value];
}
</script>

<template>
  <div class="mc-chips" role="group" :aria-label="label">
    <button
      v-for="option in shown"
      :key="option.value"
      type="button"
      :class="['mc-chips__chip', classNames?.chip]"
      :aria-pressed="model.includes(option.value)"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
    <button v-if="hidden > 0" type="button" :class="['mc-chips__chip', 'mc-chips__more', classNames?.more]" @click="expanded = true">+{{ hidden }} more</button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.mc-chips__chip { min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-chips__chip:hover { border-color: var(--border-strong); } }
.mc-chips__chip:active { transform: scale(.97); }
.mc-chips__chip[aria-pressed="true"] { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
.mc-chips__more { background: var(--surface-muted); color: var(--text-secondary); }
@media (prefers-reduced-motion: reduce) { .mc-chips__chip { transition: none; } .mc-chips__chip:active { transform: none; } }
</style>
