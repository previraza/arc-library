// @manicat-dependencies motion
/**
 * The two pieces of the tag input that are not an element coming or going, for the Vue and Svelte ports: the shell that follows
 * its wrapped rows on a spring, and the ring that glides to the picked tag. The counterparts of the height effect and the ring
 * effect in tag-input.tsx.
 */
import { animate } from "motion";
import { motionTokens } from "./motion-tokens";

const ease = (name: keyof typeof motionTokens.ease) => [...motionTokens.ease[name]] as [number, number, number, number];

/** Sizes `control` to `content` and follows it on a spring when a tag starts or leaves a line. Returns a function that stops following. */
export function followShell(control: HTMLElement, content: HTMLElement, reduced: boolean) {
  if (typeof ResizeObserver === "undefined") return () => {};
  let first = true;
  let run: { stop(): void } | undefined;
  const observer = new ResizeObserver(() => {
    const next = content.offsetHeight;
    if (first) {
      first = false;
      control.style.height = `${next}px`;
      return;
    }
    run?.stop();
    if (reduced) control.style.height = `${next}px`;
    else run = animate(control, { height: [`${control.offsetHeight}px`, `${next}px`] }, motionTokens.spring.smooth as never);
  });
  observer.observe(content);
  return () => {
    run?.stop();
    observer.disconnect();
  };
}

/** The ring measures the picked tag's resting box, glides between picks, and fades in place when the pick clears. */
export function createPickRing(ring: HTMLElement, content: HTMLElement, reduced: boolean) {
  let at = "";
  return {
    sync(active: string | null) {
      const node = active === null ? null : [...content.querySelectorAll<HTMLElement>("[data-tag]")].find((tag) => tag.dataset.tag === active);
      // It leaves on the same curve as a removed tag, so a picked tag and its ring fade out as one piece.
      if (!node) {
        if (at) animate(ring, reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }, { duration: reduced ? 0 : motionTokens.duration.instant, ease: ease("standard") });
        at = "";
        return;
      }
      const box = { x: node.offsetLeft, y: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight };
      const key = Object.values(box).join(" ");
      if (key === at) return;
      // A ring that is still fading from the last pick glides on to the next one, so quick Backspaces read as one motion.
      if (!reduced && (at || Number(getComputedStyle(ring).opacity) > 0.02)) animate(ring, { ...box, opacity: 1, scale: 1 } as never, { ...motionTokens.spring.morph, opacity: { duration: motionTokens.duration.fast } } as never);
      else animate(ring, { ...box, opacity: [0, 1], scale: [reduced ? 1 : 0.9, 1] } as never, (reduced ? { duration: 0, opacity: { duration: motionTokens.duration.instant } } : { duration: 0, opacity: { duration: motionTokens.duration.fast }, scale: motionTokens.spring.snappy }) as never);
      at = key;
    },
  };
}
