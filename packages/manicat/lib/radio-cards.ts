// @manicat-dependencies motion
/**
 * The selection ring of the radio cards, for the Vue and Svelte ports: one element that springs to the selected card's box and, at
 * rest, follows layout changes exactly, plus the dot that grows inside the chosen card. The counterpart of the motion values in radio-cards.tsx.
 */
import { animate, motionValue } from "motion";
import { motionTokens } from "./motion-tokens";

const standard = [...motionTokens.ease.standard] as [number, number, number, number];
const physical = (visualDuration: number, bounce: number) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring", stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 } as const;
};
const GLIDE = physical(0.42, 0.14);

export function createCardRing(root: HTMLElement, ring: HTMLElement, reduced: boolean) {
  const x = motionValue(0);
  const y = motionValue(0);
  const w = motionValue(0);
  const h = motionValue(0);
  const o = motionValue(0);
  const paint = () => {
    ring.style.transform = `translateX(${x.get()}px) translateY(${y.get()}px)`;
    ring.style.width = `${w.get()}px`;
    ring.style.height = `${h.get()}px`;
    ring.style.opacity = String(o.get());
  };
  for (const value of [x, y, w, h, o]) value.on("change", paint);
  paint();
  let placed = false;
  let selected = -1;
  let dotsPlaced = false;

  const place = (spring: boolean) => {
    const node = selected < 0 ? null : root.querySelector<HTMLElement>(`[data-card="${selected}"]`);
    if (!node) {
      o.set(0);
      placed = false;
      return;
    }
    const box = [node.offsetLeft, node.offsetTop, node.offsetWidth, node.offsetHeight];
    if (!spring || !placed || reduced) {
      x.jump(box[0]);
      y.jump(box[1]);
      w.jump(box[2]);
      h.jump(box[3]);
      if (!placed && !reduced && spring) {
        o.jump(0);
        animate(o, 1, { duration: motionTokens.duration.fast, ease: standard });
      } else o.jump(1);
      placed = true;
      return;
    }
    animate(x, box[0], GLIDE);
    animate(y, box[1], GLIDE);
    animate(w, box[2], GLIDE);
    animate(h, box[3], GLIDE);
    o.set(1);
  };
  // A resize only snaps the ring to the new layout; it never replays the glide.
  const observer = new ResizeObserver(() => place(false));
  observer.observe(root);

  return {
    /** Moves the ring and the dots to the selected card (-1 for none). Call it after the DOM has updated. */
    sync(index: number) {
      selected = index;
      place(true);
      root.querySelectorAll<HTMLElement>("[data-dot]").forEach((dot, at) => {
        const scale = at === index ? 1 : 0;
        if (!dotsPlaced || reduced) dot.style.transform = `scale(${scale})`;
        else animate(dot, { scale }, motionTokens.spring.snappy as never);
      });
      dotsPlaced = true;
    },
    destroy() {
      observer.disconnect();
    },
  };
}
