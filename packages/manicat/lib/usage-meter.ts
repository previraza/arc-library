// @manicat-dependencies motion
/**
 * The bar, the badge and the swaps of the usage meter, for the Vue and Svelte ports: every segment keeps its own spring and starts where
 * the ones before it end, the limit marker and the hatch fade when usage crosses the limit, and changed text rises from a soft blur.
 * The counterparts of the motion values in usage-meter.tsx; the rolling numbers are `createCounter` from counter.ts.
 */
import { animate, cancelFrame, frame, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";
import type { Pose, Timing } from "./motion-dom";
import { motionTokens } from "./motion-tokens";

const { spring, duration, ease, blur } = motionTokens;
/** Motion drops inherited velocity on time-defined springs, so values that retarget mid-flight run the same springs written as stiffness and damping. */
const physical = ({ visualDuration, bounce }: { visualDuration: number; bounce: number }, restDelta = 0.001) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, restDelta, restSpeed: restDelta * 2 };
};
const settle = physical(spring.smooth);
const reveal = physical({ visualDuration: duration.considered + 0.1, bounce: 0 });
export const fit = physical(spring.morph, 0.01);
/** A segment stops two pixels short of the next, so neighbours read apart without an outline. */
export const GAP = 2;

/** Starts animations on the next frame, so the render that caused them never swallows a spring's first frames. Returns a cleanup. */
function soon(start: () => { stop: () => void }) {
  let controls: { stop: () => void } | null = null;
  const run = () => {
    controls = start();
  };
  frame.update(run);
  return () => {
    cancelFrame(run);
    controls?.stop();
  };
}

export interface MeterSegment {
  id: string;
  label: string;
  value: number;
}

export function createUsageBar({ track, overflow, marker }: { track: HTMLElement; overflow: HTMLElement; marker: HTMLElement }, { reduced, limit }: { reduced: boolean; limit: number }) {
  /** One motion value per segment id, kept across updates so a changed value springs from where it is. */
  const store = new Map<string, MotionValue<number>>();
  const shownLimit = motionValue(limit);
  const width = motionValue(0);
  const markerOpacity = motionValue(0);
  let order: string[] = [];
  let subscriptions: (() => void)[] = [];
  let fading: AnimationPlaybackControls | undefined;
  let isOver = false;
  let revealed = false;
  let valuesKey = "";
  let stopValues: (() => void)[] = [];
  let lastLimit = limit;
  let stopLimit: (() => void) | undefined;

  const amounts = () => order.map((id) => store.get(id)!);
  const used = () => amounts().reduce((sum, amount) => sum + amount.get(), 0);

  /** Each segment starts where the ones before it end, so growth in any of them pushes the rest along in the same frame. */
  function paint() {
    const list = amounts();
    const span = Math.max(shownLimit.get(), used(), 1e-6);
    const w = width.get();
    const limitX = Math.round((shownLimit.get() / span) * w);
    const segments = track.querySelectorAll<HTMLElement>("[data-seg]");
    let start = 0;
    list.forEach((amount, index) => {
      const x = (start / span) * w;
      start += amount.get();
      const el = segments[index];
      if (!el) return;
      const size = (amount.get() / span) * w;
      const rest = w - x - size;
      const scaleX = w ? Math.max(0, size - Math.min(GAP, size, Math.max(0, rest))) / w : 0;
      el.style.transformOrigin = "0% 50%";
      el.style.transform = `translateX(${x}px) scaleX(${scaleX})`;
    });
    overflow.style.clipPath = `inset(0 0 0 ${limitX + GAP}px)`;
    marker.style.transform = `translateX(${limitX}px)`;
  }

  // The limit marker and the hatch fade on their own short tween whenever usage crosses the limit, so a limit that jumps past usage never blinks them out in one frame.
  function check() {
    const next = used() > shownLimit.get();
    if (next === isOver) return;
    isOver = next;
    fading?.stop();
    if (reduced) markerOpacity.jump(next ? 1 : 0);
    else fading = animate(markerOpacity, next ? 1 : 0, { duration: duration.fast, ease: [...ease.standard] });
  }
  const stopOpacity = markerOpacity.on("change", (value) => {
    overflow.style.opacity = String(value);
    marker.style.opacity = String(value);
  });
  const stopLimitWatch = shownLimit.on("change", () => {
    paint();
    check();
  });
  const stopWidth = width.on("change", paint);

  const observer = new ResizeObserver(() => width.set(track.clientWidth));
  observer.observe(track);
  width.set(track.clientWidth);
  overflow.style.opacity = "0";
  marker.style.opacity = "0";

  function bind(ids: string[]) {
    if (ids.join("|") === order.join("|") && subscriptions.length) return;
    subscriptions.forEach((stop) => stop());
    order = ids;
    for (const id of ids) if (!store.has(id)) store.set(id, motionValue(0));
    subscriptions = amounts().map((amount) =>
      amount.on("change", () => {
        paint();
        check();
      }),
    );
  }

  return {
    /** Call whenever the segments, the limit or whether the meter has been seen changed. */
    update({ segments, limit: next, ready }: { segments: MeterSegment[]; limit: number; ready: boolean }) {
      bind(segments.map((segment) => segment.id));
      // Segments grow into place once seen, left to right; later changes re-flow every segment on one spring each.
      const key = `${segments.map((segment) => `${segment.id}:${segment.value}`).join("|")}#${ready}`;
      if (key !== valuesKey) {
        valuesKey = key;
        stopValues.forEach((stop) => stop());
        stopValues = [];
        if (ready) {
          const first = !revealed;
          revealed = true;
          stopValues = segments.flatMap((segment, index) => {
            const amount = store.get(segment.id);
            if (!amount || amount.get() === segment.value) return [];
            if (reduced) {
              amount.jump(segment.value);
              return [];
            }
            return [soon(() => animate(amount, segment.value, (first ? { ...reveal, delay: index * 0.07 } : settle) as never))];
          });
        }
      }
      if (next !== lastLimit) {
        lastLimit = next;
        stopLimit?.();
        stopLimit = undefined;
        if (shownLimit.get() !== next) {
          if (reduced) shownLimit.jump(next);
          else stopLimit = soon(() => animate(shownLimit, next, settle as never));
        }
      }
      paint();
      check();
    },
    destroy() {
      observer.disconnect();
      subscriptions.forEach((stop) => stop());
      stopValues.forEach((stop) => stop());
      stopLimit?.();
      fading?.stop();
      stopOpacity();
      stopLimitWatch();
      stopWidth();
    },
  };
}

/** The status mark hugs its words: its width springs to each message and grows from the right edge, so the text never slides. */
export function createBadgeWidth(slot: HTMLElement, inner: HTMLElement, reduced: boolean) {
  const width = motionValue<number>(0);
  const stop = width.on("change", (value) => (slot.style.width = `${value}px`));
  let measured = false;
  const observer = new ResizeObserver(() => {
    const next = inner.offsetWidth;
    if (measured && !reduced) animate(width, next, fit as never);
    else width.jump(next);
    measured = next > 0;
  });
  observer.observe(inner);
  return () => {
    observer.disconnect();
    stop();
  };
}

/** Changed text rises from a soft blur and leaves a little faster than it arrives. Icons cross through a small scale instead. */
export function risePoses(node: HTMLElement, direction: number, reduced: boolean): { from: Pose; rest: Pose; out: Pose; enterTiming: Timing; leaveTiming: Timing } {
  const em = parseFloat(getComputedStyle(node).fontSize) || 16;
  const rest: Pose = { opacity: 1, y: 0, scale: 1, blur: 0 };
  if (reduced) return { from: { opacity: 0, y: 0, scale: 1, blur: 0 }, rest, out: { opacity: 0, y: 0, scale: 1, blur: 0 }, enterTiming: { duration: duration.fast }, leaveTiming: { duration: duration.instant } };
  return {
    from: { opacity: 0, y: 0.3 * direction * em, scale: 1, blur: blur.soft },
    rest,
    out: { opacity: 0, y: -0.3 * direction * em, scale: 1, blur: blur.subtle },
    enterTiming: { duration: duration.standard, ease: "enter" },
    leaveTiming: { duration: duration.instant, ease: "standard" },
  };
}

export function popPoses(reduced: boolean): { from: Pose; rest: Pose; enterTiming: Timing; leaveTiming: Timing } {
  const rest: Pose = { opacity: 1, y: 0, scale: 1, blur: 0 };
  if (reduced) return { from: { opacity: 0, y: 0, scale: 1, blur: 0 }, rest, enterTiming: { duration: duration.fast }, leaveTiming: { duration: duration.instant } };
  return { from: { opacity: 0, y: 0, scale: 0.6, blur: blur.subtle + 1 }, rest, enterTiming: { spring: "snappy", fade: duration.fast }, leaveTiming: { duration: duration.instant, ease: "standard" } };
}
