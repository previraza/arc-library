// @manicat-dependencies motion
/**
 * The drawing of the sparkline, for the Vue and Svelte ports: the smooth monotone curve, the line that draws itself once it is seen,
 * the cursor that rides it, and the text that rolls. The counterparts of the geometry and the motion values in sparkline.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export type Point = [number, number];

/** Space kept above the highest and below the lowest point, and half the line width. */
const inset = 5;
const cap = 1.25;
const grid = Array.from({ length: 161 }, (_, index) => index / 160);
/** The first draw: one smooth stroke, slow at both ends like a pen. */
const draw = { duration: motionTokens.duration.considered * 1.75, ease: [...motionTokens.ease.inOut] } as const;
const quick = { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.standard] } as const;

export const amountIn = (text: string) => Number(text.replace(/,/g, "").replace(/−/g, "-").match(/-?\d+(?:\.\d+)?/)?.[0] ?? NaN);
export const grouped = new Intl.NumberFormat("en-US");

export type Chunk = { slot: string; key: string; text: string };
/** A number keeps its unchanged digits still, keyed by place from the right. Words key on everything up to them, so only the first changed word and what follows it roll. */
export function chunksOf(text: string, whole: boolean): Chunk[] {
  if (!text) return [];
  if (whole) return [{ slot: "all", key: text, text }];
  if (!/\p{L}/u.test(text)) return [...text].map((char, index, all) => ({ slot: `n${all.length - index}`, key: char, text: char }));
  const words = text.split(/(?<=\s)/);
  return words.map((word, index) => ({ slot: `w${index}`, key: words.slice(0, index + 1).join(""), text: word }));
}

/** A smooth line through every point, sampled densely in unit space (x and y both 0 to 1, y up). Monotone cubic tangents keep it from swinging past the data. */
export function curveFor(data: number[]): Point[] {
  const min = Math.min(...data);
  const span = Math.max(...data) - min;
  const ys = data.map((value) => (span ? (value - min) / span : 0.5));
  const last = ys.length - 1;
  const step = 1 / last;
  const slopes = ys.slice(1).map((y, index) => (y - ys[index]) / step);
  const tangents = ys.map((_, index) => (index === 0 || index === last ? slopes[0] : (Math.sign(slopes[index - 1]) + Math.sign(slopes[index])) * Math.min(Math.abs(slopes[index - 1]), Math.abs(slopes[index]), Math.abs(slopes[index - 1] + slopes[index]) / 4) || 0));
  if (last > 1) {
    tangents[0] = (3 * slopes[0] - tangents[1]) / 2;
    tangents[last] = (3 * slopes[last - 1] - tangents[last - 1]) / 2;
  }
  const samples = Math.max(1, Math.min(16, Math.round(128 / last)));
  const points: Point[] = [];
  for (let index = 0; index < last; index++) {
    for (let sample = 0; sample < samples; sample++) {
      const t = sample / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const y = (2 * t3 - 3 * t2 + 1) * ys[index] + (t3 - 2 * t2 + t) * step * tangents[index] + (3 * t2 - 2 * t3) * ys[index + 1] + (t3 - t2) * step * tangents[index + 1];
      points.push([(index + t) * step, Math.min(1, Math.max(0, y))]);
    }
  }
  points.push([1, ys[last]]);
  return points;
}

/** Height of the sampled line at x, straight between samples. */
function heightAt(shape: Point[], x: number) {
  let low = 0;
  let high = shape.length - 1;
  if (x <= shape[low][0]) return shape[low][1];
  if (x >= shape[high][0]) return shape[high][1];
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (shape[middle][0] < x) low = middle;
    else high = middle;
  }
  const [x0, y0] = shape[low];
  const [x1, y1] = shape[high];
  return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/** Every drawn string for one frame, in the chart's own pixels so strokes and dots stay round at any width. */
function geometryOf(shape: Point[], w: number, h: number, at: number) {
  const toY = (y: number) => inset + (1 - y) * (h - inset * 2);
  const points = shape.map(([x, y]): Point => [x * w, toY(y)]);
  const pairs = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`);
  const cx = at * w;
  const cy = toY(heightAt(shape, at));
  return { points, line: pairs.join(" "), trail: `M${pairs.join("L")}`, fill: `M${pairs.join("L")}L${w},${h}L0,${h}Z`, dot: `${cx},${cy} ${cx},${cy}`, cx };
}

/** Where the pen is along the line once `progress` of its length is drawn, so the fill follows the tip. */
function tipAt(points: Point[], progress: number) {
  const steps = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
  let left = progress * steps.reduce((sum, step) => sum + step, 0);
  for (let index = 0; index < steps.length; index++) {
    if (left <= steps[index]) return points[index][0] + (points[index + 1][0] - points[index][0]) * (steps[index] ? left / steps[index] : 1);
    left -= steps[index];
  }
  return points[points.length - 1][0];
}

export interface SparklineParts {
  figure: HTMLElement;
  plot: HTMLElement;
  svg: SVGSVGElement;
  lit: SVGRectElement;
  dim: SVGRectElement;
  reveal: SVGRectElement;
  area?: SVGPathElement | null;
  baseline: SVGLineElement;
  trail: SVGPathElement;
  line: SVGPolylineElement;
  cursor: SVGLineElement;
  end: SVGPolylineElement;
}

export function createSparkline(parts: SparklineParts, { data, width, height, reduced }: { data: number[]; width: number; height: number; reduced: boolean }) {
  const { plot, svg, lit, dim, reveal, area, baseline, trail, line, cursor: cursorLine, end } = parts;
  let target = curveFor(data);
  let shape = target;
  let box = { w: width, h: height };
  let landed = false;
  let scrubbing = false;
  let morph: AnimationPlaybackControls | undefined;
  let drawRun: AnimationPlaybackControls | undefined;
  let cursorRun: AnimationPlaybackControls | undefined;
  const drawn = motionValue(0);
  const cursor = motionValue(1);

  line.setAttribute("pathLength", "1");
  const paint = () => {
    const progress = drawn.get();
    const next = geometryOf(shape, box.w, box.h, cursor.get());
    line.setAttribute("points", next.line);
    trail.setAttribute("d", next.trail);
    area?.setAttribute("d", next.fill);
    end.setAttribute("points", next.dot);
    cursorLine.setAttribute("x1", String(next.cx));
    cursorLine.setAttribute("x2", String(next.cx));
    lit.setAttribute("width", String(next.cx + cap + 16));
    dim.setAttribute("x", String(next.cx + cap));
    reveal.setAttribute("width", String(progress >= 1 ? box.w + 32 : tipAt(next.points, progress) + 16));
    line.style.strokeDasharray = `${progress} 1`;
    line.style.opacity = progress > 0.001 ? "1" : "0";
  };
  const place = () => {
    svg.setAttribute("viewBox", `0 0 ${box.w} ${box.h}`);
    for (const rect of [lit, dim, reveal]) rect.setAttribute("height", String(box.h + 32));
    dim.setAttribute("width", String(box.w + 32));
    baseline.setAttribute("x2", String(box.w));
    baseline.setAttribute("y1", String(box.h - 0.5));
    baseline.setAttribute("y2", String(box.h - 0.5));
    cursorLine.setAttribute("y2", String(box.h));
    paint();
  };
  const show = () => {
    // Visible state of the parts that react to scrubbing.
    if (reduced) {
      trail.style.opacity = scrubbing && landed ? "1" : "0";
      cursorLine.style.opacity = scrubbing ? "1" : "0";
      end.style.opacity = landed ? "1" : "0";
      end.style.strokeWidth = String(landed ? (scrubbing ? 10 : 7) : 0);
      return;
    }
    animate(trail, { opacity: scrubbing && landed ? 1 : 0 }, quick as never);
    animate(cursorLine, { opacity: scrubbing ? 1 : 0 }, quick as never);
    animate(end, { opacity: landed ? 1 : 0, strokeWidth: landed ? (scrubbing ? 10 : 7) : 0 } as never, { opacity: quick, strokeWidth: motionTokens.spring.snappy } as never);
  };
  trail.style.opacity = "0";
  cursorLine.style.opacity = "0";
  end.style.opacity = "0";
  end.style.strokeWidth = "0";
  drawn.on("change", paint);
  cursor.on("change", paint);

  // The chart draws in its own pixels: measure the width, keep the height in proportion.
  const observer = new ResizeObserver(() => {
    const w = plot.clientWidth;
    if (w && Math.abs(box.w - w) >= 0.5) {
      box = { w, h: (w * height) / width };
      place();
    }
  });
  observer.observe(plot);
  place();

  // The line draws left to right once it is seen, the fill follows the pen, then the end dot lands.
  const land = () => {
    landed = true;
    show();
  };
  let seen: IntersectionObserver | undefined;
  if (reduced) {
    drawn.jump(1);
    requestAnimationFrame(land);
  } else {
    seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen?.disconnect();
        drawRun = animate(drawn as never, 1, { ...draw, onComplete: land } as never);
      },
      { threshold: 0.5 },
    );
    seen.observe(parts.figure);
  }

  return {
    /** New data morphs the line from the shape on screen, sampled on shared x positions so a series that gains or loses points still flows. */
    setData(next: number[]) {
      target = curveFor(next);
      const from = shape;
      if (reduced) {
        shape = target;
        return paint();
      }
      morph?.stop();
      const xs = [...new Set([...grid, ...target.map(([x]) => x)])].sort((a, b) => a - b);
      const start = xs.map((x) => heightAt(from, x));
      const goal = xs.map((x) => heightAt(target, x));
      const goTo = target;
      morph = animate(0, 1, {
        ...(motionTokens.spring.smooth as object),
        onUpdate: (progress: number) => {
          shape = xs.map((x, at): Point => [x, start[at] + (goal[at] - start[at]) * progress]);
          paint();
        },
        onComplete: () => {
          shape = goTo;
          paint();
        },
      } as never);
    },
    /** The cursor springs to the scrubbed point and rides the line between points; leaving sends it home to the latest value. */
    setIndex(index: number | null, last: number) {
      scrubbing = index !== null;
      const to = index === null ? 1 : index / last;
      cursorRun?.stop();
      if (reduced) cursor.jump(to);
      else cursorRun = animate(cursor as never, to, motionTokens.spring.snappy as never);
      show();
    },
    destroy() {
      observer.disconnect();
      seen?.disconnect();
      morph?.stop();
      drawRun?.stop();
      cursorRun?.stop();
    },
  };
}
