// @manicat-dependencies motion
/**
 * What the stepper needs besides its markup, for the Vue and Svelte ports: a text slot whose height springs to the new copy,
 * the strokes of the check and alert glyphs that draw themselves, and the connector fills. The counterparts of `SwapText`, `Glyph` and
 * the connector motion in stepper.tsx.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/**
 * Text that rises in with a small blur when it changes. Its slot springs to the new height, so a message that wraps eases the steps
 * below it down instead of pushing them; unrelated resizes (fonts, container width) follow exactly. Call `arm()` when the text changes.
 */
export function followTextHeight(slot: HTMLElement, inner: HTMLElement, reduced: boolean) {
  let armedUntil = 0;
  let measured = false;
  let run: AnimationPlaybackControls | undefined;
  const observer = new ResizeObserver(() => {
    const next = inner.offsetHeight;
    run?.stop();
    if (!measured || reduced || performance.now() > armedUntil) {
      measured = true;
      slot.style.height = `${next}px`;
      return;
    }
    const from = slot.offsetHeight;
    run = animate(from, next, { ...(motionTokens.spring.smooth as object), onUpdate: (value: number) => { slot.style.height = `${value}px`; } } as never);
  });
  observer.observe(inner);
  return {
    arm() {
      armedUntil = performance.now() + 700;
    },
    destroy() {
      observer.disconnect();
      run?.stop();
    },
  };
}

/** Draws the stroke of a check or alert glyph, and pops the dot of the alert after it. */
export function drawGlyph(svg: Element, delay: number, reduced: boolean) {
  if (reduced) return;
  const ease = [...motionTokens.ease.enter] as [number, number, number, number];
  for (const path of svg.querySelectorAll("path")) animate(path, { pathLength: [0, 1] }, { duration: motionTokens.duration.standard, ease, delay: delay + 0.04 });
  for (const dot of svg.querySelectorAll("circle")) animate(dot, { scale: [0, 1] } as never, { ...(motionTokens.spring.snappy as object), delay: delay + 0.16 } as never);
}

/** A connector fill scales along its track on a spring, from the step that was just finished. */
export function moveFill(fill: HTMLElement, { vertical, on, delay, reduced, instant }: { vertical: boolean; on: boolean; delay: number; reduced: boolean; instant: boolean }) {
  fill.style.transformOrigin = vertical ? "center top" : "";
  const scale = on ? 1 : 0;
  if (instant) {
    fill.style.transform = vertical ? `scaleY(${scale})` : `scaleX(${scale})`;
    return;
  }
  animate(fill, (vertical ? { scaleY: scale } : { scaleX: scale }) as never, (reduced ? { duration: 0 } : { ...(motionTokens.spring.smooth as object), delay }) as never);
}
