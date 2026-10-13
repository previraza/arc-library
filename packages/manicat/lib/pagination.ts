// @manicat-dependencies motion
/**
 * The mark of the pagination, for the Vue and Svelte ports: one box that travels to the current page's slot, so the page changes
 * with a glide instead of a swap. The counterpart of the layout effect in pagination.tsx.
 */
import { animate, motionValue } from "motion";
import { motionTokens } from "./motion-tokens";

/** One button plus the gap (36px + 4px), as a percentage of the button width. */
export const slot = 1000 / 9;

export function createMark(nav: HTMLElement, mark: HTMLElement, reduced: boolean) {
  const x = motionValue(0);
  const y = motionValue(0);
  const paint = () => (mark.style.transform = `translateX(${x.get()}px) translateY(${y.get()}px)`);
  x.on("change", paint);
  y.on("change", paint);
  paint();
  let size = "";
  let observer: ResizeObserver | undefined;
  const place = (instant: boolean) => {
    const current = nav.querySelector<HTMLElement>("[aria-current='page']");
    if (!current) return;
    if (instant || reduced) {
      x.jump(current.offsetLeft);
      y.jump(current.offsetTop);
      return;
    }
    animate(x, current.offsetLeft, motionTokens.spring.morph as never);
    animate(y, current.offsetTop, motionTokens.spring.morph as never);
  };
  return {
    /** Moves the mark to the current page. The first call lands without motion and shows the mark. */
    sync() {
      if (!nav.querySelector("[aria-current='page']")) return;
      place(!("markReady" in nav.dataset));
      nav.dataset.markReady = "";
      if (!observer) {
        size = `${nav.offsetWidth}x${nav.offsetHeight}`;
        observer = new ResizeObserver(() => {
          const next = `${nav.offsetWidth}x${nav.offsetHeight}`;
          if (next !== size) {
            size = next;
            place(true);
          }
        });
        observer.observe(nav);
      }
    },
    destroy() {
      observer?.disconnect();
    },
  };
}
