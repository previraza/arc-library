// @manicat-dependencies motion
/**
 * The layout and the motion of the treemap, for the Vue and Svelte ports: the flattened tree, the squarified layout, the zoom that
 * carries tiles between levels on a spring, the keyboard map and the color scale. The counterparts of the module level helpers and
 * the tile effect in treemap.tsx; a port renders the markup and hands the stage over.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export interface TreemapNode {
  /** Stable identity, unique in the tree. A tile that survives a data change morphs to its new size. */
  id: string;
  label: string;
  /** Leaf size. A branch's size is the sum of its children. */
  value?: number;
  /** Optional second measure for shading, such as growth. A branch uses the size weighted mean of its children. */
  color?: number;
  children?: TreemapNode[];
}

export type Rect = { x: number; y: number; w: number; h: number };
export type Flat = { id: string; label: string; value: number; color: number | null; depth: number; parent: string | null; children: string[]; path: string[] };
type Drawn = Rect & { o: number };

const { spring } = motionTokens;
export const physical = ({ visualDuration, bounce }: { visualDuration: number; bounce: number }, restDelta = 0.0005) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, restDelta, restSpeed: restDelta * 2 };
};
const zoom = physical({ visualDuration: 0.62, bounce: 0.06 });
const reveal = physical({ visualDuration: 0.9, bounce: 0 });
const glide = physical(spring.snappy, 0.01);
/** The spring the tooltip follows the pointer on. */
export const follow = { stiffness: glide.stiffness, damping: glide.damping };
/** Top level branches take the four series hues in order; a fifth and beyond stay neutral rather than reuse a hue. */
export const hueOf = (index: number) => (index < 0 ? "var(--series-1)" : index < 4 ? `var(--series-${index + 1})` : "var(--foreground)");
export const GAP = 2;
const PAD = 3;
const HEADER = 22;
export const TIP = 14;
export const STEPS = 5;
export const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const inset = (r: Rect, top: number, side: number): Rect => ({ x: r.x + side, y: r.y + top, w: Math.max(0, r.w - side * 2), h: Math.max(0, r.h - top - side) });

export function flatten(root: TreemapNode) {
  const flat = new Map<string, Flat>();
  const visit = (node: TreemapNode, depth: number, parent: string | null, path: string[]): { value: number; weighted: number; colored: number } => {
    const kids = node.children ?? [];
    let value = 0;
    let weighted = 0;
    let colored = 0;
    if (kids.length) {
      for (const kid of kids) {
        const r = visit(kid, depth + 1, node.id, depth === 0 ? [] : [...path, node.label]);
        value += r.value;
        weighted += r.weighted;
        colored += r.colored;
      }
    } else {
      value = Math.max(0, node.value ?? 0);
      if (node.color !== undefined && Number.isFinite(node.color)) {
        weighted = node.color * value;
        colored = value;
      }
    }
    flat.set(node.id, { id: node.id, label: node.label, value, color: colored ? weighted / colored : null, depth, parent, children: kids.map((kid) => kid.id), path: depth === 0 ? [node.label] : [...path, node.label] });
    return { value, weighted, colored };
  };
  visit(root, 0, null, []);
  return flat;
}

/** Squarified layout: rows of tiles along the short side, each row closed when adding a tile would make the worst aspect ratio worse. */
function squarify(items: { id: string; value: number }[], rect: Rect, out: Map<string, Rect>) {
  const list = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = list.reduce((sum, item) => sum + item.value, 0);
  if (!total || rect.w <= 0 || rect.h <= 0) {
    for (const item of items) out.set(item.id, { x: rect.x, y: rect.y, w: 0, h: 0 });
    return;
  }
  const scale = (rect.w * rect.h) / total;
  let { x, y, w, h } = rect;
  let i = 0;
  const worst = (row: number[], side: number) => {
    const sum = row.reduce((a, b) => a + b, 0);
    const max = Math.max(...row);
    const min = Math.min(...row);
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };
  while (i < list.length) {
    const side = Math.min(w, h);
    const row: number[] = [list[i].value * scale];
    let j = i + 1;
    while (j < list.length) {
      const next = [...row, list[j].value * scale];
      if (worst(next, side) > worst(row, side)) break;
      row.push(list[j].value * scale);
      j++;
    }
    const sum = row.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const cw = sum / h;
      let cy = y;
      for (let k = i; k < j; k++) {
        const th = (list[k].value * scale) / cw;
        out.set(list[k].id, { x, y: cy, w: cw, h: th });
        cy += th;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = sum / w;
      let cx = x;
      for (let k = i; k < j; k++) {
        const tw = (list[k].value * scale) / rh;
        out.set(list[k].id, { x: cx, y, w: tw, h: rh });
        cx += tw;
      }
      y += rh;
      h -= rh;
    }
    i = j;
  }
  for (const item of items) if (!out.has(item.id)) out.set(item.id, { x: rect.x, y: rect.y, w: 0, h: 0 });
}

/** Rects of every descendant when `focus` fills the view: its children fill the view, and each branch holds its own children under a header. */
export function layoutFrom(flat: Map<string, Flat>, focus: string, view: Rect) {
  const out = new Map<string, Rect>();
  const nest = (id: string, rect: Rect, top: boolean) => {
    const node = flat.get(id)!;
    if (!node.children.length) return;
    const room = top ? rect : inset(rect, rect.h > 48 && rect.w > 64 ? HEADER : PAD, PAD);
    const placed = new Map<string, Rect>();
    squarify(node.children.map((child) => ({ id: child, value: flat.get(child)!.value })), room, placed);
    for (const [child, r] of placed) {
      const gapped = { x: r.x + GAP / 2, y: r.y + GAP / 2, w: Math.max(0, r.w - GAP), h: Math.max(0, r.h - GAP) };
      out.set(child, gapped);
      nest(child, gapped, false);
    }
  };
  nest(focus, view, true);
  return out;
}

/** The affine map that carries rect `from` onto rect `to`, applied to `r`. */
const carry = (r: Rect, from: Rect, to: Rect): Rect => {
  const sx = to.w / (from.w || 1);
  const sy = to.h / (from.h || 1);
  return { x: to.x + (r.x - from.x) * sx, y: to.y + (r.y - from.y) * sy, w: r.w * sx, h: r.h * sy };
};

/** Which top level branch every node belongs to, for its hue. */
export function branchIndex(flat: Map<string, Flat>, root: Flat) {
  const map = new Map<string, number>();
  root.children.forEach((id, index) => {
    const walk = (at: string) => {
      map.set(at, index);
      flat.get(at)?.children.forEach(walk);
    };
    walk(id);
  });
  return map;
}

/** The color scale: a few neutral steps from light to dark, so shade reads as more without adding a hue. */
export function colorScale(nodes: Flat[], colorLabel: string | undefined, colorDomain: [number, number] | undefined) {
  const leaves = nodes.filter((node) => !node.children.length && node.color !== null);
  const [lo, hi] = colorDomain ?? (leaves.length ? [Math.min(...leaves.map((node) => node.color!)), Math.max(...leaves.map((node) => node.color!))] : [0, 1]);
  const colored = colorLabel !== undefined && leaves.length > 0;
  const shade = (value: number | null) => {
    if (!colored || value === null) return 34;
    const t = clamp((value - lo) / (hi - lo || 1), 0, 1);
    return Math.round(14 + (Math.round(t * (STEPS - 1)) / (STEPS - 1)) * 44);
  };
  return { lo, hi, colored, shade };
}

/** The top level tile a node sits in, as seen from the node that fills the view. */
export const topOf = (flat: Map<string, Flat>, center: Flat, node: Flat | null) => {
  let at = node;
  while (at && at.parent && at.parent !== center.id) at = flat.get(at.parent) ?? null;
  return at && at.parent === center.id ? at : null;
};

/** What a key does: arrows hop to the nearest tile in that direction on the top level, Enter zooms in, Escape zooms out. */
export function keyAction(key: string, { flat, center, active, target }: { flat: Map<string, Flat>; center: Flat; active: Flat | null; target: Map<string, Rect> }): { clearPointer?: boolean; active?: string | null; zoom?: string } | null {
  const topTiles = center.children.map((id) => flat.get(id)!).filter((node) => node.value > 0);
  const current = topOf(flat, center, active);
  const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
  if (key in dirs) {
    if (!current) return { clearPointer: true, active: topTiles[0]?.id ?? null };
    const [dx, dy] = dirs[key];
    const o = target.get(current.id)!;
    const ox = o.x + o.w / 2;
    const oy = o.y + o.h / 2;
    let best: Flat | null = null;
    let score = Infinity;
    for (const node of topTiles) {
      if (node.id === current.id) continue;
      const r = target.get(node.id);
      if (!r) continue;
      const vx = r.x + r.w / 2 - ox;
      const vy = r.y + r.h / 2 - oy;
      const along = vx * dx + vy * dy;
      const across = Math.abs(vx * dy - vy * dx);
      if (along <= 1) continue;
      const s = along + across * 1.5;
      if (s < score) {
        score = s;
        best = node;
      }
    }
    return best ? { clearPointer: true, active: best.id } : { clearPointer: true };
  }
  if (key === "Home" || key === "End") return { clearPointer: true, active: (key === "Home" ? topTiles[0] : topTiles[topTiles.length - 1])?.id ?? null };
  if (key === "Enter" || key === " ") return current?.children.length ? { zoom: current.id, active: current.children[0] } : null;
  if (key === "Escape" || key === "Backspace") {
    if (center.parent) return { zoom: center.parent, active: center.id };
    return active ? { active: null } : null;
  }
  return null;
}

export interface TreemapRun {
  nodes: Flat[];
  flat: Map<string, Flat>;
  center: Flat;
  target: Map<string, Rect>;
  view: Rect;
}

/**
 * Every tile keeps its on screen rect; a spring carries it to the new layout. Tiles entering or leaving ride the same zoom as the tile they
 * belong to. The tiles are placed and sized each frame, so text never scales while a tile grows or shrinks.
 */
export function createTreemapMotion(stage: HTMLElement, reduced: boolean) {
  const drawn = new Map<string, Drawn>();
  const levels = new Map<string, number>();
  let last: { id: string; layout: Map<string, Rect> } | null = null;
  let controls: AnimationPlaybackControls | undefined;
  let nodes: Flat[] = [];

  const paint = () => {
    const tiles = new Map([...stage.querySelectorAll<HTMLElement>("[data-tile]")].map((el) => [el.dataset.tile!, el]));
    for (const node of nodes) {
      const el = tiles.get(node.id);
      const d = drawn.get(node.id);
      if (!el) continue;
      if (!d || d.o < 0.01 || d.w < 0.5 || d.h < 0.5) {
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
        continue;
      }
      el.style.visibility = "visible";
      el.style.transform = `translate3d(${d.x.toFixed(2)}px, ${d.y.toFixed(2)}px, 0)`;
      el.style.width = `${d.w.toFixed(2)}px`;
      el.style.height = `${d.h.toFixed(2)}px`;
      el.style.opacity = d.o.toFixed(3);
      el.style.pointerEvents = d.o > 0.6 ? "auto" : "none";
      el.dataset.level = String(levels.get(node.id) ?? 0);
      el.dataset.room = d.w > 64 && d.h > 38 ? (d.h > 54 ? "full" : "name") : "none";
    }
  };

  return {
    /** Repaints after the markup changed (new tiles start hidden until painted). */
    paint(next: Flat[]) {
      nodes = next;
      paint();
    },
    /** Moves the tiles to the layout of `center`. Call it when the layout changed and the chart is on screen. */
    run({ nodes: list, flat, center, target, view }: TreemapRun) {
      nodes = list;
      controls?.stop();
      const prev = last;
      const isUnder = (id: string, ancestor: string) => {
        for (let at: Flat | undefined = flat.get(id); at; at = at.parent ? flat.get(at.parent) : undefined) if (at.id === ancestor) return true;
        return false;
      };
      const visible = (node: Flat) => {
        const l = node.depth - center.depth;
        return l >= 1 && l <= 2 && isUnder(node.id, center.id);
      };
      const nextVisible = new Set(nodes.filter(visible).map((node) => node.id));
      const before = new Map(drawn);
      const wasVisible = new Set([...before].filter(([, d]) => d.o > 0.5).map(([id]) => id));
      // The pivot: the tile that grows to fill the view, or the view that shrinks back into its tile.
      let toOld: ((r: Rect) => Rect) | null = null;
      let toNew: ((r: Rect) => Rect) | null = null;
      if (prev && prev.id !== center.id && before.size) {
        if (isUnder(center.id, prev.id)) {
          const inOld = prev.layout.get(center.id);
          if (inOld) {
            toOld = (r) => carry(r, view, inOld);
            toNew = (r) => carry(r, inOld, view);
          }
        } else if (isUnder(prev.id, center.id)) {
          const inNew = target.get(prev.id);
          if (inNew) {
            toOld = (r) => carry(r, inNew, view);
            toNew = (r) => carry(r, view, inNew);
          }
        }
      }
      const from = new Map<string, Drawn>();
      const to = new Map<string, Drawn>();
      const first = !before.size;
      for (const node of nodes) {
        const goal = target.get(node.id);
        const now = before.get(node.id);
        const inNext = nextVisible.has(node.id);
        const inPrev = wasVisible.has(node.id);
        if (inNext && goal) {
          to.set(node.id, { ...goal, o: 1 });
          if (inPrev && now) from.set(node.id, now);
          else if (first) from.set(node.id, { x: goal.x + goal.w / 2, y: goal.y + goal.h / 2, w: 0, h: 0, o: 0 });
          else from.set(node.id, { ...(toOld ? toOld(goal) : goal), o: 0 });
          levels.set(node.id, node.depth - center.depth);
        } else if (inPrev && now) {
          from.set(node.id, now);
          to.set(node.id, { ...(toNew ? toNew(now) : now), o: 0 });
        }
      }
      for (const node of nodes) if (!from.has(node.id)) drawn.set(node.id, { x: 0, y: 0, w: 0, h: 0, o: 0 });
      last = { id: center.id, layout: target };
      const finish = () => {
        for (const [id, d] of to) drawn.set(id, d);
        paint();
      };
      if (reduced) return finish();
      controls = animate(0, 1, {
        ...(first ? reveal : zoom),
        onUpdate: (t: number) => {
          for (const [id, a] of from) {
            const b = to.get(id)!;
            // On the first reveal, tiles grow in a quick wave from the largest.
            const local = first ? clamp((t - Math.min(0.3, (1 - (b.w * b.h) / (view.w * view.h || 1)) * 0.3)) / 0.7, 0, 1) : t;
            drawn.set(id, { x: mix(a.x, b.x, local), y: mix(a.y, b.y, local), w: mix(a.w, b.w, local), h: mix(a.h, b.h, local), o: mix(a.o, b.o, local) });
          }
          paint();
        },
        onComplete: finish,
      } as never);
    },
    stop() {
      controls?.stop();
    },
  };
}
