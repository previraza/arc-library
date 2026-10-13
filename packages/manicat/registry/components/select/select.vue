<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: SelectOption[];
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Extend the inner, named parts of the select: trigger, valueText, chevron, content, item, indicator or hint. */
    classNames?: { trigger?: string; valueText?: string; chevron?: string; content?: string; item?: string; indicator?: string; hint?: string };
  }>(),
  { placeholder: "Select…", disabled: false },
);

/** `v-model` binds the selected value. */
const model = defineModel<string>();
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(-1);

const selected = computed(() => props.options.find((option) => option.value === model.value));
const enabled = computed(() => props.options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled));

function show() {
  if (props.disabled) return;
  open.value = true;
  active.value = Math.max(0, props.options.findIndex((option) => option.value === model.value));
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

function hide(refocus = false) {
  open.value = false;
  if (refocus) root.value?.querySelector<HTMLElement>("button")?.focus();
}

function choose(index: number) {
  const option = props.options[index];
  if (!option || option.disabled) return;
  model.value = option.value;
  hide(true);
}

function move(step: number) {
  const list = enabled.value;
  if (!list.length) return;
  const at = list.findIndex(({ index }) => index === active.value);
  active.value = list[(at + step + list.length) % list.length].index;
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
    return;
  }
  if (event.key === "ArrowDown") move(1);
  else if (event.key === "ArrowUp") move(-1);
  else if (event.key === "Home") active.value = enabled.value[0]?.index ?? -1;
  else if (event.key === "End") active.value = enabled.value.at(-1)?.index ?? -1;
  else if (event.key === "Enter" || event.key === " ") choose(active.value);
  else if (event.key === "Escape") hide(true);
  else if (event.key === "Tab") hide();
  else if (event.key.length === 1) {
    // Type-ahead: jump to the next option starting with the typed letter.
    const letter = event.key.toLowerCase();
    const next = props.options.findIndex((option, index) => index > active.value && !option.disabled && option.label.toLowerCase().startsWith(letter));
    const first = props.options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(letter));
    if (next >= 0 || first >= 0) active.value = next >= 0 ? next : first;
    return;
  } else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) hide();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-select">
    <label :id="`${id}-label`" class="mc-select__label">{{ label }}</label>
    <div class="mc-select__anchor">
      <button
        type="button"
        role="combobox"
        :class="['mc-select__trigger', classNames?.trigger]"
        :aria-labelledby="`${id}-label`"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="`${id}-list`"
        :aria-activedescendant="open && active >= 0 ? `${id}-option-${active}` : undefined"
        :data-state="open ? 'open' : 'closed'"
        :disabled="disabled"
        @click="open ? hide() : show()"
        @keydown="onKeydown"
      >
        <span :class="['mc-select__value', { 'mc-select__value--placeholder': !selected }, classNames?.valueText]">{{ selected?.label ?? placeholder }}</span>
        <svg :class="['mc-select__chevron', classNames?.chevron]" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
      </button>
      <ul v-if="open" :id="`${id}-list`" role="listbox" :aria-labelledby="`${id}-label`" :class="['mc-select__content', classNames?.content]">
        <li
          v-for="(option, index) in options"
          :id="`${id}-option-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          :aria-disabled="option.disabled || undefined"
          :data-active="active === index || undefined"
          :class="['mc-select__item', classNames?.item]"
          @pointermove="!option.disabled && (active = index)"
          @click="choose(index)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="option.value === model" :class="['mc-select__indicator', classNames?.indicator]" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
        </li>
      </ul>
    </div>
    <span v-if="description" :class="['mc-select__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-select { display: grid; gap: var(--space-2); min-width: 0; }
.mc-select__label { font-size: var(--text-sm); font-weight: 500; }
.mc-select__anchor { position: relative; }
.mc-select__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-select__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-select__trigger[data-state="open"], .mc-select__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-select__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-select__value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-select__value--placeholder { color: var(--text-muted); }
.mc-select__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring, .3s) var(--ease-spring, var(--ease-standard)); }
.mc-select__trigger[data-state="open"] .mc-select__chevron { transform: rotate(180deg); }
.mc-select__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: min(320px, 60vh); margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-select-in .18s var(--ease-enter) both; transform-origin: top center; }
.mc-select__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-select__item[data-active] { background: var(--surface-muted); }
.mc-select__item[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-select__indicator { flex: 0 0 auto; }
.mc-select__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-select-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-select__trigger, .mc-select__chevron { transition: none; } .mc-select__content { animation: none; } }
</style>
