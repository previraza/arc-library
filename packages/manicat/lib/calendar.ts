/**
 * Date helpers shared by the calendar, date picker and date range picker ports (React Native and Vue). Pure functions on
 * `Date`, no dependency: a month is always laid out as six weeks so the grid never changes height between months.
 */

export type CalendarDateMatcher = (date: Date) => boolean;

export interface CalendarLimits {
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: CalendarDateMatcher;
}

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const addMonths = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth() + count, 1);
export const addDays = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);

export const sameDay = (a?: Date | null, b?: Date | null) =>
  Boolean(a && b) && a!.getFullYear() === b!.getFullYear() && a!.getMonth() === b!.getMonth() && a!.getDate() === b!.getDate();

/** The 42 days shown for a month, starting on `weekStartsOn` (0 is Sunday, 1 is Monday). */
export function monthGrid(month: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => addDays(first, index - offset));
}

/** Short weekday names in column order, in the given locale. */
export function weekdayLabels(locale = "en-US", weekStartsOn: 0 | 1 = 0): string[] {
  // 2024-01-07 was a Sunday.
  return Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + ((index + weekStartsOn) % 7)).toLocaleDateString(locale, { weekday: "short" }));
}

export const monthLabel = (month: Date, locale = "en-US") => month.toLocaleDateString(locale, { month: "long", year: "numeric" });

export function isDisabled(date: Date, { minDate, maxDate, disabledDates }: CalendarLimits): boolean {
  const day = startOfDay(date).getTime();
  return Boolean((minDate && day < startOfDay(minDate).getTime()) || (maxDate && day > startOfDay(maxDate).getTime()) || disabledDates?.(date));
}

export const sameMonth = (a?: Date | null, b?: Date | null) => Boolean(a && b) && a!.getFullYear() === b!.getFullYear() && a!.getMonth() === b!.getMonth();
/** Moves by whole months and keeps the day, clamped to the shorter month: January 31 plus one month is February 28. */
export const shiftMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), new Date(date.getFullYear(), date.getMonth() + amount + 1, 0).getDate()));
export const isBefore = (a: Date, b?: Date) => Boolean(b && startOfDay(a).getTime() < startOfDay(b).getTime());
export const isAfter = (a: Date, b?: Date) => Boolean(b && startOfDay(a).getTime() > startOfDay(b).getTime());
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
