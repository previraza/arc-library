// @manicat-dependencies motion
/**
 * The sorting, the measuring and the motion of the sortable data table, for the Vue and Svelte ports. The counterparts of the module
 * level helpers, `Swap` and `SortGlyph` in sortable-data-table.tsx: the ports own the elements and hand them over.
 */
import { animate } from "motion";
import type { Pose, Timing } from "./motion-dom";
import { motionTokens } from "./motion-tokens";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection };

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
export const isEmpty = (value: unknown) => value == null || value === "";
const comparable = (value: unknown) => (value instanceof Date ? value.getTime() : value);

/** Rows in sorted order. Empty values stay at the bottom in both directions, and equal values keep their original order. */
export function sortRows<T extends Record<string, unknown>>(rows: T[], sort: SortState | null): T[] {
  if (!sort) return rows;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const left = comparable(a.row[sort.key]);
      const right = comparable(b.row[sort.key]);
      if (isEmpty(left) || isEmpty(right)) return isEmpty(left) === isEmpty(right) ? a.index - b.index : isEmpty(left) ? 1 : -1;
      const result = typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left), String(right));
      return (sort.direction === "asc" ? result : -result) || a.index - b.index;
    })
    .map((entry) => entry.row);
}

/** Right-aligned columns: the ones marked `numeric`, or every column whose values are all numbers. */
export function numericKeys<T extends Record<string, unknown>>(columns: { key: string; numeric?: boolean }[], rows: T[]) {
  return new Set(columns.filter((column) => column.numeric ?? (rows.some((row) => typeof row[column.key] === "number") && rows.every((row) => typeof row[column.key] === "number" || isEmpty(row[column.key])))).map((column) => column.key));
}

/** The natural width of every header cell, in percent of the table, or null while the table is not laid out as a table. */
export function measureWidths(table: HTMLElement) {
  const total = table.getBoundingClientRect().width;
  if (!total || getComputedStyle(table).display !== "table") return null;
  const next: Record<string, number> = {};
  table.querySelectorAll<HTMLElement>("thead th[data-key]").forEach((cell) => {
    next[cell.dataset.key ?? ""] = (cell.getBoundingClientRect().width / total) * 100;
  });
  return next;
}

/** Where the tint under the sorted column goes, or null when no column is sorted. */
export function measureBand(table: HTMLElement | undefined, key: string | undefined) {
  const cell = key ? table?.querySelector<HTMLElement>(`thead th[data-key="${CSS.escape(key)}"]`) : null;
  return cell ? { left: cell.offsetLeft, width: cell.offsetWidth } : null;
}

/** On a phone the header is a scrolling strip of sort controls; keeps the sorted one in view. */
export function revealSorted(table: HTMLElement, key: string, smooth: boolean) {
  const cell = table.querySelector<HTMLElement>(`thead th[data-key="${CSS.escape(key)}"]`);
  const strip = cell?.parentElement;
  if (!cell || !strip || strip.scrollWidth <= strip.clientWidth || getComputedStyle(table).display === "table") return;
  const bounds = strip.getBoundingClientRect();
  const target = cell.getBoundingClientRect();
  const inset = 8;
  const start = Math.max(bounds.left, strip.querySelector("th:not([data-key])")?.getBoundingClientRect().right ?? bounds.left) + inset;
  const shift = target.right > bounds.right - inset ? target.right - bounds.right + inset : target.left < start ? target.left - start : 0;
  if (shift) strip.scrollTo({ left: strip.scrollLeft + shift, behavior: smooth ? "smooth" : "auto" });
}

/** Arrows walk the header controls and the row checkboxes; Escape clears the selection. */
export function tableKeys(event: KeyboardEvent, root: HTMLElement, { selectAll, selected, clear, clearFromButton }: { selectAll: HTMLInputElement | undefined; selected: number; clear: () => void; clearFromButton: () => void }) {
  const target = event.target as HTMLElement;
  if (event.key === "Escape" && selected) {
    event.preventDefault();
    event.stopPropagation();
    if (target.dataset.clear !== undefined) clearFromButton();
    else clear();
    return;
  }
  const nav = target.dataset.nav;
  if (!nav) return;
  const list = (name: string) => [...root.querySelectorAll<HTMLElement>(`[data-nav="${name}"]`)];
  const items = list(nav);
  const index = items.indexOf(target);
  const steps: Record<string, [HTMLElement[], number]> =
    nav === "head"
      ? { ArrowRight: [items, index + 1], ArrowLeft: [items, index - 1], Home: [items, 0], End: [items, items.length - 1], ...(target === selectAll ? { ArrowDown: [list("row"), 0] as [HTMLElement[], number] } : {}) }
      : { ArrowDown: [items, index + 1], ArrowUp: index === 0 && selectAll ? [[selectAll], 0] : [items, index - 1], Home: [items, 0], End: [items, items.length - 1] };
  const step = steps[event.key];
  const next = step?.[0][step[1]];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

/** The poses of changing text: it rises in from the side it is moving toward and lifts away on the other. Reduced motion only fades. */
export function swapPoses(node: HTMLElement, direction: number, reduced: boolean) {
  const em = parseFloat(getComputedStyle(node).fontSize) || 16;
  const { duration, blur } = motionTokens;
  if (reduced) {
    const instant: Timing = { duration: duration.instant };
    return { enter: { opacity: 0 } as Pose, shown: { opacity: 1 } as Pose, gone: { opacity: 0 } as Pose, enterTiming: instant, leaveTiming: instant };
  }
  return {
    enter: { opacity: 0, y: 0.3 * direction * em, blur: blur.soft } as Pose,
    shown: { opacity: 1, y: 0, blur: 0 } as Pose,
    gone: { opacity: 0, y: -0.3 * direction * em, blur: blur.subtle } as Pose,
    enterTiming: { duration: duration.standard, ease: "enter" } as Timing,
    leaveTiming: { duration: duration.fast, ease: "standard" } as Timing,
  };
}

/** Keeps a swap slot as wide as its text. The first measure jumps; every later one eases to the new width on a spring. */
export function createSwapWidth(slot: HTMLElement, inner: HTMLElement, reduced: boolean) {
  let settled = false;
  let width = 0;
  let running: { stop(): void } | undefined;
  const apply = (value: number) => {
    width = value;
    slot.style.width = `${value}px`;
  };
  const measure = () => {
    const next = inner.getBoundingClientRect().width;
    running?.stop();
    if (settled && !reduced) running = animate(width, next, { ...motionTokens.spring.morph, onUpdate: apply } as never);
    else apply(next);
    settled = true;
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(inner);
  return () => {
    observer.disconnect();
    running?.stop();
  };
}

/** The sort arrow: it fades in where a column becomes sorted and flips on a spring when the direction changes. */
export function createSortGlyph(arrow: HTMLElement, { active, descending, reduced }: { active: boolean; descending: boolean; reduced: boolean }) {
  const { duration, ease, blur } = motionTokens;
  const state = { active, hiddenAt: -Infinity };
  const rest = (on: boolean) => ({ opacity: on ? 1 : 0, scale: on ? 1 : 0.6, filter: `blur(${on ? 0 : blur.subtle}px)` });
  animate(arrow, { ...rest(active), rotate: descending ? 180 : 0 } as never, { duration: 0 });
  return (next: { active: boolean; descending: boolean }) => {
    if (next.active) {
      // Turn only while the arrow is visible; a freshly shown arrow starts pointing the right way.
      const visible = state.active || performance.now() - state.hiddenAt < 160;
      animate(arrow, { rotate: next.descending ? 180 : 0 } as never, visible && !reduced ? (motionTokens.spring.snappy as never) : { duration: 0 });
    } else if (state.active) state.hiddenAt = performance.now();
    if (next.active !== state.active) {
      const enter = { duration: duration.standard, ease: [...ease.enter] };
      animate(arrow, rest(next.active) as never, (reduced ? { duration: duration.instant } : next.active ? { opacity: enter, filter: enter, scale: motionTokens.spring.snappy } : { duration: duration.instant, ease: [...ease.standard] }) as never);
    }
    state.active = next.active;
  };
}
