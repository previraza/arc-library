<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import Calendar from "@/registry/components/calendar/calendar.vue";
import { sameDay, startOfMonth } from "@/lib/calendar";
import type { CalendarDateMatcher } from "@/lib/calendar";

const props = withDefaults(
  defineProps<{
    label: string;
    description?: string;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: CalendarDateMatcher;
    locale?: string;
    format?: Intl.DateTimeFormatOptions;
    showToday?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the date picker: trigger, popover or hint. */
    classNames?: { trigger?: string; popover?: string; hint?: string };
  }>(),
  { placeholder: "Select a date", locale: "en-US", format: () => ({ month: "short", day: "numeric", year: "numeric" }), showToday: true, disabled: false },
);

/** `v-model` binds the chosen date; pressing the chosen day again clears it. */
const model = defineModel<Date | undefined>();
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const month = ref(startOfMonth(model.value ?? new Date()));

watch(open, (value) => value && (month.value = startOfMonth(model.value ?? new Date())));

function onChange(date: Date | undefined) {
  model.value = date && sameDay(date, model.value) ? undefined : date;
  open.value = false;
  root.value?.querySelector<HTMLElement>("button")?.focus();
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    open.value = false;
    root.value?.querySelector<HTMLElement>("button")?.focus();
  }
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-datepicker" @keydown="onKeydown">
    <label :id="`${id}-label`" class="mc-datepicker__label">{{ label }}</label>
    <div class="mc-datepicker__anchor">
      <button type="button" :class="['mc-datepicker__trigger', classNames?.trigger]" :aria-labelledby="`${id}-label`" aria-haspopup="dialog" :aria-expanded="open" :disabled="disabled" @click="open = !open">
        <span :class="{ 'mc-datepicker__placeholder': !model }">{{ model ? model.toLocaleDateString(locale, format) : placeholder }}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      </button>
      <div v-if="open" role="dialog" aria-label="Choose date" :class="['mc-datepicker__popover', classNames?.popover]">
        <Calendar :model-value="model" v-model:month="month" :min-date="minDate" :max-date="maxDate" :disabled-dates="disabledDates" :locale="locale" :show-today="showToday" @update:model-value="onChange" />
      </div>
    </div>
    <span v-if="description" :class="['mc-datepicker__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-datepicker { display: grid; gap: var(--space-2); min-width: 0; }
.mc-datepicker__label { font-size: var(--text-sm); font-weight: 500; }
.mc-datepicker__anchor { position: relative; }
.mc-datepicker__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-datepicker__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-datepicker__trigger[aria-expanded="true"], .mc-datepicker__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-datepicker__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-datepicker__placeholder { color: var(--text-muted); }
.mc-datepicker__popover { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; width: min(20rem, calc(100vw - 2rem)); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-datepicker-in .18s var(--ease-enter) both; }
.mc-datepicker__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-datepicker-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-datepicker__popover { animation: none; } }
</style>
