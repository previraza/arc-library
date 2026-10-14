// @manicat-dependencies motion
/**
 * The geometry and the motion of the expanding button group, for the Vue and Svelte ports: each button's width rides the morph spring
 * to the measured width of its label, the label slides out from behind the icon, and the icon and the word swap in place. The
 * counterparts of `Item` and the poses in expanding-button-group.tsx.
 */
import { animate, motionValue } from "motion";
import type { Pose, Timing } from "./motion-dom";
import { motionTokens } from "./motion-tokens";

export type ExpandingButtonGroupSize = "sm" | "md";

/** Geometry per size. The icon keeps the same left inset collapsed and expanded, so it never moves while the label is revealed. */
export const metrics = {
  sm: { height: 28, icon: 14, start: 7, gap: 5, end: 11 },
  md: { height: 36, icon: 16, start: 10, gap: 7, end: 14 },
} as const;

/** Pixels the pointer must travel into a neighbouring action before the expansion moves to it. */
export const hysteresis = 4;

const { duration, blur } = motionTokens;
const enter = [...motionTokens.ease.enter] as [number, number, number, number];
const standard = [...motionTokens.ease.standard] as [number, number, number, number];

/** The label slides out from behind the icon as the width opens, and tucks back a little faster than it came. */
export function animateLabel(label: HTMLElement, shown: boolean, { reduced, animated }: { reduced: boolean; animated: boolean }) {
  const target = { opacity: shown ? 1 : 0, x: shown && !reduced ? 0 : reduced ? 0 : -6, filter: `blur(${shown || reduced ? 0 : blur.subtle}px)` };
  const timing = reduced ? { duration: duration.instant } : shown ? { duration: duration.standard, ease: enter, delay: 0.04 } : { duration: duration.instant, ease: standard };
  animate(label, target as never, animated ? (timing as never) : { duration: 0 });
}

/** The poses of the swaps: the word rises in from below and lifts away; the icon scales and blurs in on a spring. */
export function swapPoses(node: HTMLElement, kind: "word" | "icon", reduced: boolean): { from: Pose; rest: Pose; out: Pose; enterTiming: Timing; leaveTiming: Timing } {
  const em = parseFloat(getComputedStyle(node).fontSize) || 16;
  const rest: Pose = { opacity: 1, y: 0, scale: 1, blur: 0 };
  if (reduced) return { from: { ...rest, opacity: 0 }, rest, out: { opacity: 0 }, enterTiming: { duration: duration.instant }, leaveTiming: { duration: duration.instant } };
  if (kind === "word") return { from: { opacity: 0, y: 0.5 * em, blur: blur.soft }, rest, out: { opacity: 0, y: -0.4 * em, blur: blur.subtle }, enterTiming: { duration: duration.standard, ease: "enter" }, leaveTiming: { duration: duration.fast, ease: "standard" } };
  return { from: { opacity: 0, scale: 0.55, blur: blur.subtle }, rest, out: { opacity: 0, scale: 0.55, blur: blur.subtle }, enterTiming: { spring: "snappy", fade: duration.fast }, leaveTiming: { duration: duration.fast, ease: "standard" } };
}

/**
 * Keeps one button as wide as its state asks. Hidden copies of both words share the label's grid cell, so the slot is always as wide
 * as the longer one and the confirmation swap never changes the width. The first measured width (and every width under reduced motion)
 * is placed at once; later ones ride the morph spring, so neighbours slide and the group's own width follows without a jump.
 */
export function createExpandingItem(button: HTMLElement, { size, expanded, sizers, reduced }: { size: () => ExpandingButtonGroupSize; expanded: () => boolean; sizers: () => (HTMLElement | null)[]; reduced: boolean }) {
  const width = motionValue<number>(metrics[size()].height);
  const paint = (value: number) => (button.style.width = `${value}px`);
  paint(width.get());
  const stop = width.on("change", paint);
  let text = 0;
  let settled = false;
  let last = { target: NaN, measured: false };
  button.dataset.unmeasured = "";

  const sync = () => {
    const m = metrics[size()];
    const measured = text > 0;
    if (measured) delete button.dataset.unmeasured;
    else button.dataset.unmeasured = "";
    const target = expanded() && measured ? m.start + m.icon + m.gap + text + m.end : m.height;
    if (target === last.target && measured === last.measured) return;
    last = { target, measured };
    if (!settled || reduced) {
      width.jump(target);
      if (measured) settled = true;
      return;
    }
    animate(width, target, motionTokens.spring.morph as never);
  };

  // Changes under half a pixel are ignored, so a re-measure never makes the row wobble.
  const measure = () => {
    const next = Math.max(0, ...sizers().map((node) => node?.getBoundingClientRect().width ?? 0));
    if (Math.abs(text - next) >= 0.5) text = next;
    sync();
  };
  const observer = new ResizeObserver(measure);
  const watched = new Set<HTMLElement>();
  const observeSizers = () => {
    for (const node of sizers()) if (node && !watched.has(node)) { watched.add(node); observer.observe(node); }
    for (const node of watched) if (!sizers().includes(node)) { watched.delete(node); observer.unobserve(node); }
  };
  observeSizers();
  measure();
  return {
    /** Call when the label, the size or whether the button is expanded changed. */
    sync() {
      observeSizers();
      measure();
    },
    destroy() {
      observer.disconnect();
      stop();
    },
  };
}
