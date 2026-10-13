// @manicat-dependencies motion
/**
 * What the command palette needs besides its markup, for the Vue and Svelte ports: the one highlight that follows the active result,
 * and the results frame that follows the list height. The counterparts of the motion values and layout effects in command-palette.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/** When every remaining row moves within about a viewport, the list closes its gaps with a glide. */
export const GLIDE_ROWS = 6;

/** One highlight follows the active result: a spring for the pointer, a 70ms slide for arrow keys, a fade when it first appears. */
export function createHighlight(list: HTMLElement, mark: HTMLElement, reduced: boolean) {
  const y = motionValue(0);
  const height = motionValue(0);
  const opacity = motionValue(0);
  const paint = () => {
    mark.style.transform = `translateY(${y.get()}px)`;
    mark.style.height = `${height.get()}px`;
    mark.style.opacity = String(opacity.get());
  };
  for (const value of [y, height, opacity]) value.on("change", paint);
  paint();
  let shown = false;
  return {
    set(node: HTMLElement | null, pointer: boolean) {
      if (!node) {
        shown = false;
        animate(opacity, 0, { duration: reduced ? 0 : 0.1 });
        return;
      }
      const move = !shown || reduced ? { duration: 0 } : pointer ? motionTokens.spring.snappy : { duration: 0.07, ease: [...motionTokens.ease.enter] };
      // Rows sit inside positioned groups, so their offset is summed up to the list (layout transforms stay out of it).
      let top = 0;
      for (let element: HTMLElement | null = node; element && element !== list; element = element.offsetParent as HTMLElement | null) top += element.offsetTop + (element === node ? 0 : element.clientTop);
      animate(y, top, move as never);
      animate(height, node.offsetHeight, move as never);
      animate(opacity, 1, { duration: reduced ? 0 : 0.08 });
      shown = true;
    },
  };
}

/** The results frame follows the list height, so filtering closes or opens the gap instead of snapping. */
export function followHeight(frame: HTMLElement, list: HTMLElement, reduced: boolean) {
  let current: number | undefined;
  let run: AnimationPlaybackControls | undefined;
  const observer = new ResizeObserver(([entry]) => {
    const next = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? list.offsetHeight);
    run?.stop();
    if (current === undefined || reduced) frame.style.height = `${next}px`;
    else run = animate(frame, { height: [`${frame.offsetHeight}px`, `${next}px`] }, motionTokens.spring.smooth as never);
    current = next;
  });
  observer.observe(list);
  return () => {
    observer.disconnect();
    run?.stop();
  };
}
