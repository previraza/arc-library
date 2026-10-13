// @manicat-dependencies motion
/**
 * The shared state and the surface motion of the hover card, for the Vue and Svelte ports. One hover card is open at a time on the
 * page; the counterpart of the `cards` store and `Surface` in hover-card.tsx.
 */
import { animate, motionValue } from "motion";
import { motionTokens } from "./motion-tokens";

export const OPEN_DELAY = 500;
export const CLOSE_DELAY = 140;
/** Moving to another trigger within this window opens its card almost at once. */
export const SKIP_WINDOW = 300;
/** Even warm, a trigger waits this long, so a pointer crossing it on the way into an open card does not steal the card. */
export const INTENT = 80;
/** How far the card starts toward its trigger, in px. */
export const TRAVEL = 4;
const enter = [...motionTokens.ease.enter] as [number, number, number, number];
const standard = [...motionTokens.ease.standard] as [number, number, number, number];

export type CardSnapshot = { id: string | null; instant: boolean };
const IDLE: CardSnapshot = { id: null, instant: false };
let snapshot = IDLE;
let closedAt = -Infinity;
const listeners = new Set<() => void>();

/** One hover card is open at a time on the page. While one is open, or just after it closes, the next one opens without waiting and only fades. */
export const cards = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => snapshot,
  warm: () => snapshot.id !== null || performance.now() - closedAt < SKIP_WINDOW,
  open(id: string) {
    if (snapshot.id === id) return;
    snapshot = { id, instant: cards.warm() };
    listeners.forEach((listener) => listener());
  },
  close(id: string) {
    if (snapshot.id !== id) return;
    snapshot = IDLE;
    closedAt = performance.now();
    listeners.forEach((listener) => listener());
  },
};

/**
 * Grows from the trigger edge: scale from .96 around the placed origin and a 4px offset toward the trigger on one smooth spring, with its own fade.
 * Both retarget from where they are if the pointer comes back mid-exit, so the card turns around instead of jumping.
 */
export function createSurface(node: HTMLElement, { still, reduced }: { still: boolean; reduced: boolean }) {
  const progress = motionValue(0);
  const opacity = motionValue(0);
  // The side is read from the placed card every frame, so a card that flips above its trigger still grows from the trigger edge.
  const apply = (value: number) => {
    const side = node.dataset.side;
    const travel = still ? 0 : (1 - value) * TRAVEL;
    const x = side === "left" ? travel : side === "right" ? -travel : 0;
    const y = side === "top" ? travel : side === "bottom" ? -travel : 0;
    node.style.translate = `${x}px ${y}px`;
    node.style.scale = String(still ? 1 : 0.96 + 0.04 * value);
  };
  progress.on("change", apply);
  opacity.on("change", (value) => (node.style.opacity = String(value)));
  apply(0);
  node.style.opacity = "0";
  const run = (open: boolean, done?: () => void) => {
    const controls = open ? animate(progress, 1, (still ? { duration: 0.14, ease: enter } : motionTokens.spring.smooth) as never) : animate(progress, 0, { duration: 0.12, ease: standard });
    const fade = open ? animate(opacity, 1, { duration: reduced ? 0.15 : still ? 0.09 : 0.16, ease: enter }) : animate(opacity, 0, { duration: reduced ? 0.1 : 0.12, ease: standard });
    if (!open && done) fade.then(done);
    return () => {
      controls.stop();
      fade.stop();
    };
  };
  let stop = () => {};
  return {
    in() {
      stop();
      stop = run(true);
    },
    out(done: () => void) {
      stop();
      stop = run(false, done);
    },
  };
}
