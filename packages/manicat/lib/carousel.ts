// @manicat-dependencies motion
/**
 * The motion of the carousel, for the Vue and Svelte ports: dragging and flicking with momentum, rubber-banding at the edges, a trackpad
 * swipe, the arrow keys, and rotation with a draining indicator. It drives the track, the slides and the indicators straight through the
 * DOM, frame by frame, the way the motion values of carousel.tsx do, so a port only renders the markup and hands the elements over.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";
import { motionTokens } from "./motion-tokens";

/** Movement before a press is read as a drag or handed to the page as a vertical scroll. */
const SLOP = 6;
/** Release speed in px/s that always moves at least one slide. */
const FLICK = 360;
/** Width of a resting dot and of the active pill, in px. */
const DOT = 6;
const PILL = 22;
/** Scale and opacity of a slide one full step from the center. */
const SCALE = 0.9;
const DIM = 0.5;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const defaultSlideLabel = (index: number, count: number) => `${index + 1} of ${count}`;
/** Momentum projection with a paging deceleration rate: where a flick would come to rest. */
const project = (velocity: number, rate = 0.995) => ((velocity / 1000) * rate) / (1 - rate);
/** Past an edge every pixel costs more, like pulling against elastic. */
const rubber = (overshoot: number, dimension: number) => (overshoot * dimension * 0.55) / (dimension + 0.55 * overshoot);
const unrubber = (distance: number, dimension: number) => (distance * dimension) / (0.55 * Math.max(1, dimension - distance));

function velocityOf(samples: [number, number][], now: number) {
  const recent = samples.filter(([time]) => now - time <= 90);
  if (recent.length < 2 || now - recent[recent.length - 1][0] > 50) return 0;
  const [firstTime, firstX] = recent[0];
  const [lastTime, lastX] = recent[recent.length - 1];
  return lastTime > firstTime ? (lastX - firstX) / ((lastTime - firstTime) / 1000) : 0;
}

type Drag = { pointer: number; startX: number; startY: number; origin: number; from: number; locked: "x" | "y" | null; caught: boolean; samples: [number, number][] };

export interface CarouselParts {
  root: HTMLElement;
  viewport: HTMLElement;
  track: HTMLElement;
}

export interface CarouselOptions {
  reduced: boolean;
  /** Read at each use, so the controller follows the props and the slots as they change. */
  count: () => number;
  index: () => number;
  interval: () => number | undefined;
  canRotate: () => boolean;
  autoplay: boolean;
  /** The slide changed: set the index (when it is not controlled) and tell the parent. */
  change: (index: number) => void;
  announce: (text: string) => void;
  label: (index: number) => string;
  onPlaying: (playing: boolean) => void;
  onDragging: (dragging: boolean) => void;
}

export function createCarousel({ root, viewport, track }: CarouselParts, options: CarouselOptions) {
  const { reduced } = options;
  const slides = () => [...track.children] as HTMLElement[];
  const tabs = () => [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
  const last = () => Math.max(0, options.count() - 1);

  const x = motionValue(0);
  const progress = motionValue(options.index());
  let drains: MotionValue<number>[] = [];
  let unsubscribeDrains: (() => void)[] = [];
  const metrics = { step: 0, width: 0 };
  let target = options.index();
  let travel: AnimationPlaybackControls | null = null;
  let drag: Drag | null = null;
  const wheel = { active: false, raw: 0, timer: 0 };
  let swallowClick = false;
  let playing = options.autoplay;
  let hovered = false;
  let focusPaused = false;
  let dragging = false;
  let inView = true;
  let pageVisible = true;
  let drainRun: AnimationPlaybackControls | undefined;
  let signature = "";
  let boundCount = -1;

  const running = () => options.canRotate() && playing && !hovered && !focusPaused && !dragging && inView && pageVisible;
  const bounds = () => ({ min: -last() * metrics.step, max: 0 });
  const band = (raw: number) => {
    const { min, max } = bounds();
    const size = metrics.width || 1;
    return raw > max ? max + rubber(raw - max, size) : raw < min ? min - rubber(min - raw, size) : raw;
  };
  const unband = (shown: number) => {
    const { min, max } = bounds();
    const size = metrics.width || 1;
    return shown > max ? max + unrubber(shown - max, size) : shown < min ? min - unrubber(min - shown, size) : shown;
  };

  /** Slides shrink and dim with their distance from the center, and the indicators grow toward a pill as the track nears them. */
  function render(position: number) {
    const count = options.count();
    slides().forEach((slide, i) => {
      const distance = Math.min(1, Math.abs(position - i));
      slide.style.transform = `scale(${1 - (1 - SCALE) * distance})`;
      slide.style.opacity = String(1 - (1 - DIM) * distance);
    });
    tabs().forEach((tab, i) => {
      const emphasis = Math.max(0, 1 - Math.abs(clamp(position, 0, Math.max(0, count - 1)) - i));
      const dot = tab.firstElementChild as HTMLElement | null;
      if (!dot) return;
      dot.style.width = `${DOT + (PILL - DOT) * emphasis}px`;
      (dot.firstElementChild as HTMLElement).style.opacity = String(emphasis);
    });
  }

  /** One drain per indicator, so a pill that just ran out keeps its state while it shrinks away. */
  function bindDrains() {
    unsubscribeDrains.forEach((stop) => stop());
    drains = Array.from({ length: options.count() }, () => motionValue(0));
    unsubscribeDrains = drains.map((drain, i) => {
      const paint = (value: number) => {
        const fill = (tabs()[i]?.firstElementChild?.lastElementChild ?? null) as HTMLElement | null;
        if (fill) fill.style.transform = `scaleX(${value})`;
      };
      paint(0);
      return drain.on("change", paint);
    });
    boundCount = options.count();
  }

  /** Springs the track to a slide from wherever it is, carrying any velocity it already has. */
  function glide(to: number, velocity = 0) {
    const { step } = metrics;
    travel?.stop();
    travel = null;
    if (!step) return;
    if (reduced) return void x.jump(-to * step);
    travel = animate(x, -to * step, { ...motionTokens.spring.smooth, velocity } as never);
  }

  function select(to: number, { velocity = 0, announce = true }: { velocity?: number; announce?: boolean } = {}) {
    const next = clamp(to, 0, last());
    target = next;
    glide(next, velocity);
    if (next === options.index()) return;
    options.change(next);
    if (announce) options.announce(options.label(next));
  }

  function measure() {
    const [first, second] = [...track.children] as HTMLElement[];
    if (!first) return;
    // Centers are unaffected by each slide's scale, and rects keep the sub-pixel step that offsetLeft would round away.
    const center = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    const step = second ? center(second) - center(first) : first.offsetWidth;
    const changed = step !== metrics.step;
    metrics.step = step;
    metrics.width = viewport.clientWidth;
    // The start slide is placed with CSS until now; from here on the motion value owns the track.
    track.dataset.measured = "";
    if (changed && !drag) {
      travel?.stop();
      travel = null;
      x.jump(-target * step);
      progress.set(target);
    }
  }

  function rotate() {
    drainRun?.stop();
    drainRun = undefined;
    const interval = options.interval();
    if (!running() || !interval) return;
    const drain = drains[options.index()];
    if (!drain) return;
    drainRun = animate(drain, 1, {
      duration: ((1 - drain.get()) * interval) / 1000,
      ease: "linear",
      onComplete: () => select(options.index() >= last() ? 0 : options.index() + 1, { announce: false }),
    });
  }

  /** Runs the rotation again only when something it depends on has changed. */
  function reevaluate() {
    const next = `${running()}|${options.index()}|${options.interval()}|${options.count()}`;
    if (next === signature) return;
    signature = next;
    rotate();
  }

  const stopX = x.on("change", (value) => {
    track.style.transform = value === 0 ? "none" : `translateX(${value}px)`;
    const { step } = metrics;
    if (!step) return;
    const position = -value / step;
    progress.set(position);
    drains.forEach((drain, i) => {
      if (i !== target && Math.abs(position - i) >= 1 && drain.get() !== 0) drain.jump(0);
    });
  });
  const stopProgress = progress.on("change", render);

  function slideAt(clientX: number) {
    const hit = slides().findIndex((node) => {
      const rect = node.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right;
    });
    return hit < 0 ? null : hit;
  }

  const setDragging = (value: boolean) => {
    dragging = value;
    options.onDragging(value);
    reevaluate();
  };

  // A horizontal trackpad swipe moves the track 1:1 and settles on the nearest slide once the swipe, including its momentum, ends.
  function onWheel(event: WheelEvent) {
    if (options.count() < 2 || drag || !metrics.step) return;
    if (!wheel.active && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (!wheel.active) {
      wheel.active = true;
      travel?.stop();
      travel = null;
      wheel.raw = unband(x.get());
    }
    wheel.raw -= event.deltaX * (event.deltaMode === 1 ? 16 : 1);
    x.set(band(wheel.raw));
    window.clearTimeout(wheel.timer);
    wheel.timer = window.setTimeout(() => {
      wheel.active = false;
      select(Math.round(-x.get() / metrics.step), { velocity: x.getVelocity() });
    }, 120);
  }

  function onPointerDown(event: PointerEvent) {
    if (options.count() < 2 || drag || !metrics.step || (event.pointerType === "mouse" && event.button !== 0)) return;
    swallowClick = false;
    // Touching a visibly moving track catches it where it is, the way a hand stops a spinning wheel. A settling tail is left alone so a tap still selects.
    const caught = travel !== null && x.isAnimating() && Math.abs(x.get() + target * metrics.step) > 12;
    if (caught) {
      travel?.stop();
      travel = null;
    }
    drag = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, origin: 0, from: target, locked: null, caught, samples: [] };
  }

  function onPointerMove(event: PointerEvent) {
    const current = drag;
    if (!current || current.pointer !== event.pointerId) return;
    if (!current.locked) {
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        current.locked = "y";
        return;
      }
      // The slop is consumed rather than applied, so the track starts moving from the finger without a jump.
      current.locked = "x";
      travel?.stop();
      travel = null;
      current.startX = event.clientX;
      current.origin = unband(x.get());
      viewport.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    if (current.locked !== "x") return;
    x.set(band(current.origin + event.clientX - current.startX));
    current.samples.push([event.timeStamp, event.clientX]);
    if (current.samples.length > 16) current.samples.shift();
  }

  function finish(event: PointerEvent, cancelled: boolean) {
    const current = drag;
    if (!current || current.pointer !== event.pointerId) return;
    drag = null;
    const { step } = metrics;
    if (current.locked === "x") {
      swallowClick = true;
      setDragging(false);
      const velocity = cancelled ? 0 : velocityOf(current.samples, event.timeStamp);
      // The landing slide comes from where the flick would carry the track, not from where the finger let go.
      let to = Math.round(-(x.get() + project(velocity)) / step);
      if (Math.abs(velocity) > FLICK) {
        const direction = velocity < 0 ? 1 : -1;
        if ((to - current.from) * direction < 1) to = current.from + direction;
      }
      // Inside the bounds the track moves 1:1 with the pointer, so the sampled release speed carries into the spring even when the
      // last move landed a frame early. Past an edge, the banded value speed is the true one.
      const { min, max } = bounds();
      const shown = x.get();
      select(to, { velocity: shown >= min && shown <= max ? velocity : x.getVelocity() });
    } else if (current.caught) {
      swallowClick = true;
      select(Math.round(-x.get() / step));
    } else if (!cancelled && current.locked === null) {
      const hit = slideAt(event.clientX);
      if (hit !== null && hit !== target) {
        swallowClick = true;
        select(hit);
      }
    } else if (cancelled) {
      select(target);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || options.count() < 2) return;
    const node = event.target as HTMLElement;
    if (node.closest("input, textarea, select, [contenteditable]")) return;
    const from = target;
    const to = event.key === "ArrowLeft" ? from - 1 : event.key === "ArrowRight" ? from + 1 : event.key === "Home" ? 0 : event.key === "End" ? last() : null;
    if (to === null) return;
    event.preventDefault();
    const next = clamp(to, 0, last());
    select(next);
    if (node.getAttribute("role") === "tab") tabs()[next]?.focus({ preventScroll: true });
    else if (track.contains(node)) viewport.focus({ preventScroll: true });
  }

  const onFocusIn = (event: FocusEvent) => {
    const node = event.target as HTMLElement;
    focusPaused = node !== root.querySelector("[data-play]") && node.matches(":focus-visible");
    reevaluate();
  };
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      focusPaused = false;
      reevaluate();
    }
  };
  const onEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    hovered = true;
    reevaluate();
  };
  const onLeave = () => {
    hovered = false;
    reevaluate();
  };
  const onClickCapture = (event: Event) => {
    if (!swallowClick) return;
    event.preventDefault();
    event.stopPropagation();
    swallowClick = false;
  };
  const onDragStart = (event: Event) => event.preventDefault();
  const up = (event: PointerEvent) => finish(event, false);
  const cancel = (event: PointerEvent) => finish(event, true);

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", up);
  viewport.addEventListener("pointercancel", cancel);
  viewport.addEventListener("pointerenter", onEnter);
  viewport.addEventListener("pointerleave", onLeave);
  viewport.addEventListener("click", onClickCapture, true);
  viewport.addEventListener("dragstart", onDragStart);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);

  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
  resize?.observe(viewport);
  let visible: IntersectionObserver | null = null;
  const onVisibility = () => {
    pageVisible = document.visibilityState !== "hidden";
    reevaluate();
  };
  if (options.interval()) {
    visible = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      reevaluate();
    });
    visible?.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
  }

  bindDrains();
  measure();
  render(progress.get());
  reevaluate();

  return {
    /** Call after the markup or the props changed: it rebinds the indicators, follows the index and restarts rotation when needed. */
    sync() {
      if (boundCount !== options.count()) bindDrains();
      measure();
      render(progress.get());
      const index = options.index();
      if (target !== index) {
        target = index;
        glide(index);
      }
      reevaluate();
    },
    select,
    /** The slide the track is heading for, which is ahead of the index while a spring runs. */
    target: () => target,
    toggleRotation() {
      const drain = drains[options.index()];
      if (!playing) {
        playing = true;
        options.onPlaying(true);
        return reevaluate();
      }
      playing = false;
      options.onPlaying(false);
      reevaluate();
      // Pausing refills the pill: this slide stays until the viewer moves on.
      if (drain) {
        if (reduced) drain.jump(0);
        else animate(drain, 0, { duration: motionTokens.duration.standard, ease: [...motionTokens.ease.standard] } as never);
      }
    },
    destroy() {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", cancel);
      viewport.removeEventListener("pointerenter", onEnter);
      viewport.removeEventListener("pointerleave", onLeave);
      viewport.removeEventListener("click", onClickCapture, true);
      viewport.removeEventListener("dragstart", onDragStart);
      viewport.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(wheel.timer);
      resize?.disconnect();
      visible?.disconnect();
      drainRun?.stop();
      travel?.stop();
      stopX();
      stopProgress();
      unsubscribeDrains.forEach((stop) => stop());
    },
  };
}

/** The icon swap of the play control, shared by both ports: scale and blur in on a spring, and out a little faster. */
export const playIcon = {
  from: { opacity: 0, scale: 0.6, blur: motionTokens.blur.subtle },
  rest: { opacity: 1, scale: 1, blur: 0 },
};
