// @manicat-dependencies motion
/**
 * The layout and the motion of the slope chart, for the Vue and Svelte ports. `layoutSlope` turns the data into rows (value
 * positions, label positions, ranks) and `createSlopeMotion` moves every line, dot and label to its new place on a spring, draws them
 * once the chart is seen, and glides the tooltip. The counterparts of the geometry and the motion props in slope-chart.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export interface SlopeItem {
  /** Stable identity. An item keeps its line across datasets, so switching morphs it. */
  key: string;
  /** Name beside the start value, in the tooltip, and in the table. */
  label: string;
  /** Value in the first period. */
  start: number;
  /** Value in the second period. */
  end: number;
}

export type SlopeRow = { item: SlopeItem; y0: number; y1: number; l0: number; l1: number; rank0: number; rank1: number; order: number };

const { spring } = motionTokens;
export const LABEL_GAP = 20;
export const PAD = 14;
export const HEAD = 28;
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Moves labels apart just enough to stop overlaps: touching labels form a group centred on where its members want to be. */
function spread(wanted: number[], gap: number, low: number, high: number): number[] {
  const order = wanted.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  let groups = order.map((entry) => ({ members: [entry], top: entry.y }));
  for (let changed = true; changed; ) {
    changed = false;
    const next: typeof groups = [];
    for (const group of groups) {
      const prev = next[next.length - 1];
      if (prev && prev.top + prev.members.length * gap > group.top) {
        const members = [...prev.members, ...group.members];
        next[next.length - 1] = { members, top: members.reduce((sum, member, k) => sum + member.y - k * gap, 0) / members.length };
        changed = true;
      } else next.push(group);
    }
    groups = next.map((group) => ({ ...group, top: clamp(group.top, low, Math.max(low, high - (group.members.length - 1) * gap)) }));
  }
  const out = new Array<number>(wanted.length);
  groups.forEach((group) => group.members.forEach((member, k) => (out[member.index] = group.top + k * gap)));
  return out;
}

export function layoutSlope(data: SlopeItem[], plotHeight: number): { rows: SlopeRow[]; byEnd: SlopeRow[] } {
  // One shared value axis for both columns, padded so dots never touch the edges.
  const values = data.flatMap((item) => [item.start, item.end]);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const yOf = (value: number) => PAD + (1 - (value - lo) / (hi - lo)) * (plotHeight - PAD * 2);
  const rankOf = (field: "start" | "end") => {
    const sorted = [...data].sort((a, b) => b[field] - a[field]);
    return (item: SlopeItem) => sorted.indexOf(item) + 1;
  };
  const r0 = rankOf("start");
  const r1 = rankOf("end");
  const l0 = spread(data.map((item) => yOf(item.start)), LABEL_GAP, 8, plotHeight - 8);
  const l1 = spread(data.map((item) => yOf(item.end)), LABEL_GAP, 8, plotHeight - 8);
  const rows: SlopeRow[] = data.map((item, i) => ({ item, y0: yOf(item.start), y1: yOf(item.end), l0: l0[i], l1: l1[i], rank0: r0(item), rank1: r1(item), order: 0 }));
  const byEnd = [...rows].sort((a, b) => a.rank1 - b.rank1);
  byEnd.forEach((row, k) => (row.order = k));
  return { rows, byEnd };
}

type Last = { y0: number; y1: number; l0: number; l1: number; x0: number; x1: number };

export function createSlopeMotion(root: HTMLElement, { reduced }: { reduced: boolean }) {
  const last = new Map<string, Last>();
  let revealed = false;
  const settle = reduced ? { duration: 0 } : spring.morph;
  const pick = <T extends Element>(selector: string, key: string) => [...root.querySelectorAll<T>(`${selector}[data-key="${CSS.escape(key)}"]`)];
  const track = (key: string, kind: string) => root.querySelector<HTMLElement>(`[data-${kind}][data-key="${CSS.escape(key)}"]`);

  /** What waits before the chart has been seen: lines undrawn, dots at no size, labels clear. */
  const hide = (rows: SlopeRow[]) => {
    for (const row of rows) {
      const key = row.item.key;
      const line = track(key, "line");
      if (line) {
        line.setAttribute("pathLength", "1");
        line.style.strokeDasharray = "0 1";
      }
      pick<SVGCircleElement>("[data-dot]", key).forEach((dot) => (dot.style.transform = "scale(0)"));
      pick<HTMLElement>("[data-label]", key).forEach((label) => (label.style.opacity = "0"));
    }
  };

  /** Draws the lines, dots and labels in once the chart has been seen: lines first, then the end dots and labels follow. */
  const reveal = (rows: SlopeRow[]) => {
    rows.forEach((row, i) => {
      const delay = reduced ? 0 : i * 0.05;
      const key = row.item.key;
      const line = track(key, "line");
      if (line) line.style.strokeDasharray = "";
      if (line) animate(line, { pathLength: [0, 1] } as never, (reduced ? { duration: 0 } : { duration: 0.7, ease: motionTokens.ease.inOut, delay: 0.1 + delay }) as never);
      pick<SVGCircleElement>("[data-dot]", key).forEach((dot) => {
        const end = dot.dataset.dot === "1";
        animate(dot, { scale: [0, 1] } as never, (reduced ? { duration: 0 } : { ...(spring.snappy as object), delay: end ? 0.7 + delay : delay }) as never);
      });
      pick<HTMLElement>("[data-label]", key).forEach((label) => {
        const end = label.dataset.label === "1";
        animate(label, { opacity: [0, 1] }, { duration: 0.3, delay: end ? 0.7 + delay : delay } as never);
      });
    });
  };

  return {
    /** Call after the DOM has the new rows. `visible` turns true once the chart has been seen. */
    update(rows: SlopeRow[], { x0, x1, visible }: { x0: number; x1: number; visible: boolean }) {
      const keys = new Set(rows.map((row) => row.item.key));
      for (const key of [...last.keys()]) if (!keys.has(key)) last.delete(key);
      const fresh = rows.filter((row) => !last.has(row.item.key));
      if (!revealed) hide(rows);
      else if (fresh.length) {
        hide(fresh);
        reveal(fresh);
      }
      for (const row of rows) {
        const key = row.item.key;
        const before = last.get(key);
        if (before) {
          const move = (el: Element | null, keyframes: Record<string, [number, number]>) => el && animate(el, keyframes as never, settle as never);
          if (before.l0 !== row.l0 || before.y0 !== row.y0) {
            const leader = pick<SVGPathElement>("[data-leader]", key).find((el) => el.dataset.leader === "0");
            if (leader) animate(leader, { d: [`M${before.x0 - 6},${before.l0}L${before.x0 - 1},${before.y0}`, `M${x0 - 6},${row.l0}L${x0 - 1},${row.y0}`] } as never, settle as never);
          }
          if (before.l1 !== row.l1 || before.y1 !== row.y1) {
            const leader = pick<SVGPathElement>("[data-leader]", key).find((el) => el.dataset.leader === "1");
            if (leader) animate(leader, { d: [`M${before.x1 + 6},${before.l1}L${before.x1 + 1},${before.y1}`, `M${x1 + 6},${row.l1}L${x1 + 1},${row.y1}`] } as never, settle as never);
          }
          if (before.y0 !== row.y0 || before.y1 !== row.y1) {
            const line = track(key, "line");
            if (line) animate(line, { y1: [before.y0, row.y0], y2: [before.y1, row.y1] } as never, settle as never);
          }
          for (const dot of pick<SVGCircleElement>("[data-dot]", key)) {
            const end = dot.dataset.dot === "1";
            const from = end ? before.y1 : before.y0;
            const to = end ? row.y1 : row.y0;
            if (from !== to) animate(dot, { cy: [from, to] } as never, settle as never);
          }
          for (const label of pick<HTMLElement>("[data-label]", key)) {
            const end = label.dataset.label === "1";
            const from = end ? before.l1 : before.l0;
            const to = end ? row.l1 : row.l0;
            if (from !== to) move(label, { y: [from, to] });
          }
        }
        last.set(key, { y0: row.y0, y1: row.y1, l0: row.l0, l1: row.l1, x0, x1 });
      }
      if (visible && !revealed) {
        revealed = true;
        reveal(rows);
      }
    },
  };
}

/** The tooltip glides to the middle of the line in focus and stays inside the chart. */
export function createTooltipFollow(tip: HTMLElement, reduced: boolean) {
  const x = motionValue(0);
  const y = motionValue(0);
  const paint = () => (tip.style.transform = `translate(${x.get()}px, ${y.get()}px)`);
  x.on("change", paint);
  y.on("change", paint);
  let shown = false;
  let runs: AnimationPlaybackControls[] = [];
  const follow = { type: "spring", stiffness: 480, damping: 42, restDelta: 0.01 } as const;
  return {
    to(left: number, top: number) {
      runs.forEach((run) => run.stop());
      if (!shown || reduced) {
        x.jump(left);
        y.jump(top);
      } else runs = [animate(x as never, left, follow as never), animate(y as never, top, follow as never)];
      shown = true;
    },
    hide() {
      shown = false;
    },
  };
}
