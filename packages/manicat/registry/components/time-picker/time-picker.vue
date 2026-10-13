<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    description?: string;
    placeholder?: string;
    minuteStep?: 1 | 5 | 10 | 15 | 30;
    format?: "12h" | "24h";
    disabled?: boolean;
    /** Extend the inner, named parts of the time picker: trigger, menu, option or hint. */
    classNames?: { trigger?: string; menu?: string; option?: string; hint?: string };
  }>(),
  { placeholder: "Select a time", minuteStep: 15, format: "12h", disabled: false },
);

/** `v-model` binds the time as "HH:MM" in 24-hour form. */
const model = defineModel<string>({ default: "09:00" });
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(0);

const times = computed(() =>
  Array.from({ length: (24 * 60) / props.minuteStep }, (_, index) => {
    const minutes = index * props.minuteStep;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }),
);

function display(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (props.format === "24h") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function show() {
  if (props.disabled) return;
  open.value = true;
  active.value = Math.max(0, times.value.indexOf(model.value));
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "center" }));
}

function choose(index: number) {
  model.value = times.value[index];
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
    return;
  }
  if (event.key === "ArrowDown") active.value = Math.min(times.value.length - 1, active.value + 1);
  else if (event.key === "ArrowUp") active.value = Math.max(0, active.value - 1);
  else if (event.key === "Enter" || event.key === " ") choose(active.value);
  else if (event.key === "Escape" || event.key === "Tab") open.value = false;
  else return;
  event.preventDefault();
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-time">
    <label :id="`${id}-label`" class="mc-time__label">{{ label }}</label>
    <div class="mc-time__anchor">
      <button
        type="button"
        role="combobox"
        :class="['mc-time__trigger', classNames?.trigger]"
        :aria-labelledby="`${id}-label`"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="`${id}-list`"
        :disabled="disabled"
        @click="open ? (open = false) : show()"
        @keydown="onKeydown"
      >
        <span :class="{ 'mc-time__placeholder': !model }">{{ model ? display(model) : placeholder }}</span>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
      </button>
      <ul v-if="open" :id="`${id}-list`" role="listbox" :aria-labelledby="`${id}-label`" :class="['mc-time__menu', classNames?.menu]">
        <li
          v-for="(time, index) in times"
          :id="`${id}-option-${index}`"
          :key="time"
          role="option"
          :aria-selected="time === model"
          :data-active="active === index || undefined"
          :class="['mc-time__option', classNames?.option]"
          @pointermove="active = index"
          @click="choose(index)"
        >
          {{ display(time) }}
        </li>
      </ul>
    </div>
    <span v-if="description" :class="['mc-time__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-time { display: grid; gap: var(--space-2); min-width: 0; }
.mc-time__label { font-size: var(--text-sm); font-weight: 500; }
.mc-time__anchor { position: relative; }
.mc-time__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-time__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-time__trigger[aria-expanded="true"], .mc-time__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-time__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-time__placeholder { color: var(--text-muted); }
.mc-time__menu { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: 260px; margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-time-in .18s var(--ease-enter) both; }
.mc-time__option { display: flex; align-items: center; min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); font-variant-numeric: tabular-nums; cursor: pointer; }
.mc-time__option[data-active] { background: var(--surface-muted); }
.mc-time__option[aria-selected="true"] { font-weight: 600; }
.mc-time__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-time-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-time__menu { animation: none; } }
</style>
