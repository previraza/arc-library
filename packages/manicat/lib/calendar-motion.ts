// @manicat-dependencies motion
/**
 * The motion of the calendar, for the Vue and Svelte ports: months side by side on one strip that a spring slides, and one
 * selected disc per month that glides between days. The counterparts of `SelectionDisc` and `MonthPane` in calendar.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";
import { motionTokens } from "./motion-tokens";

const { spring, duration, ease } = motionTokens;

/** Months sit side by side on one strip. Rapid clicks retarget the same spring, so the strip never queues or stacks panes. */
export const stripSpring = { type: "spring", visualDuration: 0.36, bounce: 0, restDelta: 0.002 } as const;
export const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
export const fromIndex = (index: number) => new Date(Math.floor(index / 12), ((index % 12) + 12) % 12, 1);

/** Places one month on the strip: it sits `index - position` months from the window and dims as it leaves. */
export function stylePane(el: HTMLElement, index: number, position: number) {
  const offset = index - position;
  el.style.transform = `translateX(calc(${offset * 100}% + ${offset * 16}px))`;
  el.style.opacity = String(1 - Math.min(1, Math.abs(offset)) * 0.6);
}

/** The months on the strip: the panes on either side of the position, plus the month being navigated to. */
export const spanOf = (value: number): [number, number] => [Math.floor(value + 1e-3), Math.ceil(value - 1e-3)];

/**
 * The strip position, measured in months. `place` moves it to a month: the first month and reduced motion land in place,
 * everything else slides. `onChange` hears every frame, so panes can be restyled and the span re-read.
 */
export function createStrip(first: number, onChange: (position: number) => void) {
  const position = motionValue(first);
  let placed = false;
  let run: AnimationPlaybackControls | undefined;
  position.on("change", onChange);
  return {
    get: () => position.get(),
    place(target: number, reduced: boolean) {
      const from = position.get();
      if (from === target) return;
      run?.stop();
      if (!placed || reduced) {
        placed = true;
        position.jump(target);
        return;
      }
      // Long jumps (Today, a year with Shift) start one month away, so the strip never scrolls through the months between.
      if (Math.abs(target - from) > 2) position.jump(target - Math.sign(target - from));
      run = animate(position, target, stripSpring as never);
    },
    markPlaced() {
      placed = true;
    },
    destroy() {
      run?.stop();
    },
  };
}

/**
 * The selected disc of one month. It is positioned by week and weekday rather than measured, so it glides on a straight
 * line between any two days, keeps gliding while the strip slides, and retargets mid-flight on a new pick.
 * It only grows in or fades out when the selection enters or leaves this month.
 */
export function createDisc(el: HTMLElement, cell: number, reduced: boolean) {
  const shown = cell >= 0;
  const col: MotionValue<number> = motionValue(shown ? cell % 7 : 0);
  const row: MotionValue<number> = motionValue(shown ? Math.floor(cell / 7) : 0);
  const opacity: MotionValue<number> = motionValue(shown ? 1 : 0);
  const scale: MotionValue<number> = motionValue(shown ? 1 : 0.6);
  // Each step is one cell plus the 4px gap; percentages resolve against the disc's own size, which matches a cell.
  const paint = () => {
    el.style.transform = `translate(calc(${col.get()} * (100% + 4px)), calc(${row.get()} * (100% + 4px))) scale(${scale.get()})`;
    el.style.opacity = String(opacity.get());
  };
  for (const value of [col, row, opacity, scale]) value.on("change", paint);
  paint();
  let hidden = !shown;
  let controls: AnimationPlaybackControls[] = [];
  const stop = () => {
    controls.forEach((control) => control.stop());
    controls = [];
  };
  return {
    set(next: number) {
      stop();
      if (next < 0) {
        hidden = true;
        const fade = reduced ? { duration: 0 } : { duration: 0.14, ease: [...ease.standard] };
        controls = [animate(opacity, 0, fade as never), animate(scale, 0.6, fade as never)];
        return;
      }
      const nextCol = next % 7;
      const nextRow = Math.floor(next / 7);
      if (hidden || reduced) {
        col.jump(nextCol);
        row.jump(nextRow);
      } else controls.push(animate(col, nextCol, spring.morph as never), animate(row, nextRow, spring.morph as never));
      hidden = false;
      controls.push(animate(opacity, 1, (reduced ? { duration: 0 } : { duration: duration.fast, ease: [...ease.enter] }) as never), animate(scale, 1, (reduced ? { duration: 0 } : spring.snappy) as never));
    },
    destroy: stop,
  };
}

/** Today turns over at local midnight; returning to the tab or waking the device reads it again. */
export function watchToday(notify: (today: Date) => void) {
  const read = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  let timer = 0;
  const schedule = () => {
    const now = new Date();
    timer = window.setTimeout(() => {
      notify(read());
      schedule();
    }, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 1000);
  };
  const again = () => notify(read());
  const visible = () => {
    if (document.visibilityState === "visible") again();
  };
  schedule();
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("focus", again);
  notify(read());
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("focus", again);
  };
}
