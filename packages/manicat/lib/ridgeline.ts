// @manicat-dependencies motion
/**
 * The densities and the motion of the ridgeline, for the Vue and Svelte ports: a smoothed density per series on a shared domain, the
 * ridges that morph into their new shape on a spring, and the geometry that is repainted every frame. The counterparts of the helpers
 * and the effects of ridgeline.tsx; a port renders the markup and hands the plot over.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export interface RidgelineEntry {
  /** Stable identity. A ridge that survives a data change morphs into its new shape. */
  id: string;
  label: string;
  /** Raw observations. The ridge is a smoothed density of these values. */
  values: number[];
}

export type Stats = { q1: number; median: number; q3: number; min: number; max: number; n: number; sorted: number[] };
export type Shape = { xs: number[]; ys: number[]; row: number; q1: number; median: number; q3: number };
export interface RidgelineModel {
  stats: Map<string, Stats>;
  shapes: Map<string, Shape>;
  lo: number;
  hi: number;
}

const { spring } = motionTokens;
const physical = ({ visualDuration, bounce }: { visualDuration: number; bounce: number }, restDelta = 0.0005) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, restDelta, restSpeed: restDelta * 2 };
};
const morph = physical({ visualDuration: 0.7, bounce: 0.08 });
const reveal = physical({ visualDuration: 1, bounce: 0 });
const glide = physical(spring.snappy, 0.01);
/** The spring the tooltip follows the pointer on. */
export const follow = { stiffness: glide.stiffness, damping: glide.damping };
export const SAMPLES = 96;
export const AXIS = 28;
export const TIP = 14;
export const LIFT = 6;
export const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const at = (sorted.length - 1) * q;
  const low = Math.floor(at);
  const high = Math.ceil(at);
  return sorted[low] + (sorted[high] - sorted[low]) * (at - low);
}
function statsOf(values: number[]): Stats {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return { sorted, n: sorted.length, min: sorted[0] ?? 0, max: sorted[sorted.length - 1] ?? 0, q1: quantile(sorted, 0.25), median: quantile(sorted, 0.5), q3: quantile(sorted, 0.75) };
}
function silverman(stats: Stats) {
  if (stats.n < 2) return 1;
  const mean = stats.sorted.reduce((sum, value) => sum + value, 0) / stats.n;
  const sd = Math.sqrt(stats.sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (stats.n - 1));
  const spread = Math.min(sd, (stats.q3 - stats.q1) / 1.34 || sd);
  return Math.max(1e-6, 0.9 * (spread || 1) * Math.pow(stats.n, -0.2));
}
export function niceStep(span: number, count: number) {
  const raw = span / Math.max(1, count) || 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = raw / power;
  return (unit >= 5 ? 5 : unit >= 2 ? 2 : 1) * power;
}
/** Samples a Gaussian kernel density across the domain. */
function density(stats: Stats, lo: number, hi: number, bandwidth: number) {
  const xs: number[] = [];
  const ys: number[] = [];
  const norm = 1 / (Math.max(1, stats.n) * bandwidth * Math.sqrt(2 * Math.PI));
  for (let i = 0; i < SAMPLES; i++) {
    const x = lo + ((hi - lo) * i) / (SAMPLES - 1);
    let sum = 0;
    for (const value of stats.sorted) {
      const u = (x - value) / bandwidth;
      if (u > -5 && u < 5) sum += Math.exp(-0.5 * u * u);
    }
    xs.push(x);
    ys.push(sum * norm);
  }
  return { xs, ys };
}
export const heightAt = (shape: Shape, x: number) => {
  const { xs, ys } = shape;
  if (x <= xs[0] || x >= xs[xs.length - 1]) return 0;
  let i = 1;
  while (i < xs.length - 1 && xs[i] < x) i++;
  const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
  return mix(ys[i - 1], ys[i], t);
};

/** Targets: one density per series on a shared domain, scaled so the tallest peak of all rises `overlap` rows. */
export function buildModel(series: RidgelineEntry[], domain: [number, number] | undefined, bandwidth: number | undefined): RidgelineModel {
  const stats = series.map((entry) => statsOf(entry.values));
  const widths = stats.map((entry) => bandwidth ?? silverman(entry));
  const filled = stats.map((entry, index) => ({ entry, room: 2.5 * widths[index] })).filter(({ entry }) => entry.n);
  let lo = domain?.[0] ?? Math.min(...filled.map(({ entry, room }) => entry.min - room));
  let hi = domain?.[1] ?? Math.max(...filled.map(({ entry, room }) => entry.max + room));
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    lo = 0;
    hi = 1;
  }
  if (!domain) {
    const step = niceStep(hi - lo, 5);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
  }
  const curves = stats.map((entry, index) => (entry.n ? density(entry, lo, hi, widths[index]) : { xs: Array.from({ length: SAMPLES }, (_, i) => lo + ((hi - lo) * i) / (SAMPLES - 1)), ys: new Array(SAMPLES).fill(0) }));
  const peak = Math.max(1e-9, ...curves.flatMap((curve) => curve.ys));
  const shapes = new Map<string, Shape>(series.map((entry, index) => [entry.id, { xs: curves[index].xs, ys: curves[index].ys.map((y) => y / peak), row: index, q1: stats[index].q1, median: stats[index].median, q3: stats[index].q3 }]));
  return { stats: new Map(series.map((entry, index) => [entry.id, stats[index]])), shapes, lo, hi };
}

export interface RidgelineLayout {
  gutter: number;
  plotWidth: number;
  rowHeight: number;
  overlap: number;
  top: number;
  current: string | null;
}

/**
 * Drawn geometry lives outside the framework; a spring interpolates it from what is on screen to the new targets. The ridges, the lifted
 * copy and the axis ticks are found by their data attributes.
 */
export function createRidgelineMotion(plot: HTMLElement, { reduced, layout }: { reduced: boolean; layout: () => RidgelineLayout }) {
  const drawn = { shapes: new Map<string, Shape>(), lo: 0, hi: 1 };
  let controls: AnimationPlaybackControls | undefined;
  const part = (id: string, name: string) => plot.querySelector<SVGElement>(`[data-ridge="${CSS.escape(id)}"] [data-part="${name}"]`);
  const lens = (name: string) => plot.querySelector<SVGElement>(`[data-lens="${name}"]`);
  const xOf = (value: number) => {
    const L = layout();
    return L.gutter + ((value - drawn.lo) / (drawn.hi - drawn.lo || 1)) * L.plotWidth;
  };

  function paint() {
    const d = drawn;
    const L = layout();
    const sx = (value: number) => L.gutter + ((value - d.lo) / (d.hi - d.lo || 1)) * L.plotWidth;
    const lift = L.rowHeight * L.overlap;
    const curvePath = (shape: Shape, closed: boolean, from = -Infinity, to = Infinity) => {
      const base = L.top + (shape.row + 1) * L.rowHeight;
      const points: string[] = [];
      const push = (x: number, y: number) => points.push(`${sx(x).toFixed(2)},${(base - y * lift).toFixed(2)}`);
      if (from > -Infinity) push(from, heightAt(shape, from));
      shape.xs.forEach((x, i) => {
        if (x > from && x < to) push(x, shape.ys[i]);
      });
      if (to < Infinity) push(to, heightAt(shape, to));
      if (!points.length) return "";
      const first = from > -Infinity ? from : shape.xs[0];
      const last = to < Infinity ? to : shape.xs[shape.xs.length - 1];
      return closed ? `M${sx(first).toFixed(2)},${base}L${points.join("L")}L${sx(last).toFixed(2)},${base}Z` : `M${points.join("L")}`;
    };
    const setMedian = (median: SVGElement | null, shape: Shape) => {
      if (!median) return;
      const x = sx(shape.median);
      const base = L.top + (shape.row + 1) * L.rowHeight;
      median.setAttribute("x1", x.toFixed(2));
      median.setAttribute("x2", x.toFixed(2));
      median.setAttribute("y1", String(base));
      median.setAttribute("y2", (base - heightAt(shape, shape.median) * lift).toFixed(2));
    };
    for (const [id, shape] of d.shapes) {
      part(id, "fill")?.setAttribute("d", curvePath(shape, true));
      part(id, "line")?.setAttribute("d", curvePath(shape, false));
      setMedian(part(id, "median"), shape);
    }
    const shape = L.current ? d.shapes.get(L.current) : undefined;
    const [fill, line, band, median] = [lens("fill"), lens("line"), lens("band"), lens("median")];
    if (shape && fill && line && band && median) {
      fill.setAttribute("d", curvePath(shape, true));
      line.setAttribute("d", curvePath(shape, false));
      band.setAttribute("d", curvePath(shape, true, shape.q1, shape.q3));
      setMedian(median, shape);
    }
    plot.querySelectorAll<HTMLElement>("[data-tick]").forEach((tick) => (tick.style.transform = `translate3d(${sx(Number(tick.dataset.tick)).toFixed(2)}px, 0, 0)`));
  }

  return {
    paint,
    xOf,
    shapes: () => drawn.shapes,
    valueAt(x: number) {
      const L = layout();
      return drawn.lo + clamp((x - L.gutter) / L.plotWidth, 0, 1) * (drawn.hi - drawn.lo);
    },
    /** Moves the ridges to the model: they grow in once seen, and morph from what is on screen after that. */
    run(model: RidgelineModel) {
      controls?.stop();
      const d = drawn;
      const first = d.shapes.size === 0;
      const from = new Map<string, Shape>();
      for (const [id, target] of model.shapes) {
        const now = d.shapes.get(id);
        from.set(id, now ? { ...now, xs: [...now.xs], ys: [...now.ys] } : { ...target, ys: target.ys.map(() => 0), q1: target.median, q3: target.median });
      }
      const fromLo = first ? model.lo : d.lo;
      const fromHi = first ? model.hi : d.hi;
      const finish = () => {
        d.shapes = new Map([...model.shapes].map(([id, shape]) => [id, { ...shape }]));
        d.lo = model.lo;
        d.hi = model.hi;
        paint();
      };
      if (reduced) return finish();
      d.shapes = new Map([...from].map(([id, shape]) => [id, { ...shape, xs: [...shape.xs], ys: [...shape.ys] }]));
      controls = animate(0, 1, {
        ...(first ? reveal : morph),
        onUpdate: (t: number) => {
          d.lo = mix(fromLo, model.lo, t);
          d.hi = mix(fromHi, model.hi, t);
          for (const [id, to] of model.shapes) {
            const f = from.get(id)!;
            const out = d.shapes.get(id)!;
            // Stagger the reveal a little from the top row down, so the ridges roll in like a wave.
            const local = first ? clamp((t - to.row * 0.025) / (1 - Math.min(0.5, model.shapes.size * 0.025)), 0, 1) : t;
            for (let i = 0; i < SAMPLES; i++) {
              out.xs[i] = mix(f.xs[i], to.xs[i], local);
              out.ys[i] = mix(f.ys[i], to.ys[i], local);
            }
            out.row = mix(f.row, to.row, local);
            out.q1 = mix(f.q1, to.q1, local);
            out.median = mix(f.median, to.median, local);
            out.q3 = mix(f.q3, to.q3, local);
          }
          paint();
        },
        onComplete: finish,
      } as never);
    },
    stop: () => controls?.stop(),
  };
}
