<script setup lang="ts">
import { ref, useId } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  label: string;
  /** Extend the inner, named parts of the search field: shell, input, clearSlot or clear. */
  classNames?: { shell?: string; input?: string; clearSlot?: string; clear?: string };
}>();

const model = defineModel<string>({ default: "" });
const id = useId();
const input = ref<HTMLInputElement>();

function clear() {
  model.value = "";
  input.value?.focus();
}
</script>

<template>
  <div class="mc-search">
    <label :for="id">{{ label }}</label>
    <div :class="['mc-search__shell', classNames?.shell]">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
      <input v-bind="$attrs" :id="id" ref="input" v-model="model" type="search" :class="['mc-search__input', classNames?.input]" />
      <!-- The clear button has a reserved slot, so the field never changes width when it appears or leaves. -->
      <span :class="['mc-search__slot', classNames?.clearSlot]">
        <button v-if="model" type="button" :class="['mc-search__clear', classNames?.clear]" aria-label="Clear search" @click="clear">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </span>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-search { display: grid; gap: var(--space-2); min-width: 0; }
.mc-search label { font-size: var(--text-sm); font-weight: 500; }
.mc-search__shell { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--text-muted); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-search__shell:hover { border-color: var(--foreground); } }
.mc-search__shell:focus-within { border-color: var(--foreground); }
.mc-search__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-search__input::placeholder { color: var(--text-muted); }
.mc-search__input::-webkit-search-cancel-button { display: none; }
.mc-search__slot { display: grid; flex: 0 0 auto; width: 22px; height: 22px; place-items: center; }
.mc-search__clear { display: grid; width: 20px; height: 20px; place-items: center; border: 0; border-radius: 50%; background: var(--surface-muted); color: var(--text-muted); cursor: pointer; animation: mc-search-pop .16s var(--ease-enter) both; }
@media (hover: hover) and (pointer: fine) { .mc-search__clear:hover { color: var(--foreground); } }
@keyframes mc-search-pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-search__shell { transition: none; } .mc-search__clear { animation: none; } }
</style>
