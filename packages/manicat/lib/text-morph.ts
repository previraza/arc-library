// @manicat-dependencies motion
/**
 * The frame of the text morph, for the Vue and Svelte ports: it holds an explicit width so a new label never snaps it, and a spring
 * follows the track, which already has the new letters in place. The counterpart of the width effects in text-morph.tsx.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/** Lets leaving letters start to clear before the first new letter sharpens in their place. */
export const HANDOFF = 0.05;
/** Letters match by character and occurrence, so the second "i" in one string pairs with the second "i" in the next. */
export function toGlyphs(text: string) {
  const seen = new Map<string, number>();
  return Array.from(text).map((char) => {
    const count = seen.get(char) ?? 0;
    seen.set(char, count + 1);
    return { char, key: `${char}-${count}` };
  });
}

const measure = (element: HTMLElement) => parseFloat(getComputedStyle(element).width);

export function createMorphFrame(frame: HTMLElement, track: HTMLElement, reduced: boolean) {
  let width = 0;
  let sizing: AnimationPlaybackControls | null = null;
  // Font loading or a responsive font size changes the width without a new label: follow it immediately.
  const observer = new ResizeObserver(() => {
    const next = measure(track);
    if (!Number.isFinite(next) || Math.abs(next - width) < 0.5) return;
    sizing?.stop();
    frame.style.width = `${next}px`;
    width = next;
  });
  observer.observe(track);
  return {
    /** Call after the label changed and the DOM has the new letters. */
    update() {
      const next = measure(track);
      if (!Number.isFinite(next)) return;
      if (width && Math.abs(next - width) > 0.5 && !reduced) sizing = animate(frame, { width: next }, motionTokens.spring.morph as never);
      else {
        sizing?.stop();
        frame.style.width = `${next}px`;
      }
      width = next;
    },
    destroy() {
      observer.disconnect();
      sizing?.stop();
    },
  };
}
