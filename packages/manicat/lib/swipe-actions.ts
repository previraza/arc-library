// @manicat-dependencies motion
/**
 * The gesture and the motion of the swipe actions, for the Vue and Svelte ports: the row follows the finger by transform, the actions
 * share the revealed space, a long swipe commits the outermost action, and rows slide in and collapse away. The counterparts of
 * `SwipeActionsRow`, `ActionLayer` and the group in swipe-actions.tsx; the ports render the markup and hand the elements over.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { curveOf } from "./motion-dom";
import { motionTokens } from "./motion-tokens";

export interface SwipeActionLike {
  label: string;
  tone?: "neutral" | "accent" | "danger";
  onSelect: () => void;
  keepRow?: boolean;
}

export type Side = "leading" | "trailing";

/** What a row needs from its list: which row is open, and the rows by id so a touch inside one is not read as a touch outside. */
export interface SwipeGroup {
  openId: () => string | null;
  open: (id: string) => void;
  close: (id: string) => void;
  rows: Map<string, HTMLElement>;
}
export const swipeGroupKey = Symbol("manicat-swipe-actions");

type Drag = { pointer: number; type: string; startX: number; startY: number; origin: number; locked: "x" | "y" | null; samples: [number, number][] };

/** Width of one action while a row rests open. */
export const ACTION = 76;
/** Movement before a press is read as a swipe or handed to the page as a scroll. */
const SLOP = 8;
/** Seconds of travel projected from the release velocity, roughly a 0.99 deceleration rate. */
const PROJECTION = 0.1;
/** Release speed in px/s that counts as a flick. */
const FLICK = 900;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Past its last stop the row still follows, but every pixel costs more, like pulling against elastic. */
const rubberBand = (overshoot: number, dimension: number) => (1 - 1 / ((overshoot * 0.55) / dimension + 1)) * dimension;
const sideOf = (value: number): Side | null => (value > 0 ? "leading" : value < 0 ? "trailing" : null);

function velocityOf(samples: [number, number][]) {
  const last = samples[samples.length - 1];
  const first = samples.find((sample) => last[0] - sample[0] <= 80) ?? last;
  const elapsed = (last[0] - first[0]) / 1000;
  return elapsed > 0 ? (last[1] - first[1]) / elapsed : 0;
}

/** Closes the open row when something outside it is touched or Escape is pressed. Returns what removes the listeners. */
export function watchOutside(group: SwipeGroup, onClose: () => void) {
  const openId = group.openId();
  if (!openId) return () => {};
  const onPointerDown = (event: PointerEvent) => {
    const row = group.rows.get(openId);
    if (row && event.target instanceof Node && row.contains(event.target)) return;
    onClose();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown);
  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown);
  };
}

/** A row opens its height and fades in. Returns how long it takes (ms) and when it is done. */
export function rowEnter(row: HTMLElement, reduced: boolean) {
  if (reduced) {
    const run = animate(row, { opacity: [0, 1] }, { duration: 0.15 });
    return { ms: 150, finished: run.finished };
  }
  const previous = row.style.height;
  row.style.height = "auto";
  const natural = row.offsetHeight;
  row.style.height = previous;
  const run = animate(row, { height: ["0px", `${natural}px`], opacity: [0, 1] } as never, { height: motionTokens.spring.smooth, opacity: { duration: motionTokens.duration.standard, ease: [...motionTokens.ease.enter] } } as never);
  const finished = run.finished.then(() => (row.style.height = "auto"));
  return { ms: curveOf({ spring: "smooth" }).duration, finished };
}

/** A row collapses after its action ran: the height follows the slide away a beat later, then the last of it fades. */
export function rowLeave(row: HTMLElement, reduced: boolean) {
  if (reduced) {
    const run = animate(row, { opacity: [1, 0] }, { duration: 0.15 });
    return { ms: 150, finished: run.finished };
  }
  const height = row.getBoundingClientRect().height;
  const shrink = animate(row, { height: [`${height}px`, "0px"] } as never, { ...motionTokens.spring.smooth, delay: 0.12 } as never);
  const fade = animate(row, { opacity: [1, 0] }, { duration: motionTokens.duration.instant, delay: 0.34 });
  return { ms: Math.max(curveOf({ spring: "smooth" }).duration + 120, 340 + motionTokens.duration.instant * 1000), finished: Promise.all([shrink.finished, fade.finished]) };
}

export interface SwipeRowOptions {
  id: string;
  reduced: boolean;
  leading: () => SwipeActionLike[];
  trailing: () => SwipeActionLike[];
  fullSwipe: () => boolean;
  group: SwipeGroup;
}

export function createSwipeRow({ row, content }: { row: HTMLElement; content: HTMLElement }, options: SwipeRowOptions) {
  const { id, reduced, group } = options;
  const x = motionValue(0);
  const cover = motionValue(0);
  let covering: { side: Side; index: number } | null = null;
  let width = row.offsetWidth;
  let drag: Drag | null = null;
  let travel: AnimationPlaybackControls | null = null;
  let stretch: AnimationPlaybackControls | null = null;
  let armed = false;
  let leaving = false;
  let swallowClick = false;
  let restoreTimer = 0;

  const actionsOf = (side: Side) => (side === "leading" ? options.leading() : options.trailing());
  const openWidth = (side: Side) => actionsOf(side).length * ACTION;
  const outermost = (side: Side) => (side === "leading" ? 0 : options.trailing().length - 1);
  const canCommit = (side: Side) => options.fullSwipe() && actionsOf(side).length > 0;
  const threshold = (side: Side) => Math.max(openWidth(side) + 48, width * 0.56);

  /**
   * One revealed action. Rank 0 sits against the content and the highest rank at the row's outer edge. Every layer spans the full row and
   * slides in by transform only, so the actions share the revealed space evenly, widen together past the resting width, and the covering
   * action can stretch across the row.
   */
  function paint() {
    const value = x.get();
    const progress = cover.get();
    content.style.transform = value === 0 ? "none" : `translateX(${value}px)`;
    for (const side of ["leading", "trailing"] as const) {
      const count = actionsOf(side).length;
      const direction = side === "leading" ? 1 : -1;
      const revealed = Math.max(0, value * direction);
      const segment = revealed / count;
      for (let index = 0; index < count; index++) {
        const layer = row.querySelector<HTMLElement>(`[data-layer][data-side="${side}"][data-index="${index}"]`);
        if (!layer) continue;
        const rank = side === "leading" ? count - 1 - index : index;
        const coverRank = covering?.side === side ? (side === "leading" ? count - 1 - covering.index : covering.index) : null;
        const base = ((count - rank) * revealed) / count;
        const inset = coverRank === rank ? base + progress * (revealed - base) : coverRank !== null && rank > coverRank ? base * (1 - progress) : base;
        layer.style.transform = `translateX(${direction * inset}px)`;
        layer.style.zIndex = String(rank + 1);
        const anchor = layer.firstElementChild as HTMLElement;
        anchor.style.transform = `translateX(${-direction * (coverRank === rank ? segment / 2 + progress * (ACTION / 2 - segment / 2) : segment / 2)}px)`;
        const reveal = (start: number, span: number) => {
          const own = clamp01((segment - ACTION * start) / (ACTION * span));
          return coverRank === rank ? Math.max(own, progress) : coverRank === null ? own : own * (1 - progress);
        };
        const glyph = anchor.firstElementChild as HTMLElement;
        const icon = glyph.children[0] as HTMLElement;
        const label = glyph.children[1] as HTMLElement;
        const iconReveal = reveal(0.25, 0.55);
        icon.style.opacity = String(iconReveal);
        icon.style.transform = `scale(${0.6 + 0.4 * iconReveal})`;
        label.style.opacity = String(reveal(0.72, 0.24));
      }
    }
  }
  const stopX = x.on("change", paint);
  const stopCover = cover.on("change", paint);
  const setCovering = (next: { side: Side; index: number } | null) => {
    covering = next;
    paint();
  };

  function stretchTo(value: number) {
    stretch?.stop();
    if (reduced) return void cover.jump(value);
    stretch = animate(cover, value, motionTokens.spring.morph as never);
  }

  /** Springs the row to a stop, carrying the release velocity. Travel snaps instantly with reduced motion. */
  function settle(target: number, velocity = 0) {
    if (armed || (target !== 0 && cover.get() !== 0)) stretchTo(0);
    armed = false;
    const from = x.get();
    const home = () => {
      if (target === 0) {
        stretch?.stop();
        cover.jump(0);
      }
    };
    if (reduced) {
      x.jump(target);
      home();
    } else {
      // Heading home, the spring may not carry the row past zero, or the opposite actions would flash.
      const toward = target === 0 && Math.sign(velocity) === -Math.sign(from);
      const launch = toward ? Math.sign(velocity) * Math.min(Math.abs(velocity), Math.abs(from) * 12) : velocity;
      travel = animate(x, target, { ...(target === 0 ? motionTokens.spring.smooth : motionTokens.spring.snappy), velocity: launch, onComplete: home } as never);
    }
    if (target === 0) group.close(id);
    else group.open(id);
  }

  /** The chosen action stretches over the whole row while the row leaves in its direction; the list then closes the gap. */
  function commit(side: Side, index: number, velocity = 0) {
    const action = actionsOf(side)[index];
    if (!action || leaving) return;
    const direction = side === "leading" ? 1 : -1;
    armed = false;
    setCovering({ side, index });
    stretchTo(1);
    if (action.keepRow) {
      action.onSelect();
      settle(0, velocity);
      return;
    }
    leaving = true;
    row.dataset.removing = "";
    travel?.stop();
    const end = direction * (width + 2);
    if (reduced) x.jump(end);
    else travel = animate(x, end, { ...motionTokens.spring.smooth, velocity: Math.sign(velocity) === direction ? velocity : 0 } as never);
    group.close(id);
    action.onSelect();
    // A list that keeps the item gets its row back instead of an empty band of colour.
    window.clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(() => {
      if (!leaving) return;
      leaving = false;
      delete row.dataset.removing;
      settle(0);
    }, 1400);
  }

  function arm(value: number, pointerType: string) {
    const side = sideOf(value);
    const limit = side ? threshold(side) : Infinity;
    const next = !!side && canCommit(side) && Math.abs(value) > (armed ? limit - 20 : limit);
    if (next === armed || !side) {
      if (!side && armed) {
        armed = false;
        stretchTo(0);
      }
      return;
    }
    armed = next;
    if (next) {
      setCovering({ side, index: outermost(side) });
      if (pointerType === "touch") navigator.vibrate?.(8);
    }
    stretchTo(next ? 1 : 0);
  }

  function constrain(raw: number) {
    const side = sideOf(raw);
    if (!side) return 0;
    const dimension = width || 320;
    const limit = actionsOf(side).length === 0 ? 0 : canCommit(side) ? dimension : openWidth(side);
    const distance = Math.abs(raw);
    return Math.sign(raw) * (distance <= limit ? distance : limit + rubberBand(distance - limit, dimension));
  }

  function release(velocity: number) {
    const value = x.get();
    const side = sideOf(value);
    if (!side || actionsOf(side).length === 0) return settle(0, velocity);
    const direction = side === "leading" ? 1 : -1;
    const distance = Math.abs(value);
    const outward = velocity * direction;
    const open = openWidth(side);
    const projected = distance + outward * PROJECTION;
    const flung = distance > open && outward > FLICK && projected > threshold(side);
    // A flick back toward home cancels an armed full swipe.
    if (canCommit(side) && ((armed && outward > -FLICK) || flung)) return commit(side, outermost(side), velocity);
    settle(projected > open / 2 ? direction * open : 0, velocity);
  }

  function onPointerDown(event: PointerEvent) {
    swallowClick = false;
    if (!leaving && event.isPrimary && !(event.pointerType === "mouse" && event.button !== 0)) {
      // Catch the row mid-flight: the next move retargets from wherever it is now.
      travel?.stop();
      drag = { pointer: event.pointerId, type: event.pointerType, startX: event.clientX, startY: event.clientY, origin: x.get(), locked: null, samples: [[event.timeStamp, event.clientX]] };
    }
    // The menu button opens on click rather than on press, so a swipe that starts on it still moves the row.
    if ((event.target as Element).closest("[data-swipe-more]")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onPointerMove(event: PointerEvent) {
    const current = drag;
    if (!current || current.pointer !== event.pointerId || current.locked === "y") return;
    if (!current.locked) {
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (Math.hypot(dx, dy) < SLOP) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        current.locked = "y";
        return;
      }
      // Measure from here, so crossing the slop never jumps the row.
      current.locked = "x";
      current.startX = event.clientX;
      content.setPointerCapture(event.pointerId);
      row.dataset.dragging = "";
      group.open(id);
    }
    const value = constrain(current.origin + event.clientX - current.startX);
    x.set(value);
    current.samples.push([event.timeStamp, event.clientX]);
    if (current.samples.length > 12) current.samples.shift();
    arm(value, current.type);
  }

  function onPointerEnd(event: PointerEvent) {
    const current = drag;
    if (!current || current.pointer !== event.pointerId) return;
    drag = null;
    if (current.locked === "x") {
      swallowClick = true;
      delete row.dataset.dragging;
      current.samples.push([event.timeStamp, event.clientX]);
      return release(event.type === "pointercancel" ? 0 : velocityOf(current.samples));
    }
    // A tap on an open row closes it instead of acting on what is underneath.
    if (current.locked === null && Math.abs(x.get()) > 0.5) {
      swallowClick = true;
      settle(0);
    }
  }

  function onClickCapture(event: Event) {
    if (!swallowClick) return;
    swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  content.addEventListener("pointerdown", onPointerDown, true);
  content.addEventListener("pointermove", onPointerMove);
  content.addEventListener("pointerup", onPointerEnd);
  content.addEventListener("pointercancel", onPointerEnd);
  content.addEventListener("click", onClickCapture, true);
  group.rows.set(id, row);
  const resize = new ResizeObserver(([entry]) => (width = entry.contentRect.width));
  resize.observe(row);
  paint();

  return {
    /** Runs an action as the menu or a tap on the revealed action would. */
    commit: (side: Side, index: number) => commit(side, index),
    /** Another row opened, or someone touched outside: put this one away. */
    closeForOthers() {
      if (group.openId() !== id && !leaving && drag?.locked !== "x" && x.get() !== 0) settle(0);
    },
    /** Redraws the layers after the actions changed. */
    repaint: paint,
    /** After the menu closed on a removed row, focus goes to the next row that stays. */
    focusNeighbour() {
      const staying = (step: "nextElementSibling" | "previousElementSibling") => {
        let node = row[step];
        while (node instanceof HTMLElement && "removing" in node.dataset) node = node[step];
        return node;
      };
      const neighbour = staying("nextElementSibling") ?? staying("previousElementSibling");
      (neighbour?.querySelector<HTMLElement>("[data-swipe-more]") ?? row.parentElement)?.focus({ preventScroll: true });
    },
    destroy() {
      content.removeEventListener("pointerdown", onPointerDown, true);
      content.removeEventListener("pointermove", onPointerMove);
      content.removeEventListener("pointerup", onPointerEnd);
      content.removeEventListener("pointercancel", onPointerEnd);
      content.removeEventListener("click", onClickCapture, true);
      resize.disconnect();
      group.rows.delete(id);
      window.clearTimeout(restoreTimer);
      travel?.stop();
      stretch?.stop();
      stopX();
      stopCover();
      group.close(id);
    },
  };
}
