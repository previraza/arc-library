// @manicat-dependencies motion
/**
 * The reveal of the in-view title, for the Vue and Svelte ports. The component renders the words, lines or letters with a
 * `data-reveal` kind, a `data-delay` and a `data-settle` (and `data-offset` for letters); this watches the title scroll into view
 * and moves every part between its hidden and shown pose. The counterpart of the `motion` spans and `useInView` of in-view-title.tsx.
 */
import { animate } from "motion";
import { motionTokens } from "./motion-tokens";

const ease = (name: "enter" | "standard") => [...motionTokens.ease[name]] as [number, number, number, number];

type Pose = Record<string, string | number>;
const poses: Record<string, (offset: number) => { hidden: Pose; shown: Pose }> = {
  word: () => ({ hidden: { y: "0.9em", opacity: 0 }, shown: { y: "0em", opacity: 1 } }),
  line: () => ({ hidden: { y: "112%", opacity: 0 }, shown: { y: "0%", opacity: 1 } }),
  blur: () => ({ hidden: { opacity: 0, y: "0.2em", filter: `blur(${motionTokens.blur.text}px)` }, shown: { opacity: 1, y: "0em", filter: "blur(0px)" } }),
  "track-word": () => ({ hidden: { opacity: 0, filter: `blur(${motionTokens.blur.soft}px)` }, shown: { opacity: 1, filter: "blur(0px)" } }),
  "track-letter": (offset) => ({ hidden: { x: `${offset}em` }, shown: { x: "0em" } }),
  wipe: () => ({ hidden: { "--wipe": "100%", x: "-0.12em" }, shown: { "--wipe": "0%", x: "0em" } }),
};

/** Transform settles longest, blur clears sooner, and opacity leads, so text is readable before it has fully arrived. Hiding is a quick fade with no stagger. */
function reveal(instant: boolean, visible: boolean, delay: number, settle: number) {
  if (instant) return { duration: 0 };
  if (!visible) return { duration: motionTokens.duration.exit, ease: ease("standard") };
  const track = (duration: number, curve: "enter" | "standard" = "enter") => ({ duration, delay, ease: ease(curve) });
  return { y: track(settle), x: track(settle), "--wipe": track(settle, "standard"), filter: track(settle * 0.78), opacity: track(settle * 0.56, "standard") };
}

export function createInViewTitle(wrap: HTMLElement, { once, reduced, visible: start = false }: { once: boolean; reduced: boolean; visible?: boolean }) {
  const parts = [...wrap.querySelectorAll<HTMLElement>("[data-reveal]")];
  let visible = start || reduced;
  const apply = (instant: boolean) => {
    for (const part of parts) {
      const { hidden, shown } = poses[part.dataset.reveal ?? "word"](Number(part.dataset.offset ?? 0));
      const delay = Number(part.dataset.delay ?? 0);
      const settle = Number(part.dataset.settle ?? 0.8);
      const target = visible ? shown : hidden;
      animate(part, target as never, reveal(instant, visible, delay, settle) as never);
    }
  };
  apply(true);

  const set = (next: boolean) => {
    if (next === visible) return;
    visible = next;
    apply(reduced);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        set(true);
        if (once) observer.disconnect();
      } else if (!once) set(false);
    },
    { threshold: 0.45 },
  );
  observer.observe(wrap);
  // Titles that are already above the viewport show immediately.
  const revealPassed = () => {
    if (!visible && wrap.getBoundingClientRect().top < 0) {
      visible = true;
      apply(reduced);
      window.removeEventListener("scroll", revealPassed);
    }
  };
  revealPassed();
  window.addEventListener("scroll", revealPassed, { passive: true });
  return {
    /** Whether the title is showing, so a re-render can start from there. */
    visible: () => visible,
    destroy() {
      observer.disconnect();
      window.removeEventListener("scroll", revealPassed);
    },
  };
}
