/**
 * Geometry shared by the chart ports (React Native with react-native-svg, Vue with inline SVG). Pure functions: they turn data
 * into scales, ticks and SVG path strings, and leave drawing to each framework.
 */

export type Point = [number, number];

export interface Scale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
}

export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = ((value: number) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0))) as Scale;
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/** A tidy upper bound for a data maximum: 1, 2, 2.5, 5 or 10 times a power of ten. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(max)));
  const fraction = max / power;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return step * power;
}

/** `count` evenly spaced tick values from 0 to a nice maximum. */
export function ticks(max: number, count = 4): number[] {
  const top = niceMax(max);
  return Array.from({ length: count + 1 }, (_, index) => (top / count) * index);
}

export const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** A straight polyline, or a smooth curve through the points (monotone-ish Catmull-Rom converted to cubic Béziers). */
export function linePath(points: Point[], curve: "smooth" | "linear" = "smooth"): string {
  if (points.length === 0) return "";
  if (points.length === 1 || curve === "linear") return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/** The area between a line and the baseline `y0`. */
export function areaPath(points: Point[], y0: number, curve: "smooth" | "linear" = "smooth"): string {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  return `${linePath(points, curve)}L${last[0].toFixed(2)},${y0.toFixed(2)}L${points[0][0].toFixed(2)},${y0.toFixed(2)}Z`;
}

/** A band between an upper and a lower line, for stacked areas. */
export function bandPath(upper: Point[], lower: Point[], curve: "smooth" | "linear" = "smooth"): string {
  if (upper.length === 0) return "";
  const back = [...lower].reverse();
  return `${linePath(upper, curve)}L${back[0][0].toFixed(2)},${back[0][1].toFixed(2)}${linePath(back, curve).replace(/^M[^CL]*/, "")}Z`;
}

/** A ring segment from `a0` to `a1` radians (0 is 12 o'clock, clockwise). */
export function arcPath(cx: number, cy: number, outer: number, inner: number, a0: number, a1: number): string {
  const sweep = Math.min(a1 - a0, Math.PI * 2 - 0.0001);
  const end = a0 + sweep;
  const point = (r: number, a: number): Point => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = point(outer, a0);
  const [x1, y1] = point(outer, end);
  const [x2, y2] = point(inner, end);
  const [x3, y3] = point(inner, a0);
  const large = sweep > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${outer},${outer} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}A${inner},${inner} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)}Z`;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Squarified treemap: lays `values` out in `rect`, keeping cells close to square. Returns one rect per value, in input order. */
export function squarify(values: number[], rect: Rect): Rect[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  const out: Rect[] = new Array(values.length);
  if (total <= 0) return values.map(() => ({ ...rect, width: 0, height: 0 }));
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
  let free = { ...rect };
  let remaining = total;
  let row: typeof order = [];

  const worst = (items: typeof order, side: number, scale: number) => {
    const sum = items.reduce((s, item) => s + item.value * scale, 0);
    const max = Math.max(...items.map((item) => item.value * scale));
    const min = Math.min(...items.map((item) => item.value * scale));
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };

  const place = (items: typeof order, scale: number) => {
    const sum = items.reduce((s, item) => s + item.value * scale, 0);
    const horizontal = free.width >= free.height;
    const thickness = sum / (horizontal ? free.height : free.width);
    let offset = 0;
    for (const item of items) {
      const length = (item.value * scale) / thickness;
      out[item.index] = horizontal ? { x: free.x, y: free.y + offset, width: thickness, height: length } : { x: free.x + offset, y: free.y, width: length, height: thickness };
      offset += length;
    }
    free = horizontal ? { x: free.x + thickness, y: free.y, width: free.width - thickness, height: free.height } : { x: free.x, y: free.y + thickness, width: free.width, height: free.height - thickness };
    remaining -= items.reduce((s, item) => s + item.value, 0);
  };

  for (const item of order) {
    const scale = (free.width * free.height) / remaining;
    const side = Math.min(free.width, free.height);
    if (row.length === 0 || worst([...row, item], side, scale) <= worst(row, side, scale)) row.push(item);
    else {
      place(row, scale);
      row = [item];
    }
  }
  if (row.length) place(row, (free.width * free.height) / remaining);
  return out;
}
