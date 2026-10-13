// @manicat-dependencies motion
/**
 * The two behaviours of the toast that are not an element coming or going, for the Vue and Svelte ports: the copy column that
 * springs to its new height when the message changes, and the swipe that dismisses it. The counterparts of `HeightFrame` and the drag
 * of `Toast` in toast.tsx.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

/** A swipe past this distance (px) or speed (px/s) dismisses the toast in the direction it was thrown. */
export const swipe = { distance: 80, velocity: 480 };

/**
 * Follows the content height. After `changed()` is called, the height springs from the old size to the new one and then returns to
 * auto, so passive reflows (a resize, a font swap) follow instantly. It clips only while moving, so focus rings stay visible at rest.
 */
export function createHeightFrame(frame: HTMLElement, content: HTMLElement, reduced: boolean) {
  let changedAt = 0;
  let last: number | undefined;
  let controls: AnimationPlaybackControls | undefined;
  let moving: number | undefined;
  const settle = () => {
    moving = undefined;
    Object.assign(frame.style, { overflow: "", height: "auto" });
  };
  const observer = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.blockSize ?? content.offsetHeight;
    const from = moving ?? last;
    last = next;
    controls?.stop();
    if (reduced || from === undefined || from === next || performance.now() - changedAt > 120) return settle();
    // Pin the old height before this frame paints, then spring to the new one.
    Object.assign(frame.style, { overflow: "hidden", height: `${from}px` });
    controls = animate(from, next, { ...(motionTokens.spring.smooth as object), onUpdate: (value: number) => { moving = value; frame.style.height = `${value}px`; }, onComplete: settle } as never);
  });
  observer.observe(content);
  return {
    changed() {
      changedAt = performance.now();
    },
    destroy() {
      observer.disconnect();
      controls?.stop();
    },
  };
}

/**
 * Drags a toast sideways. A short swipe springs back with its release velocity and a slight settle; a long or fast one calls
 * `onThrow` with how far to throw it (past the edge of the toast) and how fast it was going.
 */
export function createSwipe(node: HTMLElement, { reduced, onThrow }: { reduced: () => boolean; onThrow: (to: number, velocity: number) => void }) {
  let start = 0;
  let dragging = false;
  let pressed = false;
  let samples: { x: number; t: number }[] = [];
  let offset = 0;
  let home: AnimationPlaybackControls | undefined;
  const velocity = () => {
    const [first, last] = [samples[0], samples[samples.length - 1]];
    return first && last && last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0;
  };
  const move = (x: number) => {
    offset = x;
    animate(node, { x } as never, { duration: 0 });
  };
  const down = (event: PointerEvent) => {
    if (reduced() || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    home?.stop();
    start = event.clientX - offset;
    pressed = true;
    samples = [{ x: event.clientX, t: event.timeStamp }];
  };
  const drag = (event: PointerEvent) => {
    if (!pressed) return;
    const next = event.clientX - start;
    if (!dragging && Math.abs(next - offset) < 3) return;
    if (!dragging) node.setPointerCapture(event.pointerId);
    dragging = true;
    samples = [...samples.slice(-4), { x: event.clientX, t: event.timeStamp }];
    move(next);
  };
  const up = () => {
    if (!pressed) return;
    pressed = false;
    if (!dragging) return;
    dragging = false;
    const speed = velocity();
    const direction = Math.sign(offset || speed);
    if (Math.abs(offset) < swipe.distance && Math.abs(speed) < swipe.velocity) {
      home = animate(node, { x: 0 } as never, { ...(motionTokens.spring.snappy as object), velocity: speed } as never);
      offset = 0;
      return;
    }
    onThrow(direction * (node.offsetWidth + 48), speed);
  };
  node.style.touchAction = "pan-y";
  node.addEventListener("pointerdown", down);
  node.addEventListener("pointermove", drag);
  node.addEventListener("pointerup", up);
  node.addEventListener("pointercancel", up);
  return {
    offset: () => offset,
    reset() {
      offset = 0;
    },
    destroy() {
      home?.stop();
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", drag);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
    },
  };
}

/** The motion of a toast that is thrown away: it keeps its release velocity and fades, settling loosely so nothing unseen keeps it mounted. */
export const throwTiming = (velocity: number) => ({ x: { type: "spring", visualDuration: 0.3, bounce: 0, velocity, restDelta: 2, restSpeed: 40 }, opacity: { duration: motionTokens.duration.exit } });
