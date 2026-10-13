<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Extra words that match this option when searching. */
  keywords?: string[];
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboboxOption[];
    description?: string;
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    /** Extend the inner, named parts of the combobox: input, content, option, empty or hint. */
    classNames?: { input?: string; content?: string; option?: string; empty?: string; hint?: string };
  }>(),
  { emptyMessage: "No results", disabled: false },
);

/** `v-model` binds the selected option's value. */
const model = defineModel<string>({ default: "" });
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(0);
const query = ref<string | null>(null);

const selected = computed(() => props.options.find((option) => option.value === model.value));
const text = computed(() => query.value ?? selected.value?.label ?? "");
const results = computed(() => {
  const needle = (query.value ?? "").trim().toLowerCase();
  if (!needle) return props.options;
  return props.options.filter((option) => [option.label, ...(option.keywords ?? [])].some((word) => word.toLowerCase().includes(needle)));
});

watch(results, () => (active.value = Math.max(0, results.value.findIndex((option) => !option.disabled))));

function close() {
  open.value = false;
  query.value = null;
}

function choose(index: number) {
  const option = results.value[index];
  if (!option || option.disabled) return;
  model.value = option.value;
  close();
}

function move(step: number) {
  const length = results.value.length;
  if (!length) return;
  let next = active.value;
  for (let tries = 0; tries < length; tries += 1) {
    next = (next + step + length) % length;
    if (!results.value[next].disabled) break;
  }
  active.value = next;
  nextTick(() => document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" }));
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (open.value) move(1);
    else open.value = true;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    move(-1);
  } else if (event.key === "Enter" && open.value) {
    event.preventDefault();
    choose(active.value);
  } else if (event.key === "Escape") {
    close();
  }
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-combobox">
    <label :for="`${id}-input`" class="mc-combobox__label">{{ label }}</label>
    <div class="mc-combobox__anchor">
      <input
        :id="`${id}-input`"
        type="text"
        role="combobox"
        autocomplete="off"
        :class="['mc-combobox__input', classNames?.input]"
        :value="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-expanded="open"
        :aria-controls="`${id}-list`"
        aria-autocomplete="list"
        :aria-activedescendant="open && results.length ? `${id}-option-${active}` : undefined"
        @input="query = ($event.target as HTMLInputElement).value; open = true"
        @focus="open = true"
        @keydown="onKeydown"
      />
      <ul v-if="open" :id="`${id}-list`" role="listbox" :aria-label="label" :class="['mc-combobox__content', classNames?.content]">
        <li v-if="results.length === 0" :class="['mc-combobox__empty', classNames?.empty]">{{ emptyMessage }}</li>
        <li
          v-for="(option, index) in results"
          :id="`${id}-option-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          :aria-disabled="option.disabled || undefined"
          :data-active="active === index || undefined"
          :class="['mc-combobox__option', classNames?.option]"
          @pointermove="!option.disabled && (active = index)"
          @mousedown.prevent
          @click="choose(index)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="option.value === model" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
        </li>
      </ul>
    </div>
    <span v-if="description" :class="['mc-combobox__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-combobox { display: grid; gap: var(--space-2); min-width: 0; }
.mc-combobox__label { font-size: var(--text-sm); font-weight: 500; }
.mc-combobox__anchor { position: relative; }
.mc-combobox__input { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-combobox__input::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-combobox__input:hover:not(:disabled) { border-color: var(--foreground); } }
.mc-combobox__input:focus-visible { border-color: var(--foreground); outline: none; }
.mc-combobox__input:disabled { cursor: not-allowed; opacity: .5; background: var(--surface-muted); }
.mc-combobox__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: min(320px, 60vh); margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-combobox-in .18s var(--ease-enter) both; }
.mc-combobox__option { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-combobox__option[data-active] { background: var(--surface-muted); }
.mc-combobox__option[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-combobox__empty { padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
.mc-combobox__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-combobox-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-combobox__input { transition: none; } .mc-combobox__content { animation: none; } }
</style>
