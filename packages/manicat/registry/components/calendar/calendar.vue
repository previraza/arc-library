<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch } from "vue";
import type { Directive } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { addDays, addMonths, dateKey, isAfter, isBefore, monthGrid, monthLabel as formatMonth, sameDay, sameMonth, shiftMonths, startOfDay, startOfMonth, weekdayLabels } from "@/lib/calendar";
import type { CalendarDateMatcher } from "@/lib/calendar";
import { createDisc, createStrip, fromIndex, monthIndex, spanOf, stylePane, watchToday } from "@/lib/calendar-motion";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    /** The month on show. Pass it to control the calendar, and listen to `update:month`; without it the calendar keeps its own. */
    month?: Date;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: CalendarDateMatcher;
    locale?: string;
    /** Adds a Today button that slides back to the current month and selects today when it is available. */
    showToday?: boolean;
    /** Extend the inner, named parts of the calendar: calendar, grid, week, day, highlight, heading, todayButton, navButton, weekdays, monthViewport or monthBody. */
    classNames?: { calendar?: string; grid?: string; week?: string; day?: string; highlight?: string; heading?: string; todayButton?: string; navButton?: string; weekdays?: string; monthViewport?: string; monthBody?: string };
  }>(),
  { locale: "en-US", showToday: false },
);

/** `v-model` binds the selected day. */
const value = defineModel<Date | undefined>();
const emit = defineEmits<{ "update:month": [month: Date] }>();
const titleId = useId();
const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration } = motionTokens;

const today = ref<Date>();
const internalMonth = ref(value.value ? startOfMonth(value.value) : undefined);
const focusedDate = ref<Date | undefined>(value.value);
const viewport = ref<HTMLElement>();
let focusRequest: string | null = null;
// Without a value or month the calendar waits for the client's today, then settles on that month once.
const fallback = computed(() => value.value ?? today.value);
const month = computed(() => (props.month ? startOfMonth(props.month) : (internalMonth.value ?? (fallback.value && startOfMonth(fallback.value)))));
watch(month, (next) => { if (!props.month && !internalMonth.value && next) internalMonth.value = next; }, { immediate: true });
const monthTime = computed(() => month.value?.getTime());
const monthKey = computed(() => (month.value ? dateKey(month.value) : "pending"));
// Direction is read from the month itself, so arrows, keys, Today, and a controlled month all travel the same way.
const direction = ref(0);
watch(monthTime, (next, previous) => (direction.value = previous === undefined || next === undefined ? 0 : next > previous ? 1 : -1), { flush: "sync" });
const weeks = (target: Date) => Array.from({ length: 6 }, (_, week) => monthGrid(target).slice(week * 7, week * 7 + 7));

// The strip position is measured in months. The panes on either side of it render, plus the month being navigated to.
const target = computed(() => (month.value ? monthIndex(month.value) : 0));
const span = ref<[number, number]>([target.value, target.value]);
const strip = createStrip(target.value, (position) => {
  const next = spanOf(position);
  if (span.value[0] !== next[0] || span.value[1] !== next[1]) span.value = next;
  viewport.value?.querySelectorAll<HTMLElement>("[data-pane]").forEach((pane) => stylePane(pane, Number(pane.dataset.pane), position));
});
if (month.value) strip.markPlaced();
watch([() => month.value !== undefined, target], ([ready]) => { if (ready) strip.place(target.value, reducedMotion); }, { flush: "post" });
const paneIndexes = computed(() => Array.from(new Set([span.value[0], span.value[1], target.value])).sort((a, b) => a - b));
const placePane = (el: unknown, index: number) => { if (el instanceof HTMLElement) stylePane(el, index, strip.get()); };

const monthLabel = computed(() => (month.value ? formatMonth(month.value, props.locale) : ""));
const weekdays = computed(() => weekdayLabels(props.locale));
// The selected disc glides between days, so each number flips color as the disc actually passes it:
// the day it leaves waits longer on short hops, the day it lands on waits longer on long ones.
const valueKey = computed(() => (value.value ? dateKey(value.value) : ""));
const handoff = ref({ from: "", to: "", distance: 0 });
let last: { key: string; date?: Date } = { key: valueKey.value, date: value.value };
watch(valueKey, (key) => {
  const date = value.value;
  const days = last.date && date ? Math.round((startOfDay(date).getTime() - startOfDay(last.date).getTime()) / 864e5) : 0;
  const columns = last.date && date ? date.getDay() - last.date.getDay() : 0;
  handoff.value = { from: last.key, to: key, distance: Math.hypot(columns, (days - columns) / 7) };
  last = { key, date };
}, { flush: "sync" });
const numberDelay = (key: string) => {
  const { distance, to, from } = handoff.value;
  if (!distance || reducedMotion || (key !== to && key !== from)) return undefined;
  const delay = key === to ? Math.min(260, 95 + 85 * Math.log(distance)) : Math.max(20, 130 / distance);
  return { "--number-delay": `${Math.round(delay)}ms` };
};

const blocked = (date: Date) => isBefore(date, props.minDate) || isAfter(date, props.maxDate) || Boolean(props.disabledDates?.(date));
const previousMonth = computed(() => month.value && addMonths(month.value, -1));
const nextMonth = computed(() => month.value && addMonths(month.value, 1));
// While the month is still unknown the controls keep their resting look, so hydration does not flash them dim.
const previousDisabled = computed(() => Boolean(previousMonth.value && props.minDate && previousMonth.value.getTime() < startOfMonth(props.minDate).getTime()));
const nextDisabled = computed(() => Boolean(nextMonth.value && props.maxDate && nextMonth.value.getTime() > startOfMonth(props.maxDate).getTime()));
const todaySelectable = computed(() => Boolean(today.value && !blocked(today.value)));
const todayIdle = computed(() => Boolean(today.value && sameMonth(month.value, today.value) && (!todaySelectable.value || sameDay(value.value, today.value))));
// Roving tab stop: the day last focused, else the selection, else today, else the first open day of the month.
const tabbableKey = computed(() => {
  const open = (date?: Date) => (date && sameMonth(date, month.value) && !blocked(date) ? dateKey(date) : "");
  const first = month.value ? monthGrid(month.value).find((date) => sameMonth(date, month.value) && !blocked(date)) : undefined;
  return open(focusedDate.value) || open(value.value) || open(today.value) || dateKey(first ?? new Date(0));
});

const changeMonth = (next: Date) => {
  const normalized = startOfMonth(next);
  if (!props.month) internalMonth.value = normalized;
  emit("update:month", normalized);
};

/** Keyboard focus lands on the new day in the same frame the month starts to slide. */
onUpdated(() => {
  const key = focusRequest;
  if (!key) return;
  const button = viewport.value?.querySelector<HTMLButtonElement>(`[data-present] [data-date="${key}"]`);
  if (button) {
    focusRequest = null;
    button.focus({ preventScroll: true });
  }
});

/** Clamps a keyboard move to the allowed range and steps past blocked days in the direction of travel. */
function moveFocus(from: Date, to: Date, step: number) {
  let next = isBefore(to, props.minDate) && props.minDate ? startOfDay(props.minDate) : isAfter(to, props.maxDate) && props.maxDate ? startOfDay(props.maxDate) : to;
  for (let tries = 0; tries < 42 && blocked(next); tries += 1) next = addDays(next, step);
  if (blocked(next) || sameDay(next, from)) return;
  focusedDate.value = next;
  focusRequest = dateKey(next);
  if (!sameMonth(next, month.value)) changeMonth(next);
}

function onDayKeydown(event: KeyboardEvent, date: Date) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!blocked(date)) value.value = date;
    return;
  }
  const moves: Record<string, [Date, number]> = {
    ArrowLeft: [addDays(date, -1), -1],
    ArrowRight: [addDays(date, 1), 1],
    ArrowUp: [addDays(date, -7), -1],
    ArrowDown: [addDays(date, 7), 1],
    Home: [addDays(date, -date.getDay()), 1],
    End: [addDays(date, 6 - date.getDay()), -1],
    PageUp: [shiftMonths(date, event.shiftKey ? -12 : -1), -1],
    PageDown: [shiftMonths(date, event.shiftKey ? 12 : 1), 1],
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  moveFocus(date, move[0], move[1]);
}

function goToToday() {
  if (!today.value || !month.value || todayIdle.value) return;
  focusedDate.value = today.value;
  if (!sameMonth(today.value, month.value)) changeMonth(today.value);
  if (todaySelectable.value && !sameDay(value.value, today.value)) value.value = today.value;
}

// Six fixed weeks per month, so a day's cell is its distance from the first day on the grid.
const cellOf = (paneMonth: Date) => {
  if (!value.value) return -1;
  const first = addDays(paneMonth, -paneMonth.getDay());
  const index = Math.round((startOfDay(value.value).getTime() - first.getTime()) / 864e5);
  return index >= 0 && index < 42 ? index : -1;
};
const discs = new WeakMap<HTMLElement, ReturnType<typeof createDisc>>();
const vDisc: Directive<HTMLElement, number> = {
  mounted: (el, { value: cell }) => {
    const disc = createDisc(el, cell, reducedMotion);
    discs.set(el, disc);
    disc.set(cell);
  },
  updated: (el, { value: cell, oldValue }) => { if (cell !== oldValue) discs.get(el)?.set(cell); },
  unmounted: (el) => discs.get(el)?.destroy(),
};

let stopToday: (() => void) | undefined;
onMounted(() => {
  stopToday = watchToday((next) => { if (!today.value || dateKey(today.value) !== dateKey(next)) today.value = next; });
});
onBeforeUnmount(() => {
  stopToday?.();
  strip.destroy();
});

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
// The title crossfades in place: the old month leaves toward the side the strip travels to while the new one arrives from the other.
const sliding = () => !reducedMotion && direction.value !== 0;
function enterTitle(el: Element, done: () => void) {
  if (!sliding()) return done();
  playPose(el, { opacity: 0, x: direction.value * 12 }, { opacity: 1, x: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveTitle(el: Element, done: () => void) {
  if (!sliding()) return done();
  playPose(el, { opacity: 1, x: 0 }, { opacity: 0, x: direction.value * -12 }, { duration: 0.14, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <section :class="cn('mc-calendar__calendar', classNames?.calendar)" :aria-labelledby="titleId">
    <div class="mc-calendar__header">
      <h2 :id="titleId" :class="cn('mc-calendar__heading', classNames?.heading)">
        <span class="mc-calendar__srOnly">{{ monthLabel }}</span>
        <span class="mc-calendar__title" aria-hidden="true">
          <Transition :css="false" @enter="enterTitle" @leave="leaveTitle">
            <span v-if="month" :key="monthKey" class="mc-calendar__titleRow">{{ monthLabel }}</span>
          </Transition>
        </span>
      </h2>
      <span class="mc-calendar__srOnly" aria-live="polite">{{ direction ? monthLabel : "" }}</span>
      <div class="mc-calendar__navigation">
        <button v-if="showToday" type="button" :class="cn('mc-calendar__todayButton', classNames?.todayButton)" :aria-disabled="todayIdle || undefined" :aria-label="today ? `Today, ${today.toLocaleDateString(locale, { dateStyle: 'full' })}` : 'Today'" @click="goToToday">Today</button>
        <button type="button" :class="cn('mc-calendar__navButton', classNames?.navButton)" aria-label="Previous month" :aria-disabled="previousDisabled || undefined" @click="() => { if (!previousDisabled && previousMonth) changeMonth(previousMonth); }"><ChevronLeft :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
        <button type="button" :class="cn('mc-calendar__navButton', classNames?.navButton)" aria-label="Next month" :aria-disabled="nextDisabled || undefined" @click="() => { if (!nextDisabled && nextMonth) changeMonth(nextMonth); }"><ChevronRight :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
      </div>
    </div>
    <div :class="cn('mc-calendar__weekdays', classNames?.weekdays)" aria-hidden="true"><span v-for="(day, index) in weekdays" :key="`${day}-${index}`">{{ day.slice(0, 2) }}</span></div>
    <div ref="viewport" :class="cn('mc-calendar__monthViewport', classNames?.monthViewport)">
      <template v-if="month">
        <div v-for="index in paneIndexes" :key="index" :ref="(el) => placePane(el, index)" class="mc-calendar__monthBody" :data-pane="index" :data-present="index === target || undefined" :aria-hidden="index === target ? undefined : true" :inert="index !== target">
          <span v-disc="cellOf(fromIndex(index))" :class="cn('mc-calendar__highlight', classNames?.highlight)" aria-hidden="true"><span class="mc-calendar__highlightFill" /></span>
          <div :class="cn('mc-calendar__grid', classNames?.grid)" role="grid" :aria-label="formatMonth(fromIndex(index), locale)">
            <div v-for="week in weeks(fromIndex(index))" :key="dateKey(week[0])" :class="cn('mc-calendar__week', classNames?.week)" role="row">
              <button
                v-for="date in week"
                :key="dateKey(date)"
                type="button"
                role="gridcell"
                :data-date="dateKey(date)"
                :aria-label="date.toLocaleDateString(locale, { dateStyle: 'full' })"
                :aria-selected="sameDay(date, value)"
                :aria-current="sameDay(date, today) ? 'date' : undefined"
                :tabindex="index === target && dateKey(date) === tabbableKey ? 0 : -1"
                :disabled="blocked(date)"
                :style="index === target ? numberDelay(dateKey(date)) : undefined"
                :class="cn('mc-calendar__day', !sameMonth(date, fromIndex(index)) ? 'mc-calendar__outside' : undefined, sameDay(date, value) ? 'mc-calendar__selected' : undefined, sameDay(date, today) ? 'mc-calendar__today' : undefined, classNames?.day)"
                @focus="focusedDate = date"
                @keydown="onDayKeydown($event, date)"
                @click="value = date"
              ><span class="mc-calendar__dayNumber">{{ date.getDate() }}</span></button>
            </div>
          </div>
        </div>
      </template>
      <div v-else :class="cn('mc-calendar__monthBody', classNames?.monthBody)" aria-hidden="true">
        <div :class="cn('mc-calendar__grid', classNames?.grid)"><div v-for="week in 6" :key="week" class="mc-calendar__week"><span v-for="day in 7" :key="day" class="mc-calendar__placeholderDay" /></div></div>
      </div>
    </div>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-calendar__calendar { width: min(100%, 328px); min-width: 0; color: var(--foreground); }
/* The header is its own size container: below 260px the title takes a full row and the controls sit under it, decided by width alone so a long month name never reflows it. */
.mc-calendar__header { container-type: inline-size; display: grid; min-height: 34px; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 12px; margin-bottom: 14px; }
@container (max-width: 259px) { .mc-calendar__heading, .mc-calendar__navigation { grid-column: 1 / -1; } .mc-calendar__navigation { justify-self: end; } }
.mc-calendar__heading { min-width: 0; margin: 0; font-family: var(--font-body); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); }
/* The global heading rule forces a tight line-height on h2, so the title row sets its own to center with the controls. */
.mc-calendar__title { display: grid; line-height: var(--leading-body); }
/* Old and new titles share one cell while they cross, so the heading never changes height or jumps. */
.mc-calendar__title > .mc-calendar__titleRow { grid-area: 1 / 1; justify-self: start; }
.mc-calendar__titleRow { display: inline-block; white-space: nowrap; font-variant-numeric: tabular-nums; }
.mc-calendar__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-calendar__navigation { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 2px; margin-right: -6px; }
/* Quiet header controls: a fill on hover, a short press, and a spring release. */
.mc-calendar__navButton, .mc-calendar__todayButton { display: grid; height: 32px; place-items: center; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); font: inherit; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), scale var(--duration-spring) var(--ease-spring); }
.mc-calendar__navButton { width: 32px; }
.mc-calendar__todayButton { padding: 0 11px; font-size: var(--text-sm); font-weight: 500; line-height: 1; }
@media (hover: hover) and (pointer: fine) { .mc-calendar__navButton:hover:not([aria-disabled]), .mc-calendar__todayButton:hover:not([aria-disabled]) { background: var(--surface-muted); color: var(--foreground); } }
.mc-calendar__navButton:active:not([aria-disabled]), .mc-calendar__todayButton:active:not([aria-disabled]) { scale: .96; transition-duration: var(--duration-fast), var(--duration-fast), var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard); }
.mc-calendar__navButton[aria-disabled], .mc-calendar__todayButton[aria-disabled] { cursor: default; opacity: .36; }
.mc-calendar__weekdays, .mc-calendar__week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); column-gap: 4px; }
.mc-calendar__weekdays { margin-bottom: 6px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; line-height: 24px; text-align: center; }
.mc-calendar__weekdays span { min-width: 0; overflow: hidden; }
/* Months sit on one strip inside a clipped window. Every pane shares one grid cell and has six weeks, so the height never changes. */
.mc-calendar__monthViewport { position: relative; display: grid; overflow: hidden; contain: paint; }
.mc-calendar__monthBody { position: relative; grid-area: 1 / 1; min-width: 0; will-change: transform; }
.mc-calendar__monthBody[inert] { pointer-events: none; }
.mc-calendar__grid { display: grid; row-gap: 4px; }
.mc-calendar__placeholderDay { aspect-ratio: 1; }
.mc-calendar__day { position: relative; display: grid; width: 100%; aspect-ratio: 1; min-width: 0; place-items: center; border: 0; border-radius: 50%; padding: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 400; line-height: 1; font-variant-numeric: tabular-nums; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard) var(--number-delay, 0ms); }
/* The inner circle carries hover and press; the grid cell itself never moves, so the hit area stays put. */
.mc-calendar__day::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: transparent; transition: background-color var(--duration-fast) var(--ease-standard), scale var(--duration-spring) var(--ease-spring); }
.mc-calendar__dayNumber { position: relative; transition: opacity var(--duration-fast) var(--ease-standard) var(--number-delay, 0ms), scale var(--duration-spring) var(--ease-spring); }
/* The selected disc is one element per month, one cell in size, placed by week and weekday under the day buttons. It glides on a transform, so the strip sliding around it never bends its path. Press scales the inner fill so it never fights the glide. */
.mc-calendar__highlight { position: absolute; top: 0; left: 0; width: calc((100% - 24px) / 7); aspect-ratio: 1; pointer-events: none; will-change: transform; }
.mc-calendar__highlightFill { position: absolute; inset: 0; border-radius: 50%; background: var(--accent); transition: background-color var(--duration-fast) var(--ease-standard), scale var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-calendar__day:hover:not(:disabled):not(.mc-calendar__selected)::before { background: var(--surface-muted); } .mc-calendar__monthBody:has(.mc-calendar__day.mc-calendar__selected:hover) .mc-calendar__highlightFill { background: var(--accent-strong); } }
.mc-calendar__day:active:not(:disabled)::before, .mc-calendar__day:active:not(:disabled) .mc-calendar__dayNumber, .mc-calendar__monthBody:has(.mc-calendar__day.mc-calendar__selected:active:not(:disabled)) .mc-calendar__highlightFill { scale: .94; transition-duration: var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard); }
/* Outside days dim their number, not the button, so a disc gliding onto one keeps its full strength. */
.mc-calendar__day.mc-calendar__outside { color: var(--text-muted); }
.mc-calendar__day.mc-calendar__outside:not(.mc-calendar__selected) .mc-calendar__dayNumber { opacity: .8; }
/* Today is a small dot under the number. It takes the number's color, so it flips with it when the disc arrives. */
.mc-calendar__day.mc-calendar__today .mc-calendar__dayNumber::after { content: ""; position: absolute; top: calc(100% + 4px); left: 50%; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: currentColor; }
.mc-calendar__day.mc-calendar__selected, .mc-calendar__day.mc-calendar__today { font-weight: 500; }
.mc-calendar__day.mc-calendar__selected { color: var(--accent-foreground); }
.mc-calendar__day:disabled { cursor: default; color: var(--text-muted); }
.mc-calendar__day:disabled .mc-calendar__dayNumber { opacity: .42; }
.mc-calendar__day.mc-calendar__outside:disabled .mc-calendar__dayNumber { opacity: .3; }
@media (prefers-reduced-motion: reduce) {
  .mc-calendar__navButton, .mc-calendar__todayButton, .mc-calendar__day, .mc-calendar__day::before, .mc-calendar__dayNumber, .mc-calendar__highlightFill { transition: none; }
  .mc-calendar__navButton:active, .mc-calendar__todayButton:active, .mc-calendar__day:active::before, .mc-calendar__monthBody:has(.mc-calendar__day.mc-calendar__selected:active) .mc-calendar__highlightFill, .mc-calendar__day:active .mc-calendar__dayNumber { scale: none; }
}
</style>
