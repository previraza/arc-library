// @manicat-dependencies motion
/**
 * The sizing and the motion of the inline edit, for the Vue and Svelte ports: the frame follows the text as you type on a spring, the box
 * grows in height for several lines, a message row opens its height, and changed text rises from a soft blur. The counterparts of
 * `onContentChange`, `Reveal` and the poses in inline-edit.tsx.
 */
import { animate, motionValue } from "motion";
import type { Pose, Timing } from "./motion-dom";
import { motionTokens } from "./motion-tokens";

const { duration, blur } = motionTokens;
/** Typing retargets many times a second, so the frame follows on a quicker spring without overshoot and keeps up with a fast typist. */
const typingSpring = { ...motionTokens.spring.snappy, visualDuration: duration.fast, bounce: 0 };

export type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

export interface InlineSizingParts {
  display: HTMLElement;
  box: HTMLElement;
  frame: HTMLElement;
  /** The input or textarea while editing, or null. */
  control: () => HTMLInputElement | HTMLTextAreaElement | null;
}

/**
 * Single line: the layout box and the input take a new width at once, so the input never scrolls, while the visible frame springs after it.
 * Multiline: the box's height springs, so content below glides, while the textarea already has the room its text needs.
 * Both start at their natural size ("100%", "auto").
 */
export function createInlineSizing({ display, box, frame, control }: InlineSizingParts, { multiline, editing, reduced }: { multiline: () => boolean; editing: () => boolean; reduced: boolean }) {
  const frameWidth = motionValue<number | string>("100%");
  const boxHeight = motionValue<number | string>("auto");
  const paint = (value: number | string) => (typeof value === "number" ? `${value}px` : value);
  const stops = [
    frameWidth.on("change", (value) => {
      if (!multiline()) frame.style.width = paint(value);
    }),
    boxHeight.on("change", (value) => {
      if (multiline()) box.style.height = paint(value);
    }),
  ];
  let size = 0;
  let wasEditing = false;

  const naturalSize = () => parseFloat(getComputedStyle(display)[multiline() ? "height" : "width"]);
  /** Written straight to the DOM before paint, because a motion value only reaches the style on its next frame, and one frame at the wrong size shows. */
  const snap = (next: number) => {
    const field = control();
    if (multiline() && field) {
      field.style.height = `${next}px`;
      field.scrollTop = 0;
    }
    (multiline() ? box : frame).style[multiline() ? "height" : "width"] = `${next}px`;
    (multiline() ? boxHeight : frameWidth).jump(next);
  };

  // A late web font or a resized container follows at once instead of animating.
  const onResize = () => {
    const next = naturalSize();
    if (!next || Math.abs(next - size) < 0.1) return;
    size = next;
    snap(next);
  };
  // Border box, so the room added while editing (padding, not content) is noticed too.
  const observer = new ResizeObserver(onResize);
  observer.observe(display, { box: "border-box" });
  if (multiline()) box.style.height = "auto";
  else frame.style.width = "100%";

  return {
    /** Changes the person caused (typing, switching modes, a rollback) spring from the size on screen. Call it after the DOM changed and before paint. */
    change() {
      const next = naturalSize();
      const previous = size;
      const typing = editing() && wasEditing;
      size = next;
      wasEditing = editing();
      if (!next) return;
      const field = control();
      if (multiline() && field) {
        field.style.height = `${next}px`;
        field.scrollTop = 0;
      }
      const target = multiline() ? boxHeight : frameWidth;
      if (!previous || reduced || typeof target.get() !== "number") return snap(next);
      if (Math.abs(next - previous) < 0.1) return;
      animate(target, next, (multiline() ? motionTokens.spring.smooth : typing ? typingSpring : motionTokens.spring.morph) as never);
    },
    /** The mode changed between single line and several: reset what the other mode drove. */
    reset() {
      size = 0;
      frameWidth.jump("100%");
      boxHeight.jump("auto");
      frame.style.width = multiline() ? "" : "100%";
      box.style.height = multiline() ? "auto" : "";
    },
    destroy() {
      observer.disconnect();
      stops.forEach((stop) => stop());
    },
  };
}

/** A message row that opens and closes its height on a spring while the words rise in, so an error never pushes the page in one frame. */
export function createReveal(host: HTMLElement, inner: HTMLElement, reduced: boolean) {
  const height = motionValue(0);
  const stop = height.on("change", (value) => (host.style.height = `${value}px`));
  host.style.height = "0px";
  let measured = false;
  const observer = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.blockSize ?? inner.offsetHeight;
    if (!measured || reduced) {
      measured = true;
      height.jump(next);
      return;
    }
    animate(height, next, motionTokens.spring.smooth as never);
  });
  observer.observe(inner, { box: "border-box" });
  return () => {
    observer.disconnect();
    height.stop();
    stop();
  };
}

/** Text rises in from a soft blur. A rollback runs the other way, dropping the old words down and the saved ones in from above. */
export function textPoses(node: HTMLElement, direction: number, reduced: boolean): { from: Pose; rest: Pose; out: Pose; enterTiming: Timing; leaveTiming: Timing } {
  const em = parseFloat(getComputedStyle(node).fontSize) || 16;
  const rest: Pose = { opacity: 1, y: 0, blur: 0 };
  if (reduced) return { from: { opacity: 0 }, rest: { opacity: 1 }, out: { opacity: 0 }, enterTiming: { duration: duration.fast }, leaveTiming: { duration: duration.instant } };
  return {
    from: { opacity: 0, y: direction * 0.3 * em, blur: blur.soft },
    rest,
    out: { opacity: 0, y: direction * -0.3 * em, blur: blur.subtle },
    enterTiming: { duration: duration.standard, ease: "enter" },
    leaveTiming: { duration: duration.fast, ease: "standard" },
  };
}

/** The icon in the slot scales and blurs in on a spring and leaves a little faster. */
export function slotPoses(reduced: boolean): { from: Pose; rest: Pose; enterTiming: Timing; leaveTiming: Timing } {
  const rest: Pose = { opacity: 1, scale: 1, blur: 0 };
  if (reduced) return { from: { opacity: 0 }, rest: { opacity: 1 }, enterTiming: { duration: duration.fast }, leaveTiming: { duration: duration.instant } };
  return { from: { opacity: 0, scale: 0.6, blur: blur.subtle }, rest, enterTiming: { spring: "snappy", fade: duration.fast }, leaveTiming: { duration: duration.fast, ease: "standard" } };
}

/** The tick draws itself from its short stroke, the way a hand would write it. */
export function drawTick(path: Element, reduced: boolean) {
  if (reduced) return;
  animate(path, { pathLength: [0, 1], opacity: [0, 1] }, { pathLength: { duration: 0.32, ease: [...motionTokens.ease.enter], delay: 0.06 }, opacity: { duration: 0.05, delay: 0.06 } } as never);
}
