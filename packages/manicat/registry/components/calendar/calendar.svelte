<script lang="ts">
  import { tick } from "svelte";
  import { addDays, addMonths, isDisabled, monthGrid, monthLabel, sameDay, startOfMonth, weekdayLabels } from "@/lib/calendar";
  import type { CalendarDateMatcher } from "@/lib/calendar";

  interface Props {
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: CalendarDateMatcher;
    locale?: string;
    weekStartsOn?: 0 | 1;
    showToday?: boolean;
    /** Draws a range between these two days (used by the date range picker). */
    range?: { start: Date; end?: Date | null };
    /** The selected day. Bind it with `bind:value`. */
    value?: Date;
    /** The month on show. Bind it with `bind:month`. */
    month?: Date;
    onhover?: (date: Date) => void;
    /** Extend the inner, named parts of the calendar: header, title, nav, weekday, day, selected or today. */
    classNames?: { header?: string; title?: string; nav?: string; weekday?: string; day?: string; selected?: string; today?: string };
  }

  let { minDate, maxDate, disabledDates, locale = "en-US", weekStartsOn = 0, showToday = true, range, value = $bindable(), month = $bindable(startOfMonth(new Date())), onhover, classNames }: Props = $props();

  const id = $props.id();
  let focused = $state<Date>();
  const today = new Date();

  const days = $derived(monthGrid(month, weekStartsOn));
  const weekdays = $derived(weekdayLabels(locale, weekStartsOn));

  const limits = $derived({ minDate, maxDate, disabledDates });
  const inRange = (date: Date) => Boolean(range?.start && range.end && date >= range.start && date <= range.end);

  function choose(date: Date) {
    if (isDisabled(date, limits)) return;
    value = date;
    if (date.getMonth() !== month.getMonth()) month = startOfMonth(date);
  }

  // Arrow keys move through days, PageUp/PageDown through months, as in a date grid.
  async function onKeydown(event: KeyboardEvent, date: Date) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key as "ArrowLeft"];
    let next: Date | undefined;
    if (step) next = addDays(date, step);
    else if (event.key === "PageUp") next = addMonths(date, -1);
    else if (event.key === "PageDown") next = addMonths(date, 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      return choose(date);
    } else return;
    event.preventDefault();
    if (next.getMonth() !== month.getMonth()) month = startOfMonth(next);
    focused = next;
    await tick();
    document.getElementById(`${id}-${next.getFullYear()}-${next.getMonth()}-${next.getDate()}`)?.focus();
  }
</script>

<div class="mc-cal">
  <div class={["mc-cal__header", classNames?.header]}>
    <button type="button" class={["mc-cal__nav", classNames?.nav]} aria-label="Previous month" onclick={() => (month = addMonths(month, -1))}>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3.5-4.5 4.5L10 12.5" /></svg>
    </button>
    <h3 class={["mc-cal__title", classNames?.title]} aria-live="polite">{monthLabel(month, locale)}</h3>
    <button type="button" class={["mc-cal__nav", classNames?.nav]} aria-label="Next month" onclick={() => (month = addMonths(month, 1))}>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
    </button>
  </div>
  <div class="mc-cal__grid" role="grid" aria-label={monthLabel(month, locale)}>
    {#each weekdays as label (label)}
      <span role="columnheader" class={["mc-cal__weekday", classNames?.weekday]}>{label.slice(0, 2)}</span>
    {/each}
    {#each days as date (date.toISOString())}
      <button
        id="{id}-{date.getFullYear()}-{date.getMonth()}-{date.getDate()}"
        type="button"
        role="gridcell"
        class={["mc-cal__day", classNames?.day, sameDay(date, value) || sameDay(date, range?.start) || sameDay(date, range?.end) ? classNames?.selected : ""]}
        aria-selected={sameDay(date, value) || undefined}
        aria-label={date.toDateString()}
        tabindex={sameDay(date, focused ?? value ?? today) ? 0 : -1}
        disabled={isDisabled(date, limits)}
        data-outside={date.getMonth() !== month.getMonth() || undefined}
        data-today={(showToday && sameDay(date, today)) || undefined}
        data-selected={sameDay(date, value) || sameDay(date, range?.start) || sameDay(date, range?.end) || undefined}
        data-in-range={inRange(date) || undefined}
        onclick={() => choose(date)}
        onpointerenter={() => onhover?.(date)}
        onkeydown={(event) => onKeydown(event, date)}
      >
        {date.getDate()}
      </button>
    {/each}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-cal { width: 100%; max-width: 20rem; }
.mc-cal__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
.mc-cal__title { margin: 0; font-size: var(--text-sm); font-weight: 600; }
.mc-cal__nav { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-cal__nav:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.mc-cal__weekday { padding: 6px 0; color: var(--text-muted); font-size: var(--text-xs); text-align: center; }
.mc-cal__day { aspect-ratio: 1; display: grid; place-items: center; border: 1px solid transparent; border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; cursor: pointer; }
.mc-cal__day[data-outside] { color: var(--text-muted); }
.mc-cal__day[data-today] { border-color: var(--border-strong); }
.mc-cal__day[data-in-range] { background: var(--surface-muted); border-radius: 0; }
@media (hover: hover) and (pointer: fine) { .mc-cal__day:hover:not(:disabled, [data-selected]) { background: var(--surface-muted); } }
.mc-cal__day[data-selected] { border-radius: var(--radius-pill); background: var(--control-on); color: var(--control-glyph); }
.mc-cal__day:disabled { opacity: .4; cursor: not-allowed; }
.mc-cal__day:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
}
</style>
