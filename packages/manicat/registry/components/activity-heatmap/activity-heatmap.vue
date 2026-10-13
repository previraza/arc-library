<script setup lang="ts">
import { computed, ref } from "vue";

export interface ActivityDay {
  /** ISO date, "2026-05-04". */
  date: string;
  count: number;
}

const props = withDefaults(
  defineProps<{
    days: ActivityDay[];
    label: string;
    period: string;
    unit?: { one: string; other: string };
    /** Counts at which the three darker levels start. */
    thresholds?: [number, number, number];
    weekStartsOn?: 0 | 1;
    locale?: string;
    /** Extend the inner, named parts of the heatmap: readout, cell or legend. */
    classNames?: { readout?: string; cell?: string; legend?: string };
  }>(),
  { unit: () => ({ one: "contribution", other: "contributions" }), thresholds: () => [1, 6, 14], weekStartsOn: 0, locale: "en-US" },
);

const emit = defineEmits<{ select: [date: string] }>();
/** `v-model:selected` binds the selected day. */
const selected = defineModel<string | null>("selected", { default: null });
const hover = ref<ActivityDay | null>(null);

const sorted = computed(() => [...props.days].sort((a, b) => a.date.localeCompare(b.date)));
const cells = computed<(ActivityDay | null)[]>(() => {
  const first = sorted.value[0] ? new Date(`${sorted.value[0].date}T12:00:00`) : null;
  const lead = first ? (first.getDay() - props.weekStartsOn + 7) % 7 : 0;
  return [...Array<null>(lead).fill(null), ...sorted.value];
});
const total = computed(() => sorted.value.reduce((sum, day) => sum + day.count, 0));
const level = (count: number) => (count <= 0 ? 0 : count < props.thresholds[1] ? 1 : count < props.thresholds[2] ? 2 : count < props.thresholds[2] * 2 ? 3 : 4);
const word = (n: number) => `${n} ${n === 1 ? props.unit.one : props.unit.other}`;
const shown = computed(() => hover.value ?? sorted.value.find((day) => day.date === selected.value) ?? null);
const when = (day: ActivityDay) => new Date(`${day.date}T12:00:00`).toLocaleDateString(props.locale, { month: "short", day: "numeric", year: "numeric" });

function pick(day: ActivityDay) {
  selected.value = day.date;
  emit("select", day.date);
}
</script>

<template>
  <figure class="mc-heat">
    <figcaption class="mc-heat__title">{{ label }}</figcaption>
    <p :class="['mc-heat__readout', classNames?.readout]" aria-live="polite">{{ shown ? `${word(shown.count)} on ${when(shown)}` : `${word(total)} · ${period}` }}</p>
    <div class="mc-heat__scroll">
      <div class="mc-heat__grid" role="grid" :aria-label="`${label}, ${period}: ${word(total)}`">
        <template v-for="(day, index) in cells" :key="day?.date ?? `empty-${index}`">
          <span v-if="!day" class="mc-heat__cell mc-heat__cell--empty" />
          <button v-else type="button" role="gridcell" :class="['mc-heat__cell', classNames?.cell]" :data-level="level(day.count)" :aria-label="`${day.date}, ${word(day.count)}`" :aria-selected="selected === day.date" @click="pick(day)" @pointerenter="hover = day" @pointerleave="hover = null" @focus="hover = day" @blur="hover = null" />
        </template>
      </div>
    </div>
    <div :class="['mc-heat__legend', classNames?.legend]" aria-hidden="true"><small>Less</small><span v-for="n in 5" :key="n" class="mc-heat__cell" :data-level="n - 1" /><small>More</small></div>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-heat { display: grid; gap: var(--space-2); margin: 0; min-width: 0; }
.mc-heat__title { font-size: var(--text-sm); font-weight: 500; }
.mc-heat__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-heat__scroll { overflow-x: auto; padding-bottom: 4px; }
.mc-heat__grid { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 14px); grid-auto-columns: 14px; gap: 3px; width: max-content; }
.mc-heat__cell { width: 14px; height: 14px; padding: 0; border: 1px solid transparent; border-radius: 3px; background: var(--surface-muted); }
.mc-heat__cell--empty { background: transparent; }
button.mc-heat__cell { cursor: pointer; }
.mc-heat__cell[data-level="1"] { background: color-mix(in oklab, var(--success) 33%, var(--surface-muted)); } .mc-heat__cell[data-level="2"] { background: color-mix(in oklab, var(--success) 60%, var(--surface-muted)); }
.mc-heat__cell[data-level="3"] { background: color-mix(in oklab, var(--success) 82%, var(--surface-muted)); } .mc-heat__cell[data-level="4"] { background: var(--success); }
.mc-heat__cell[aria-selected="true"], .mc-heat__cell:focus-visible { border-color: var(--foreground); outline: none; }
.mc-heat__legend { display: flex; align-items: center; justify-content: flex-end; gap: 4px; } .mc-heat__legend small { color: var(--text-muted); font-size: 11px; }
</style>
