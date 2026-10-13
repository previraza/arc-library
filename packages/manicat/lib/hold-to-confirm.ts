// @manicat-dependencies motion
/**
 * What the hold-to-confirm button needs besides its markup, for the Vue and Svelte ports: the label frames that spring to the width
 * of new text, and the fill that tracks the hold and rewinds on a spring. The counterparts of `useLabelWidth` and the motion values in
 * hold-to-confirm.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/** Springs the label frames to the width of new text, so the button morphs instead of snapping. A late web font or a reflow follows instantly. */
export function createLabelWidth(measure: HTMLElement, frames: () => HTMLElement[], reduced: boolean) {
  const width = motionValue<number | "auto">("auto");
  width.on("change", (value) => frames().forEach((frame) => (frame.style.width = typeof value === "number" ? `${value}px` : value)));
  let lastText: string | null = null;
  let sizing: AnimationPlaybackControls | null = null;
  const observer = new ResizeObserver(([entry]) => {
    // Layout width, not the painted box: the done label is measured while the pressed button is still scaled down.
    const next = entry?.borderBoxSize?.[0]?.inlineSize ?? measure.offsetWidth;
    const text = measure.textContent;
    const morph = lastText !== null && lastText !== text && !reduced && typeof width.get() === "number";
    lastText = text;
    sizing?.stop();
    if (morph) sizing = animate(width as never, next, motionTokens.spring.morph as never);
    else width.jump(next);
  });
  observer.observe(measure);
  return {
    /** Applies the current width to frames that were just rendered. */
    apply() {
      const value = width.get();
      frames().forEach((frame) => (frame.style.width = typeof value === "number" ? `${value}px` : value));
    },
    destroy() {
      observer.disconnect();
      sizing?.stop();
    },
  };
}

/** The fill that tracks the hold on a linear timeline, rewinds on a spring, and presses the button in. */
export function createHold(button: HTMLElement, fill: HTMLElement, { duration, reduced, onComplete }: { duration: number; reduced: boolean; onComplete: () => void }) {
  const progress = motionValue(0);
  const scale = motionValue(1);
  progress.on("change", (value) => (fill.style.clipPath = `inset(0 ${((1 - Math.min(1, Math.max(0, value))) * 100).toFixed(3)}% 0 0)`));
  scale.on("change", (value) => (button.style.scale = String(value)));
  fill.style.clipPath = "inset(0 100% 0 0)";
  let fillRun: AnimationPlaybackControls | null = null;
  let pressRun: AnimationPlaybackControls | null = null;
  return {
    progress,
    press(pressed: boolean) {
      pressRun?.stop();
      if (reduced) return void scale.jump(1);
      const depth = button.offsetWidth > 220 ? 0.985 : 0.97;
      pressRun = animate(scale as never, pressed ? depth : 1, motionTokens.spring.snappy as never);
    },
    /** Starts or resumes the fill from wherever it is, so a quick re-press after letting go carries on instead of starting over. */
    start(total: number) {
      fillRun?.stop();
      fillRun = animate(progress as never, 1, { duration: ((1 - progress.get()) * total) / 1000, ease: "linear", onComplete } as never);
    },
    rewind() {
      fillRun?.stop();
      if (reduced) progress.jump(0);
      else fillRun = animate(progress as never, 0, { ...(motionTokens.spring.smooth as object), velocity: 0 } as never);
    },
    fillTo(value: number) {
      fillRun?.stop();
      if (reduced) progress.jump(value);
      else fillRun = animate(progress as never, value, motionTokens.spring.smooth as never);
    },
    destroy() {
      fillRun?.stop();
      pressRun?.stop();
    },
  };
}
