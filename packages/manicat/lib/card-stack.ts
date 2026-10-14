// @manicat-dependencies motion
/**
 * The cards of the card stack, for the Vue and Svelte ports: dragging and flicking the top card with a tilt that follows the hand, the
 * cards behind rising as it leaves, the throw, and the way back from undo and start over. It drives the DOM frame by frame the way the
 * motion values of card-stack.tsx do; a port renders the markup and hands the elements over.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";
import { motionTokens } from "./motion-tokens";

export type CardDecision = "left" | "right";
export type Point = { x: number; y: number };
export type Exit = Point & { tilt: number };
export type Return = Exit & { delay: number };

/** Cards rendered in the stack. The last one waits invisibly one step behind and fades in as it rises. */
export const VISIBLE = 4;
/** How far each card behind peeks out below the one in front, and how much smaller it is. */
const PEEK = 12;
const SHRINK = 0.05;
/** How far the cards behind rise while the top card is dragged away, in stack steps. */
const LIFT = 0.4;
/** Drag distance at which the cards behind have fully risen. */
const LIFT_DISTANCE = 160;
/** Degrees of rotation per pixel of horizontal travel. */
const ROTATE = 0.065;
/** A release faster than this (px/s) throws the card even when it has only moved a little. */
export const FLICK = 500;

/** Vertical travel is not a decision, so past a small free zone it resists like a rubber band. */
const FREE_Y = 48;
const STRETCH_Y = 140;
const resistY = (raw: number) => {
  const distance = Math.abs(raw);
  return distance <= FREE_Y ? raw : Math.sign(raw) * (FREE_Y + (1 - 1 / (((distance - FREE_Y) * 0.55) / STRETCH_Y + 1)) * STRETCH_Y);
};
const unresistY = (shown: number) => {
  const distance = Math.abs(shown);
  if (distance <= FREE_Y) return shown;
  const stretch = Math.min(distance - FREE_Y, STRETCH_Y - 1);
  return Math.sign(shown) * (FREE_Y + ((1 / (1 - stretch / STRETCH_Y) - 1) * STRETCH_Y) / 0.55);
};
export const clampUnit = (value: number) => Math.min(1, Math.max(0, value));
const throwSpring = { type: "spring", visualDuration: 0.5, bounce: 0 } as const;
const fadeOut = { duration: 0.22, delay: 0.12, ease: [...motionTokens.ease.standard] } as const;
export const reducedFade = { duration: 0.15, ease: "linear" } as const;

/** The progress of the top card's travel, shared by the cards behind it. */
export const createLift = () => motionValue(0);

function velocityOf(samples: { t: number; x: number; y: number }[], now: number): Point {
  const recent = samples.filter((sample) => now - sample.t <= 80);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (!first || !last || first === last || now - last.t > 60) return { x: 0, y: 0 };
  const seconds = (last.t - first.t) / 1000;
  return { x: (last.x - first.x) / seconds, y: (last.y - first.y) / seconds };
}

export interface StackCardState {
  depth: number;
  decision: CardDecision | null;
  returnFrom?: Return;
  interactive: boolean;
}

export interface StackCardOptions {
  id: string;
  reduced: boolean;
  lift: MotionValue<number>;
  state: () => StackCardState;
  /** The velocity a drag released this card with, if it was thrown by a drag. */
  fling: (id: string) => Point | undefined;
  /** Returns true when the release decided the card. */
  onRelease: (id: string, offset: Point, velocity: Point, width: number) => boolean;
  onThrown: (id: string, exit: Exit) => void;
  onGone: (id: string) => void;
}

export function createStackCard({ slot, card }: { slot: HTMLElement; card: HTMLElement }, options: StackCardOptions) {
  const { id, reduced, lift } = options;
  const start = options.state();
  // A card brought back by undo starts where it left the screen; with reduced motion it simply fades in at home.
  const travel = start.returnFrom && !reduced ? start.returnFrom : undefined;
  const x = motionValue(travel?.x ?? 0);
  const y = motionValue(travel?.y ?? 0);
  const tilt = motionValue(travel?.tilt ?? 1);
  const opacity = motionValue(start.returnFrom ? 0 : 1);
  // Depth springs toward its slot; while the top card is dragged away, the cards behind already start to rise.
  const depthTarget = () => {
    const { depth } = options.state();
    return depth - (depth > 0 ? lift.get() * LIFT : 0);
  };
  const depthSpring = motionValue(depthTarget());
  let depthRun: AnimationPlaybackControls | undefined;
  let drag: { ox: number; oy: number; samples: { t: number; x: number; y: number }[] } | null = null;
  let settled = !start.returnFrom;
  let wasDecided = false;
  let lastDecision: CardDecision | null | undefined;
  // A card flying home from undo or start over leaves the stack alone: the cards behind make room in one motion instead of
  // pausing half-risen until it lands. Grabbing it mid-flight hands the stack back to the drag.
  let homing = false;
  const shade = card.querySelector<HTMLElement>("[data-shade]");
  const stamps = { right: card.querySelector<HTMLElement>('[data-stamp="right"]'), left: card.querySelector<HTMLElement>('[data-stamp="left"]') };

  const shown = () => (reduced ? depthTarget() : depthSpring.get());
  const interpolate = (value: number, from: number, to: number, a: number, b: number) => a + (b - a) * clampUnit((value - from) / (to - from));

  function paintSlot() {
    const value = shown();
    slot.style.transform = `translateY(${value * PEEK}px) scale(${1 - value * SHRINK})`;
    slot.style.opacity = String(interpolate(value, VISIBLE - 2, VISIBLE - 1, 1, 0));
    if (shade) shade.style.opacity = String(interpolate(value, 0, 2, 0, 1));
  }
  function paintCard() {
    card.style.transform = `translateX(${x.get()}px) translateY(${y.get()}px) rotate(${x.get() * ROTATE * tilt.get()}deg)`;
    card.style.opacity = String(opacity.get());
    if (stamps.right) stamps.right.style.opacity = String(interpolate(x.get(), 16, 96, 0, 1));
    if (stamps.left) stamps.left.style.opacity = String(interpolate(x.get(), -96, -16, 1, 0));
  }
  const retarget = () => {
    if (reduced) return paintSlot();
    depthRun?.stop();
    depthRun = animate(depthSpring, depthTarget(), { ...motionTokens.spring.smooth, velocity: depthSpring.getVelocity() } as never);
  };

  const stops = [
    x.on("change", paintCard),
    y.on("change", paintCard),
    tilt.on("change", paintCard),
    opacity.on("change", paintCard),
    depthSpring.on("change", paintSlot),
    lift.on("change", retarget),
    // The top card reports how far it has travelled, so the stack behind responds to the drag and the throw.
    x.on("change", () => report()),
    y.on("change", () => report()),
  ];
  function report() {
    if (options.state().interactive && !homing) lift.set(clampUnit(Math.hypot(x.get(), y.get() * 0.5) / LIFT_DISTANCE));
  }

  /** Run after the card's props changed: it follows its depth and, when the decision changed, throws the card or brings it home. */
  function update() {
    const { decision, returnFrom } = options.state();
    if (lastDecision !== undefined && decision === lastDecision) {
      retarget();
      return;
    }
    const first = lastDecision === undefined;
    lastDecision = decision;
    if (decision) {
      // A key or button can decide the card mid-drag; the throw takes over from the finger.
      drag = null;
      homing = false;
      card.removeAttribute("data-dragging");
      wasDecided = true;
      const direction = decision === "right" ? 1 : -1;
      const width = card.offsetWidth || 320;
      const cx = x.get();
      const cy = y.get();
      // Buttons and keys throw with a default flick; a drag keeps the finger's velocity.
      const velocity = options.fling(id) ?? { x: direction * 900, y: -120 };
      const speed = Math.hypot(velocity.x, velocity.y);
      // Leave along the flick when it heads the chosen way, otherwise along the drag, otherwise straight out.
      let ux = velocity.x;
      let uy = velocity.y;
      if (speed < 200 || Math.sign(ux) !== direction) {
        ux = Math.abs(cx) > 8 ? cx : direction;
        uy = Math.abs(cx) > 8 ? cy * 0.5 : -0.12;
      }
      const length = Math.hypot(ux, uy) || 1;
      ux /= length;
      uy /= length;
      if (Math.abs(ux) < 0.45) {
        ux = direction * 0.45;
        uy = Math.sign(uy || -1) * Math.sqrt(1 - 0.45 * 0.45);
      }
      // Far enough to clear a typical preview or card column; the fade finishes before the spring does.
      const reach = width * 1.6;
      const exit = { x: cx + ux * reach, y: cy + uy * reach, tilt: tilt.get() };
      options.onThrown(id, exit);
      if (reduced) {
        animate(opacity, 0, { ...reducedFade, onComplete: () => options.onGone(id) });
        return;
      }
      animate(x, exit.x, { ...throwSpring, velocity: velocity.x } as never);
      animate(y, exit.y, { ...throwSpring, velocity: velocity.y } as never);
      animate(opacity, 0, { ...fadeOut, onComplete: () => options.onGone(id) } as never);
      return;
    }
    retarget();
    // Undo, or a first mount from where the card left: come back from there, catching any flight in progress.
    if (!wasDecided && settled) return;
    void first;
    wasDecided = false;
    settled = true;
    const delay = returnFrom?.delay ?? 0;
    if (reduced) {
      x.jump(0);
      y.jump(0);
      animate(opacity, 1, { ...reducedFade, delay });
      return;
    }
    homing = true;
    animate(x, 0, { ...motionTokens.spring.smooth, delay, onComplete: () => (homing = false) } as never);
    animate(y, 0, { ...motionTokens.spring.smooth, delay } as never);
    animate(opacity, 1, { duration: motionTokens.duration.fast, delay, ease: [...motionTokens.ease.enter] });
  }

  function down(event: PointerEvent) {
    if (!options.state().interactive || event.button !== 0 || !event.isPrimary) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea, [role='button']")) return;
    x.stop();
    y.stop();
    homing = false;
    // Grabbing the top half tips the card the way the hand moves; grabbing the bottom half tips it the other way.
    if (Math.abs(x.get()) < 2) {
      const rect = card.getBoundingClientRect();
      tilt.set(event.clientY < rect.top + rect.height / 2 ? 1 : -1);
    }
    drag = { ox: event.clientX - x.get(), oy: event.clientY - unresistY(y.get()), samples: [{ t: event.timeStamp, x: event.clientX, y: event.clientY }] };
    card.setPointerCapture(event.pointerId);
    card.setAttribute("data-dragging", "");
  }
  function move(event: PointerEvent) {
    const state = drag;
    if (!state || !options.state().interactive) return;
    x.set(event.clientX - state.ox);
    y.set(resistY(event.clientY - state.oy));
    state.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    if (state.samples.length > 12) state.samples.shift();
  }
  function up(event: PointerEvent) {
    const state = drag;
    drag = null;
    card.removeAttribute("data-dragging");
    if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
    if (!state || !options.state().interactive) return;
    const velocity = event.type === "pointercancel" ? { x: 0, y: 0 } : velocityOf(state.samples, event.timeStamp);
    if (options.onRelease(id, { x: x.get(), y: y.get() }, velocity, card.offsetWidth)) return;
    // Below the threshold the card springs home, keeping the release velocity so it settles instead of stopping dead.
    if (reduced) {
      x.jump(0);
      y.jump(0);
      return;
    }
    animate(x, 0, { ...motionTokens.spring.morph, velocity: velocity.x } as never);
    animate(y, 0, { ...motionTokens.spring.morph, velocity: velocity.y } as never);
  }
  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
  paintSlot();
  paintCard();

  return {
    update,
    destroy() {
      card.removeEventListener("pointerdown", down);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerup", up);
      card.removeEventListener("pointercancel", up);
      depthRun?.stop();
      x.stop();
      y.stop();
      stops.forEach((stop) => stop());
    },
  };
}
