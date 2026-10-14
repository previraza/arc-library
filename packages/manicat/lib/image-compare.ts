// @manicat-dependencies motion
/**
 * The divider of the image compare, for the Vue and Svelte ports: one controller owns the position, the drag with its rubber band, the
 * press that springs the divider to the finger, the keyboard, the quarter turn between orientations and the captions that fade as the
 * divider reaches them. The counterpart of the motion values and handlers of `ImageCompare` in image-compare.tsx.
 */
import { animate, motionValue } from "motion";

import { motionTokens } from "./motion-tokens";

type Metrics = { w: number; h: number; bw: number; bh: number; aw: number; ah: number };
type Drag = { pointer: number; grab: number; press: boolean; started: boolean; x: number; y: number; raw: number };

const { spring } = motionTokens;
/** Motion drops velocity on time-defined springs, so hand-offs run the same springs written as stiffness and damping, settling far below a pixel. */
const physical = ({ visualDuration, bounce }: { visualDuration: number; bounce: number }) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, restDelta: 0.002, restSpeed: 0.02 };
};
const moveSpring = physical(spring.snappy);
const turnSpring = physical(spring.morph);
const kickSpring = physical(spring.morph);
/** Rubber-band travel past an edge, the handle's inset from the frame, how far it gives inside that inset, and a key press at a limit. */
const STRETCH = 9;
const MARGIN = 42;
const GIVE = 12;
const BUMP_PX = 150;
const INSET = 12;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
/** iOS style resistance: travel past a limit gives less and less, and never more than `limit` pixels. */
const rubber = (distance: number, limit = STRETCH) => Math.sign(distance) * (1 - 1 / ((Math.abs(distance) * 0.55) / limit + 1)) * limit;
/** The handle keeps the line's pace in the middle and slows smoothly near an edge, so it is never cut off and never stops dead. */
const give = (distance: number) => GIVE * (1 - 1 / (distance / GIVE + 1));
const soften = (at: number, size: number) => (at < MARGIN ? MARGIN - give(MARGIN - at) : at > size - MARGIN ? size - MARGIN + give(at - size + MARGIN) : at);
const fade = (room: number) => clamp(room / 28, 0, 1);

/** The before side of a line through `center` at `angle`, cut from the frame: the clip while the divider turns. */
function halfPlane(w: number, h: number, center: [number, number], angle: number) {
  const nx = -Math.cos(angle);
  const ny = -Math.sin(angle);
  const side = ([x, y]: number[]) => (x - center[0]) * nx + (y - center[1]) * ny;
  const corners = [[0, 0], [w, 0], [w, h], [0, h]];
  const points: number[][] = [];
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % 4];
    const a = side(corner);
    const b = side(next);
    if (a >= 0) points.push(corner);
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      points.push([corner[0] + (next[0] - corner[0]) * t, corner[1] + (next[1] - corner[1]) * t]);
    }
  });
  return points.length ? `polygon(${points.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(", ")})` : "inset(50%)";
}

export interface ImageCompareParts {
  root: HTMLElement;
  before: HTMLElement;
  beforeChip?: HTMLElement | null;
  afterChip?: HTMLElement | null;
  afterBottom?: HTMLElement | null;
  pivot: HTMLElement;
  rotor: HTMLElement;
  handleSlot: HTMLElement;
  handle: HTMLElement;
  chevrons: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
}

export function createImageCompare(parts: ImageCompareParts, { position, vertical, reduced, onCommit }: { position: number; vertical: boolean; reduced: boolean; onCommit: (value: number) => void }) {
  const { root, before, beforeChip, afterChip, afterBottom, pivot, rotor, handleSlot, handle, chevrons, left, right } = parts;
  let isVertical = vertical;
  let current = clamp(position, 0, 100);
  let latest = current;
  let goal = current;
  let drag: Drag | null = null;
  let pressedHandle = false;
  let dragging = false;

  const pos = motionValue(current);
  const lag = motionValue(0);
  const theta = motionValue(vertical ? 90 : 0);
  let metrics: Metrics = { w: 0, h: 0, bw: 0, bh: 0, aw: 0, ah: 0 };
  const shown = () => pos.get() + lag.get();
  const turn = () => clamp(theta.get() / 90, 0, 1);
  /** The divider's pivot in pixels, blending from the horizontal to the vertical layout as it turns. */
  const center = (p: number, m: Metrics): [number, number] => [lerp((p / 100) * m.w, m.w / 2, turn()), lerp(m.h / 2, (p / 100) * m.h, turn())];
  const rest = (angle: number, m: Metrics) => angle === 0 || angle === 90 || !m.w;
  const offset = () => {
    const m = metrics;
    if (!m.w) return 0;
    const p = shown();
    const x = (p / 100) * m.w;
    const y = (p / 100) * m.h;
    return lerp(soften(x, m.w) - x, soften(y, m.h) - y, turn());
  };

  const paint = () => {
    const angle = theta.get();
    const p = clamp(shown(), 0, 100);
    const m = metrics;
    const k = turn();
    // At rest every style is a percentage, so a resize never lags; only a turn in progress uses pixels.
    before.style.clipPath = angle === 0 || !m.w ? (angle >= 45 ? `inset(0 0 ${(100 - p).toFixed(3)}% 0)` : `inset(0 ${(100 - p).toFixed(3)}% 0 0)`) : angle === 90 ? `inset(0 0 ${(100 - p).toFixed(3)}% 0)` : halfPlane(m.w, m.h, center(p, m), (angle * Math.PI) / 180);
    const pivotX = rest(angle, m) ? (angle >= 45 ? "50%" : `${shown()}%`) : `${center(shown(), m)[0]}px`;
    const pivotY = rest(angle, m) ? (angle >= 45 ? `${shown()}%` : "50%") : `${center(shown(), m)[1]}px`;
    pivot.style.transform = `translateX(${pivotX}) translateY(${pivotY})`;
    rotor.style.transform = `rotate(${angle}deg)`;
    chevrons.style.transform = `rotate(${angle}deg)`;
    const reach = offset();
    handleSlot.style.transform = `translateX(${reach * Math.cos((angle * Math.PI) / 180)}px) translateY(${reach * Math.sin((angle * Math.PI) / 180)}px)`;
    // Captions fade as the divider reaches them, and hand over mid-turn when the after caption changes corner.
    const across = clamp(1 - k * 3, 0, 1);
    const down = clamp(k * 3 - 2, 0, 1);
    if (beforeChip) beforeChip.style.opacity = String(!m.w ? across + down : across * fade((p / 100) * m.w - (INSET + m.bw + 8)) + down * fade((p / 100) * m.h - (INSET + m.bh + 8)));
    if (afterChip) afterChip.style.opacity = String(m.w ? across * fade(m.w - INSET - m.aw - 8 - (p / 100) * m.w) : across);
    if (afterBottom) afterBottom.style.opacity = String(m.w ? down * fade(m.h - INSET - m.ah - 8 - (p / 100) * m.h) : down);
  };
  for (const value of [pos, lag, theta]) value.on("change", paint);

  const measure = () => {
    metrics = { w: root.clientWidth, h: root.clientHeight, bw: beforeChip?.offsetWidth ?? 0, bh: beforeChip?.offsetHeight ?? 0, aw: afterChip?.offsetWidth ?? 0, ah: afterChip?.offsetHeight ?? 0 };
    paint();
  };
  const observer = new ResizeObserver(measure);
  [root, beforeChip, afterChip].forEach((node) => node && observer.observe(node));
  measure();

  function commit(next: number, live = false) {
    if (live && Math.round(next) === Math.round(latest)) return;
    const value = Number(next.toFixed(2));
    if (value === latest) return;
    latest = value;
    onCommit(value);
  }

  const percentAt = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    return isVertical ? ((event.clientY - rect.top) / (rect.height || 1)) * 100 : ((event.clientX - rect.left) / (rect.width || 1)) * 100;
  };
  const axisSize = () => {
    const rect = root.getBoundingClientRect();
    return (isVertical ? rect.height : rect.width) || 1;
  };
  /** Focus that follows a pointer keeps the handle quiet: no ring until a key is pressed. */
  function focusQuietly() {
    if (document.activeElement === handle) return;
    handle.dataset.quiet = "";
    handle.focus({ preventScroll: true });
  }
  const capsule = () => {
    const size = dragging ? (isVertical ? { width: 36, height: 56 } : { width: 56, height: 36 }) : { width: 40, height: 40 };
    animate(handle, size as never, (reduced ? { duration: 0 } : spring.morph) as never);
    animate(left, { x: dragging ? -4 : 0 } as never, (reduced ? { duration: 0 } : spring.morph) as never);
    animate(right, { x: dragging ? 4 : 0 } as never, (reduced ? { duration: 0 } : spring.morph) as never);
    if (dragging) root.dataset.dragging = "";
    else delete root.dataset.dragging;
  };

  function start(state: Drag, at: number) {
    const from = shown();
    state.started = true;
    state.grab = state.press ? 0 : at - from;
    lag.jump(0);
    pos.jump(from);
    dragging = true;
    capsule();
    focusQuietly();
    follow(state, at, true);
  }
  /** Puts the line under the pointer, with resistance past the edges, and commits the position once per whole percent. */
  function follow(state: Drag, at: number, first = false) {
    const raw = at - state.grab;
    const size = axisSize();
    const edge = clamp(raw, 0, 100);
    const placed = reduced ? edge : edge + (rubber(((raw - edge) / 100) * size) / size) * 100;
    state.raw = raw;
    if (first && state.press && !reduced) {
      const from = pos.get();
      pos.jump(placed);
      lag.jump(from - placed);
      animate(lag as never, 0, moveSpring as never);
    } else pos.set(placed);
    commit(edge, true);
  }

  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const onHandle = !!(event.target as HTMLElement).closest("[data-handle]");
    pressedHandle = onHandle;
    root.setPointerCapture(event.pointerId);
    const state: Drag = { pointer: event.pointerId, grab: 0, press: !onHandle, started: false, x: event.clientX, y: event.clientY, raw: 0 };
    drag = state;
    // A finger on the photo might be scrolling the page, so it waits for a sideways drag; a mouse or the handle answers at once.
    if (event.pointerType !== "touch" || onHandle) start(state, percentAt(event));
  };
  const move = (event: PointerEvent) => {
    const state = drag;
    if (!state || state.pointer !== event.pointerId) return;
    if (!state.started) {
      const along = Math.abs(isVertical ? event.clientY - state.y : event.clientX - state.x);
      const across = Math.abs(isVertical ? event.clientX - state.x : event.clientY - state.y);
      if (along < 6 && across < 6) return;
      if (across > along) {
        drag = null;
        return;
      }
      start(state, percentAt(event));
      return;
    }
    follow(state, percentAt(event));
  };
  const end = (event: PointerEvent) => {
    const state = drag;
    if (!state || state.pointer !== event.pointerId) return;
    drag = null;
    // A tap on the photo moves the divider there.
    if (!state.started) {
      if (event.type === "pointerup") {
        focusQuietly();
        commit(clamp(percentAt(event), 0, 100));
      }
      return;
    }
    // The divider stays where it was let go. Past an edge, or still catching up to a press, it springs on with the speed it had.
    const from = shown();
    const velocity = lag.getVelocity() + (from > 100 || from < 0 ? pos.getVelocity() : 0);
    const target = clamp(lag.get() !== 0 ? state.raw : from, 0, 100);
    lag.jump(0);
    pos.jump(from);
    goal = Number(target.toFixed(2));
    if (from !== target) {
      if (reduced) pos.jump(target);
      else animate(pos as never, target, { ...moveSpring, velocity } as never);
    }
    commit(target);
    dragging = false;
    capsule();
  };
  const key = (event: KeyboardEvent) => {
    const large = event.shiftKey ? 10 : 1;
    // Keys move the divider the way they point along its axis; the other two follow the value, where up and right mean more of the after image.
    const toward: Record<string, number> = isVertical ? { ArrowUp: -large, ArrowDown: large, ArrowRight: -large, ArrowLeft: large, PageUp: -10, PageDown: 10 } : { ArrowLeft: -large, ArrowRight: large, ArrowUp: -large, ArrowDown: large, PageUp: -10, PageDown: 10 };
    let next: number;
    if (event.key === "Home") next = 100;
    else if (event.key === "End") next = 0;
    else if (event.key in toward) next = Math.round(latest) + toward[event.key];
    else return;
    event.preventDefault();
    delete handle.dataset.quiet;
    const clamped = clamp(next, 0, 100);
    if (clamped === latest) {
      if (!reduced && next !== clamped) animate(pos as never, goal, { ...kickSpring, velocity: ((Math.sign(next - clamped) * BUMP_PX) / axisSize()) * 100 } as never);
      return;
    }
    commit(clamped);
  };
  const doubleClick = () => {
    if (pressedHandle && latest !== 50) commit(50);
  };
  const blur = () => delete handle.dataset.quiet;
  const prevent = (event: Event) => event.preventDefault();

  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("lostpointercapture", end);
  root.addEventListener("mousedown", prevent);
  root.addEventListener("dragstart", prevent);
  root.addEventListener("dblclick", doubleClick);
  handle.addEventListener("keydown", key);
  handle.addEventListener("blur", blur);

  return {
    /** Positions that arrive from outside a drag (props, keys, a double-click) spring the divider there. */
    setPosition(next: number) {
      current = clamp(next, 0, 100);
      latest = current;
      if (drag?.started || goal === current) return;
      goal = current;
      const from = shown();
      lag.jump(0);
      pos.jump(from);
      if (reduced) pos.jump(current);
      else animate(pos as never, current, moveSpring as never);
    },
    /** A new orientation swings the divider a quarter turn about its pivot while the clip follows it. */
    setOrientation(nextVertical: boolean) {
      isVertical = nextVertical;
      const target = nextVertical ? 90 : 0;
      if (theta.get() === target) return;
      if (reduced) theta.jump(target);
      else animate(theta as never, target, turnSpring as never);
    },
    destroy() {
      observer.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", end);
      root.removeEventListener("pointercancel", end);
      root.removeEventListener("lostpointercapture", end);
      root.removeEventListener("mousedown", prevent);
      root.removeEventListener("dragstart", prevent);
      root.removeEventListener("dblclick", doubleClick);
      handle.removeEventListener("keydown", key);
      handle.removeEventListener("blur", blur);
    },
  };
}
