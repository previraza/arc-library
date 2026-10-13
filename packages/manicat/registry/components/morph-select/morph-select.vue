<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface MorphSelectOption {
  value: string;
  label: string;
  /** Short trailing detail such as an offset or a count. */
  meta?: string;
  /** Extra words that match this option when searching. */
  keywords?: string;
  disabled?: boolean;
}

export interface MorphSelectGroup {
  label: string;
  options: MorphSelectOption[];
}

export type MorphSelectItem = MorphSelectOption | MorphSelectGroup;

const props = withDefaults(
  defineProps<{
    label: string;
    items: MorphSelectItem[];
    placeholder?: string;
    /** Show a search box. `auto` shows it from eight options up. */
    searchable?: boolean | "auto";
    searchPlaceholder?: string;
    align?: "start" | "end";
    disabled?: boolean;
    /** Extend the inner, named parts of the select: trigger, content, group, option or meta. */
    classNames?: { trigger?: string; content?: string; group?: string; option?: string; meta?: string };
  }>(),
  { placeholder: "Select…", searchable: "auto", searchPlaceholder: "Search", align: "start", disabled: false },
);

const emit = defineEmits<{ select: [option: MorphSelectOption] }>();
/** `v-model` binds the selected value. The `icon-<value>` slots draw each option's icon. */
const model = defineModel<string | null>({ default: null });
const id = useId();
const root = ref<HTMLElement>();
const search = ref<HTMLInputElement>();
const open = ref(false);
const query = ref("");
const active = ref(0);

const isGroup = (item: MorphSelectItem): item is MorphSelectGroup => "options" in item;
const groups = computed(() => props.items.map((item) => (isGroup(item) ? item : { label: "", options: [item] })));
const all = computed(() => groups.value.flatMap((group) => group.options));
const selected = computed(() => all.value.find((option) => option.value === model.value));
const showSearch = computed(() => (props.searchable === "auto" ? all.value.length >= 8 : props.searchable));
const visible = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return groups.value.map((group) => ({ ...group, options: group.options.filter((option) => !needle || [option.label, option.meta ?? "", option.keywords ?? ""].some((word) => word.toLowerCase().includes(needle))) })).filter((group) => group.options.length > 0);
});
const flat = computed(() => visible.value.flatMap((group) => group.options));
const indexOf = (option: MorphSelectOption) => flat.value.indexOf(option);

async function show() {
  if (props.disabled) return;
  open.value = true;
  query.value = "";
  active.value = Math.max(0, flat.value.findIndex((option) => option.value === model.value));
  await nextTick();
  if (showSearch.value) search.value?.focus();
  else document.getElementById(`${id}-list`)?.focus();
}

function hide(refocus = true) {
  open.value = false;
  if (refocus) root.value?.querySelector<HTMLElement>("button")?.focus();
}

function choose(option: MorphSelectOption) {
  if (option.disabled) return;
  model.value = option.value;
  emit("select", option);
  hide();
}

function onKeydown(event: KeyboardEvent) {
  const count = flat.value.length;
  if (event.key === "ArrowDown" && count) active.value = (active.value + 1) % count;
  else if (event.key === "ArrowUp" && count) active.value = (active.value - 1 + count) % count;
  else if (event.key === "Home") active.value = 0;
  else if (event.key === "End") active.value = Math.max(0, count - 1);
  else if (event.key === "Enter" || (event.key === " " && !showSearch.value)) flat.value[active.value] && choose(flat.value[active.value]);
  else if (event.key === "Escape") hide();
  else if (event.key === "Tab") hide(false);
  else return;
  event.preventDefault();
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) hide(false);
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-morph-select" :data-align="align">
    <span :id="`${id}-label`" class="mc-morph-select__sr">{{ label }}</span>
    <button type="button" role="combobox" :class="['mc-morph-select__trigger', classNames?.trigger]" :aria-labelledby="`${id}-label`" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-list`" :disabled="disabled" @click="open ? hide() : show()" @keydown.down.prevent="open || show()">
      <slot v-if="selected" :name="`icon-${selected.value}`" />
      <span :class="{ 'mc-morph-select__placeholder': !selected }">{{ selected?.label ?? placeholder }}</span>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    <div v-if="open" :class="['mc-morph-select__content', classNames?.content]">
      <input v-if="showSearch" ref="search" v-model="query" class="mc-morph-select__search" type="text" autocomplete="off" :placeholder="searchPlaceholder" :aria-label="searchPlaceholder" role="combobox" aria-expanded="true" :aria-controls="`${id}-list`" :aria-activedescendant="flat.length ? `${id}-option-${active}` : undefined" @keydown="onKeydown" @input="active = 0" />
      <div :id="`${id}-list`" role="listbox" :aria-labelledby="`${id}-label`" tabindex="-1" class="mc-morph-select__list" @keydown="onKeydown">
        <div v-for="group in visible" :key="group.label || 'all'" role="presentation">
          <div v-if="group.label" :class="['mc-morph-select__group', classNames?.group]" role="presentation">{{ group.label }}</div>
          <div v-for="option in group.options" :id="`${id}-option-${indexOf(option)}`" :key="option.value" role="option" :aria-selected="option.value === model" :aria-disabled="option.disabled || undefined" :data-active="active === indexOf(option) || undefined" :class="['mc-morph-select__option', classNames?.option]" @pointermove="!option.disabled && (active = indexOf(option))" @click="choose(option)">
            <slot :name="`icon-${option.value}`" /><span class="mc-morph-select__text">{{ option.label }}</span><span v-if="option.meta" :class="['mc-morph-select__meta', classNames?.meta]">{{ option.meta }}</span>
          </div>
        </div>
        <p v-if="flat.length === 0" class="mc-morph-select__empty">No results.</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-morph-select { position: relative; display: inline-block; }
.mc-morph-select__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-morph-select__trigger { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-morph-select__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-morph-select__trigger[aria-expanded="true"], .mc-morph-select__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-morph-select__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-morph-select__placeholder { color: var(--text-muted); }
.mc-morph-select__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; width: 17rem; max-width: calc(100vw - 2rem); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-morph-select-in .2s var(--ease-enter) both; transform-origin: top left; }
.mc-morph-select[data-align="end"] .mc-morph-select__content { left: auto; right: 0; transform-origin: top right; }
.mc-morph-select__search { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 0; border-bottom: 1px solid var(--border); outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-morph-select__list { max-height: 296px; padding: 4px; overflow: auto; outline: none; }
.mc-morph-select__group { padding: var(--space-2) var(--space-3) 2px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; }
.mc-morph-select__option { display: flex; align-items: center; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-morph-select__option[data-active] { background: var(--surface-muted); }
.mc-morph-select__option[aria-selected="true"] { font-weight: 600; }
.mc-morph-select__option[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-morph-select__text { flex: 1; } .mc-morph-select__meta { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-morph-select__empty { margin: 0; padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
@keyframes mc-morph-select-in { from { opacity: 0; transform: translateY(-4px) scale(.96); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-morph-select__trigger { transition: none; } .mc-morph-select__content { animation: none; } }
</style>
