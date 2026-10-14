// @manicat-dependencies motion
/**
 * The cells of the waffle chart, for the Vue and Svelte ports: whole cells per category by largest remainder, the reassignment that
 * moves as few cells as possible, and the motion that draws the cells in and lets them fly between blocks when the data changes.
 * The counterparts of `allocate`, `reassign` and the cell motion props in waffle-chart.tsx.
 */
import { animate } from "motion";
import { motionTokens } from "./motion-tokens";

export interface WaffleCategory {
  /** Stable identity. Cells keep following their category when the data changes, so a new dataset flows instead of repainting. */
  key: string;
  /** Name in the legend, the tooltip, and the data table. */
  label: string;
  /** Raw amount. Shares are computed from the total; negatives count as zero. */
  value: number;
  /** Any CSS color. Defaults to the first series for accentKey, the supporting series for the next three, then neutral steps. */
  color?: string;
}
export type Cell = { id: number; key: string | null; slot: number };

const { spring } = motionTokens;
export const GAP = 3;
/** accentKey takes the first series and the next three categories the supporting series. Anything past that falls back to neutral steps that alternate in lightness. */
export const SHADES = [40, 20, 30, 14];
/** A second, colour-free channel: neutral categories cycle through square, round, and framed cells, so neighbours differ in shape as well as lightness. */
export const SHAPES = ["square", "round", "framed"] as const;
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Whole cells per category by largest remainder, so the counts always add up to the grid. */
export function allocate(data: WaffleCategory[], total: number, cells: number): number[] {
  if (total <= 0) return data.map(() => 0);
  const exact = data.map((item) => (Math.max(0, item.value) / total) * cells);
  const counts = exact.map(Math.floor);
  let left = cells - counts.reduce((sum, count) => sum + count, 0);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  for (let k = 0; left > 0 && k < order.length; k++, left--) counts[order[k].index]++;
  return counts;
}

/**
 * Hands cells to categories while moving as few as possible: each category keeps the cells it already had,
 * surplus cells join the categories that grew, and every block takes its cells in their previous order so paths never cross.
 */
export function reassign(previous: Cell[], data: WaffleCategory[], counts: number[]): Cell[] {
  const bySlot = [...previous].sort((a, b) => a.slot - b.slot);
  const kept = new Map<string, Cell[]>();
  const pool: Cell[] = [];
  const want = new Map(data.map((item, index) => [item.key, counts[index]]));
  for (const cell of bySlot) {
    const list = cell.key !== null ? (kept.get(cell.key) ?? []) : [];
    if (cell.key !== null && list.length < (want.get(cell.key) ?? 0)) {
      list.push(cell);
      kept.set(cell.key, list);
    } else pool.push(cell);
  }
  const next: Cell[] = [];
  let slot = 0;
  data.forEach((item, index) => {
    const own = kept.get(item.key) ?? [];
    while (own.length < counts[index] && pool.length) own.push(pool.shift()!);
    own.sort((a, b) => a.slot - b.slot).forEach((cell) => next.push({ id: cell.id, key: item.key, slot: slot++ }));
  });
  pool.forEach((cell) => next.push({ id: cell.id, key: null, slot: slot++ }));
  return next.sort((a, b) => a.id - b.id);
}

export function createWaffleMotion(grid: HTMLElement, { reduced, rows }: { reduced: boolean; rows: number }) {
  const last = new Map<number, { x: number; y: number; key: string | null }>();
  let revealed = false;
  const settle = reduced ? { duration: 0 } : spring.morph;
  const cellEl = (id: number) => grid.querySelector<HTMLElement>(`[data-cell="${id}"]`);

  return {
    /** Column by column from the bottom-left corner, like a glass filling up. */
    place(slot: number, size: number) {
      return { x: Math.floor(slot / rows) * (size + GAP), y: (rows - 1 - (slot % rows)) * (size + GAP) };
    },
    /** Call after the DOM has the new cells. `moved` are the cells that changed hands; `visible` turns true once the chart has been seen. */
    update(cells: Cell[], { size, visible, moved, version }: { size: number; visible: boolean; moved: Set<number>; version: number }) {
      const count = cells.length;
      for (const cell of cells) {
        const el = cellEl(cell.id);
        if (!el) continue;
        const x = Math.floor(cell.slot / rows) * (size + GAP);
        const y = (rows - 1 - (cell.slot % rows)) * (size + GAP);
        const before = last.get(cell.id);
        const delay = reduced ? 0 : (cell.slot / count) * 0.32;
        if (!before) {
          // First sight: where it will live, hidden until the chart has been seen.
          el.style.transform = `translate(${x}px, ${y}px) scale(${revealed || reduced ? 1 : 0.4})`;
          el.style.opacity = revealed || reduced ? (cell.key === null ? "0" : "1") : "0";
        } else if (revealed && (before.x !== x || before.y !== y || before.key !== cell.key)) {
          const travel = moved.has(cell.id) && !reduced;
          // A travelling cell dips while it flies, so the flow reads as cells lifting out of one block and landing in another.
          const dip = travel ? [1, 0.62 + (version % 2) * 0.001, 1] : 1;
          animate(el, { x: [before.x, x], y: [before.y, y], scale: dip, opacity: cell.key === null ? 0 : 1 } as never, (reduced ? { duration: 0 } : {
            x: { ...(settle as object), delay },
            y: { ...(settle as object), delay },
            scale: travel ? { duration: 0.62, times: [0, 0.42, 1], ease: motionTokens.ease.inOut, delay } : { ...(spring.snappy as object), delay: delay * 0.6 },
            opacity: { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard, delay: delay * 0.6 },
          }) as never);
        } else if (!revealed) {
          el.style.transform = `translate(${x}px, ${y}px) scale(${reduced ? 1 : 0.4})`;
        }
        last.set(cell.id, { x, y, key: cell.key });
      }
      if (visible && !revealed) {
        revealed = true;
        for (const cell of cells) {
          const el = cellEl(cell.id);
          if (!el) continue;
          const { x, y } = last.get(cell.id)!;
          const delay = reduced ? 0 : (cell.slot / count) * 0.32;
          animate(el, { x, y, scale: [0.4, 1], opacity: [0, cell.key === null ? 0 : 1] } as never, (reduced ? { duration: 0 } : {
            x: { ...(settle as object), delay },
            y: { ...(settle as object), delay },
            scale: { ...(spring.snappy as object), delay: delay * 0.6 },
            opacity: { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard, delay: delay * 0.6 },
          }) as never);
        }
      }
    },
  };
}
