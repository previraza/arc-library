// @manicat-dependencies motion
/**
 * What the chip group needs besides its markup, for the Vue and Svelte ports: the chip whose edge trails its layout width on a
 * spring while a check grows in, and the frame that follows the chips' height. The counterparts of `useWidthLag`, the check motion
 * values and `HeightFrame` in chip-group.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/** The width the check takes from the label: a 14px glyph and the space after it. */
export const SLOT = 18;

/** Roving-focus key of the overflow chip; the NUL keeps it from colliding with any option value. */
export const MORE = "\u0000more";

export interface ChipParts {
  body: HTMLElement;
  surface: HTMLElement;
  /** The label that slides over as the edge trails. The overflow chip has none: its text centres itself. */
  label?: HTMLElement;
  check?: HTMLElement;
  path?: SVGPathElement | null;
}

/**
 * A chip's layout width changes in one frame (so the row can re-flow once and neighbours can glide), but what you see must not.
 * `lag` is how far the visible edge trails the layout edge: it jumps by the change, then springs back to zero.
 * Passive resizes, like a late web font, only re-baseline it.
 */
export function createChipBody(parts: ChipParts, { selected, reduced, onLag }: { selected: boolean; reduced: boolean; /** Called on every frame with how far the edge trails. */ onLag?: (lag: number) => void }) {
  const { body, surface, label, check, path } = parts;
  const lag = motionValue(0);
  let slot = selected ? SLOT : 0;
  let width = body.offsetWidth;
  let run: AnimationPlaybackControls | undefined;
  if (path) {
    path.setAttribute("pathLength", "1");
    path.style.strokeDasharray = "1";
  }
  const apply = () => {
    const value = lag.get();
    surface.style.right = `${-value}px`;
    if (label) label.style.transform = `translateX(${value}px)`;
    if (check) {
      // The check grows from zero width in exactly the gap the label opens as it slides over, so the two never overlap.
      const grown = Math.max(0, (slot + value) / SLOT);
      check.style.transform = `scale(${Math.min(grown, 1.1)})`;
      check.style.opacity = String(Math.min(1, grown * 1.4));
      check.style.filter = grown >= 1 ? "none" : `blur(${((1 - grown) * motionTokens.blur.subtle).toFixed(2)}px)`;
      if (path) path.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0.001, grown)));
    }
    onLag?.(value);
  };
  lag.on("change", apply);
  apply();
  const observer = new ResizeObserver(() => (width = body.offsetWidth));
  observer.observe(body);
  return {
    /** Call after the chip changed (selected, or its text) and the DOM has the new layout. */
    update(nextSelected: boolean) {
      slot = nextSelected ? SLOT : 0;
      const next = body.offsetWidth;
      const previous = width;
      width = next;
      if (previous === next) return apply();
      if (reduced) {
        lag.jump(0);
        return apply();
      }
      // Retarget from wherever the edge is now and keep its speed, so fast toggling never snaps.
      const velocity = lag.getVelocity();
      run?.stop();
      lag.jump(lag.get() + previous - next);
      run = animate(lag as never, 0, { ...(motionTokens.spring.morph as object), velocity } as never);
    },
    destroy() {
      observer.disconnect();
      run?.stop();
    },
  };
}

/**
 * Follows the chips' height. After a change (a selection, opening the overflow) it springs from the old height to the new one, then
 * returns to auto. It clips only while moving, so nothing is cut off at rest. Call `pin()` in the same commit as the change.
 */
export function createChipHeight(frame: HTMLElement, content: HTMLElement, reduced: boolean) {
  let changedAt = 0;
  let last: number | undefined;
  let animating = false;
  let current: number | undefined;
  let run: AnimationPlaybackControls | undefined;
  let release = 0;
  const settle = () => {
    animating = false;
    current = undefined;
    Object.assign(frame.style, { overflow: "", height: "auto", minHeight: "" });
  };
  const observer = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.blockSize ?? content.offsetHeight;
    const from = current ?? last;
    last = next;
    run?.stop();
    if (reduced || from === undefined || Math.abs(from - next) < 0.5 || performance.now() - changedAt > 160) return settle();
    // Pin the old height before this frame paints, then spring to the new one.
    Object.assign(frame.style, { overflow: "clip", height: `${from}px`, minHeight: `${from}px` });
    animating = true;
    run = animate(from, next, {
      ...(motionTokens.spring.smooth as object),
      onUpdate: (value: number) => {
        current = value;
        frame.style.height = `${value}px`;
        frame.style.minHeight = `${value}px`;
      },
      onComplete: settle,
    } as never);
  });
  observer.observe(content);
  return {
    /** Pins the old height, before the chips' new layout is measured. */
    pin() {
      changedAt = performance.now();
      if (reduced || last === undefined) return;
      const from = current ?? last;
      current = from;
      Object.assign(frame.style, { overflow: "clip", height: `${from}px`, minHeight: `${from}px` });
      // If the change leaves the height alone, no resize follows, so release the pin after a frame.
      cancelAnimationFrame(release);
      release = requestAnimationFrame(() => {
        release = requestAnimationFrame(() => {
          if (!animating) settle();
        });
      });
    },
    destroy() {
      observer.disconnect();
      run?.stop();
      cancelAnimationFrame(release);
    },
  };
}
