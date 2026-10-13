// @manicat-dependencies motion
/**
 * What the React tooltip does beyond the primitive, for the Vue and Svelte ports. Every tooltip brings its own provider, so the skip
 * window is shared here: while any tooltip is open, and briefly after the last one closes, the next one opens without delay or travel.
 * And string content crossfades when it changes while open, while the bubble springs to the new text size.
 */
import { animate } from "motion";
import { motionTokens } from "./motion-tokens";

const SKIP_WINDOW = 300;
let warm = false;
let openCount = 0;
let coolTimer = 0;
const listeners = new Set<() => void>();

export const warmth = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => warm,
  set(next: boolean) {
    if (warm === next) return;
    warm = next;
    listeners.forEach((listener) => listener());
  },
  opened() {
    openCount += 1;
    window.clearTimeout(coolTimer);
    warmth.set(true);
  },
  closed() {
    openCount = Math.max(0, openCount - 1);
    if (openCount) return;
    window.clearTimeout(coolTimer);
    coolTimer = window.setTimeout(() => warmth.set(false), SKIP_WINDOW);
  },
};

const blur = (px: number) => `blur(${px}px)`;
const bezier = (name: keyof typeof motionTokens.ease) => [...motionTokens.ease[name]] as [number, number, number, number];

export function createTooltipText(host: HTMLElement, { text, reduced, classes }: { text: string; reduced: boolean; classes: { text: string; measure: string; line: string } }) {
  const box = document.createElement("span");
  box.className = classes.text;
  const measure = document.createElement("span");
  measure.className = classes.measure;
  measure.setAttribute("aria-hidden", "true");
  box.append(measure);
  host.replaceChildren(box);
  let line: HTMLElement | undefined;
  let measured: string | null = null;
  let current = text;

  const show = (next: string, animated: boolean) => {
    const previous = line;
    const fresh = document.createElement("span");
    fresh.className = classes.line;
    fresh.textContent = next;
    box.append(fresh);
    line = fresh;
    if (animated && !reduced) animate(fresh, { opacity: [0, 1], y: [0.3 * parseFloat(getComputedStyle(fresh).fontSize), 0], filter: [blur(motionTokens.blur.soft), blur(0)] }, { duration: motionTokens.duration.standard, ease: bezier("enter") });
    if (previous) {
      Object.assign(previous.style, { position: "absolute", left: `${previous.offsetLeft}px`, top: `${previous.offsetTop}px` });
      if (reduced) previous.remove();
      else animate(previous, { opacity: 0, y: -0.3 * parseFloat(getComputedStyle(previous).fontSize), filter: blur(motionTokens.blur.subtle) }, { duration: motionTokens.duration.instant, ease: bezier("standard") }).finished.then(() => previous.remove());
    }
  };

  measure.textContent = text;
  show(text, false);
  const observer = new ResizeObserver(([entry]) => {
    const size = entry.borderBoxSize?.[0];
    const width = Math.ceil(size?.inlineSize ?? measure.offsetWidth);
    const height = Math.ceil(size?.blockSize ?? measure.offsetHeight);
    const animated = measured !== null && measured !== measure.textContent;
    measured = measure.textContent;
    animate(box, { width, height }, animated && !reduced ? (motionTokens.spring.morph as never) : { duration: 0 });
  });
  observer.observe(measure);

  return {
    set(next: string) {
      if (next === current) return;
      current = next;
      measure.textContent = next;
      show(next, true);
    },
    destroy: () => observer.disconnect(),
  };
}
