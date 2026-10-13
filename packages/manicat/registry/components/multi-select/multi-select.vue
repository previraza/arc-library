<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: MultiSelectOption[];
    placeholder?: string;
    description?: string;
    /** How many chosen labels show in the trigger before it summarises as "+N". */
    maxVisible?: number;
    disabled?: boolean;
    /** Extend the inner, named parts of the multi select: trigger, chip, content, item or hint. */
    classNames?: { trigger?: string; chip?: string; content?: string; item?: string; hint?: string };
  }>(),
  { placeholder: "Select options", maxVisible: 2, disabled: false },
);

/** `v-model` binds the chosen values. */
const model = defineModel<string[]>({ default: () => [] });
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(0);

const labels = computed(() => model.value.map((entry) => props.options.find((option) => option.value === entry)?.label).filter(Boolean) as string[]);

function toggle(index: number) {
  const option = props.options[index];
  if (!option || option.disabled) return;
  model.value = model.value.includes(option.value) ? model.value.filter((entry) => entry !== option.value) : [...model.value, option.value];
}

function move(step: number) {
  const count = props.options.length;
  let next = active.value;
  for (let tries = 0; tries < count; tries += 1) {
    next = (next + step + count) % count;
    if (!props.options[next].disabled) break;
  }
  active.value = next;
  nextTick(() => document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" }));
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open.value = true;
    }
    return;
  }
  if (event.key === "ArrowDown") move(1);
  else if (event.key === "ArrowUp") move(-1);
  else if (event.key === "Enter" || event.key === " ") toggle(active.value);
  else if (event.key === "Escape" || event.key === "Tab") open.value = false;
  else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-multi">
    <label :id="`${id}-label`" class="mc-multi__label">{{ label }}</label>
    <div class="mc-multi__anchor">
      <button
        type="button"
        role="combobox"
        :class="['mc-multi__trigger', classNames?.trigger]"
        :aria-labelledby="`${id}-label`"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="`${id}-list`"
        :aria-activedescendant="open ? `${id}-option-${active}` : undefined"
        :disabled="disabled"
        @click="open = !open"
        @keydown="onKeydown"
      >
        <span class="mc-multi__chips">
          <span v-if="labels.length === 0" class="mc-multi__placeholder">{{ placeholder }}</span>
          <span v-for="entry in labels.slice(0, maxVisible)" :key="entry" :class="['mc-multi__chip', classNames?.chip]">{{ entry }}</span>
          <span v-if="labels.length > maxVisible" class="mc-multi__more">+{{ labels.length - maxVisible }}</span>
        </span>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
      </button>
      <ul v-if="open" :id="`${id}-list`" role="listbox" aria-multiselectable="true" :aria-labelledby="`${id}-label`" :class="['mc-multi__content', classNames?.content]">
        <li
          v-for="(option, index) in options"
          :id="`${id}-option-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="model.includes(option.value)"
          :aria-disabled="option.disabled || undefined"
          :data-active="active === index || undefined"
          :class="['mc-multi__item', classNames?.item]"
          @pointermove="!option.disabled && (active = index)"
          @click="toggle(index)"
        >
          <span class="mc-multi__box" :data-on="model.includes(option.value) || undefined">
            <svg v-if="model.includes(option.value)" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
          </span>
          {{ option.label }}
        </li>
      </ul>
    </div>
    <span v-if="description" :class="['mc-multi__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-multi { display: grid; gap: var(--space-2); min-width: 0; }
.mc-multi__label { font-size: var(--text-sm); font-weight: 500; }
.mc-multi__anchor { position: relative; }
.mc-multi__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 4px var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--text-muted); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-multi__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-multi__trigger[aria-expanded="true"], .mc-multi__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-multi__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-multi__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
.mc-multi__placeholder { color: var(--text-muted); }
.mc-multi__chip { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--foreground); font-size: var(--text-xs); font-weight: 500; }
.mc-multi__more { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-multi__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: min(320px, 60vh); margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-multi-in .18s var(--ease-enter) both; }
.mc-multi__item { display: flex; align-items: center; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); color: var(--foreground); font-size: var(--text-sm); cursor: pointer; }
.mc-multi__item[data-active] { background: var(--surface-muted); }
.mc-multi__item[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-multi__box { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--control-glyph); }
.mc-multi__box[data-on] { border-color: var(--control-on); background: var(--control-on); }
.mc-multi__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-multi-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-multi__content { animation: none; } }
</style>
