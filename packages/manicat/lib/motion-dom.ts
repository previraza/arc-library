// @manicat-dependencies motion
/**
 * The animations of the React components, for the Vue and Svelte ports. They are written against the DOM instead of a
 * framework, so a port only owns the element and hands it over: the same code runs the same motion in every framework, with the
 * same timings (`motion-tokens`) as the React version, which uses `motion/react`.
 */
import { animate, cubicBezier, spring } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

const ease = (name: keyof typeof motionTokens.ease) => [...motionTokens.ease[name]] as [number, number, number, number];
const blur = (px: number) => `blur(${px}px)`;
const make = (tag: "span", className: string) => {
  const node = document.createElement(tag);
  node.className = className;
  return node;
};

export interface WidthFollower {
  /** Call just before the content changes: the next resize within 700ms springs instead of jumping. */
  arm(): void;
  destroy(): void;
}

/**
 * Keeps `slot` as wide as `content`. The first measure and any resize that no change of content caused (a late web font, a parent
 * reflow) jump straight to the new width, so nothing wobbles on first paint; a resize that follows `arm()` springs.
 */
export function followWidth(slot: HTMLElement, content: HTMLElement, reduced: boolean): WidthFollower {
  let measured = false;
  let armedUntil = 0;
  let width = 0;
  let running: AnimationPlaybackControls | undefined;
  const apply = (value: number) => {
    width = value;
    slot.style.width = `${value}px`;
  };
  const observer = new ResizeObserver(([entry]) => {
    const next = entry.contentRect.width;
    running?.stop();
    if (!next || !measured || reduced || performance.now() > armedUntil) {
      measured = next > 0;
      if (next) apply(next);
      else slot.style.width = "";
      delete slot.dataset.morphing;
      return;
    }
    slot.dataset.morphing = "";
    running = animate(width, next, { ...motionTokens.spring.morph, onUpdate: apply, onComplete: () => delete slot.dataset.morphing });
  });
  observer.observe(content);
  return {
    arm() {
      armedUntil = performance.now() + 700;
    },
    destroy() {
      observer.disconnect();
      running?.stop();
    },
  };
}

export type MorphTextClasses = { morph: string; glyphs: string; glyph: string };

export interface MorphText {
  /** Morphs to the next label: shared letters stay, the changed run leaves and arrives, and the width follows on a spring. */
  set(text: string): void;
  destroy(): void;
}

/**
 * One label that turns into the next one: kept letters glide into place, new letters rise in from a soft blur, removed letters
 * float up and out, and the wrapper's width follows on a spring. The counterpart of `MorphText` in action-button.tsx.
 */
export function createMorphText(
  host: HTMLElement,
  { text, reduced, classes, arm }: { text: string; reduced: boolean; classes: MorphTextClasses; /** The letters only, with no wrapper of their own: the caller follows the width and is told when the text changes. */ arm?: () => void },
): MorphText {
  type Glyph = { char: string; node: HTMLElement };
  const row = make("span", classes.glyphs);
  const morph = arm ? undefined : make("span", classes.morph);
  if (morph) {
    morph.setAttribute("aria-hidden", "true");
    morph.append(row);
  }
  host.replaceChildren(morph ?? row);

  const build = (char: string): Glyph => {
    const node = make("span", classes.glyph);
    node.textContent = char;
    return { char, node };
  };
  let glyphs = [...text].map(build);
  row.append(...glyphs.map((glyph) => glyph.node));
  let current = text;

  const follower = morph ? followWidth(morph, row, reduced) : { arm: arm ?? (() => undefined), destroy: () => undefined };

  return {
    set(next) {
      if (next === current) return;
      current = next;
      follower.arm();

      const nextChars = [...next];
      const before = glyphs.map((glyph) => glyph.char);
      let start = 0;
      let end = 0;
      while (start < before.length && start < nextChars.length && before[start] === nextChars[start]) start++;
      while (end < before.length - start && end < nextChars.length - start && before[before.length - 1 - end] === nextChars[nextChars.length - 1 - end]) end++;
      if (start < 2) start = 0;
      if (end < 2) end = 0;

      const head = glyphs.slice(0, start);
      const tail = glyphs.slice(glyphs.length - end);
      const gone = glyphs.slice(start, glyphs.length - end);
      const added = nextChars.slice(start, nextChars.length - end).map(build);

      // First: where the letters that stay are now, and where the ones that leave are (they are taken out of the flow).
      const firstRects = new Map([...head, ...tail].map((glyph) => [glyph, glyph.node.getBoundingClientRect()]));
      for (const glyph of gone) {
        const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = glyph.node;
        Object.assign(glyph.node.style, { position: "absolute", left: `${offsetLeft}px`, top: `${offsetTop}px`, width: `${offsetWidth}px`, height: `${offsetHeight}px` });
      }

      glyphs = [...head, ...added, ...tail];
      row.replaceChildren(...glyphs.map((glyph) => glyph.node), ...gone.map((glyph) => glyph.node));

      // Last and play.
      for (const [glyph, first] of firstRects) {
        const last = glyph.node.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (!reduced && (dx || dy)) animate(glyph.node, { x: [dx, 0], y: [dy, 0] }, motionTokens.spring.morph);
      }
      added.forEach((glyph, order) => {
        if (reduced) animate(glyph.node, { opacity: [0, 1] }, { duration: motionTokens.duration.instant });
        else animate(glyph.node, { opacity: [0, 1], y: [5, 0], filter: [blur(motionTokens.blur.soft), blur(0)] }, { duration: motionTokens.duration.standard, ease: ease("enter"), delay: Math.min(order * motionTokens.stagger.char, 0.1) });
      });
      for (const glyph of gone) {
        const leave = reduced ? animate(glyph.node, { opacity: 0 }, { duration: motionTokens.duration.instant }) : animate(glyph.node, { opacity: 0, y: -4, filter: blur(motionTokens.blur.subtle) }, { duration: motionTokens.duration.fast, ease: ease("standard") });
        leave.finished.then(() => glyph.node.remove());
      }
    },
    destroy() {
      follower.destroy();
    },
  };
}

export type PhaseKind = "arrow" | "icon";

export interface PhaseSlot {
  /** Shows the content for `key`. The one on show leaves first, in the direction of the action for an arrow. */
  show(key: string, kind: PhaseKind, build: () => Element): void;
  destroy(): void;
}

/**
 * A fixed slot whose content is swapped with a short motion: an arrow slides away and returns from behind, any other icon
 * scales and blurs in on a spring. The counterpart of the icon slot in action-button.tsx.
 */
export function createPhaseSlot(slot: HTMLElement, { reduced, phaseClass }: { reduced: boolean; phaseClass: string }): PhaseSlot {
  let key: string | undefined;
  let shown: { node: HTMLElement; kind: PhaseKind } | undefined;
  const enter = { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast, ease: ease("enter") }, filter: { duration: motionTokens.duration.fast, ease: ease("enter") } };

  return {
    show(next, kind, build) {
      if (next === key) return;
      const first = key === undefined;
      key = next;
      if (shown) {
        const leaving = shown;
        if (reduced) animate(leaving.node, { opacity: 0 }, { duration: motionTokens.duration.instant }).finished.then(() => leaving.node.remove());
        else {
          const out = leaving.kind === "arrow" ? { opacity: 0, x: 8, filter: blur(motionTokens.blur.subtle) } : { opacity: 0, scale: 0.6, filter: blur(motionTokens.blur.subtle) };
          animate(leaving.node, out, { duration: motionTokens.duration.fast, ease: ease("standard") }).finished.then(() => leaving.node.remove());
        }
      }
      const node = make("span", phaseClass);
      node.append(build());
      slot.append(node);
      shown = { node, kind };
      if (first) return;
      if (reduced) animate(node, { opacity: [0, 1] }, { duration: motionTokens.duration.instant });
      else if (kind === "arrow") animate(node, { opacity: [0, 1], x: [-6, 0], filter: [blur(motionTokens.blur.subtle), blur(0)] }, enter);
      else animate(node, { opacity: [0, 1], scale: [0.6, 1], filter: [blur(motionTokens.blur.subtle), blur(0)] }, enter);
    },
    destroy() {
      slot.replaceChildren();
    },
  };
}

const svgNS = "http://www.w3.org/2000/svg";
function svg(size: number, className: string, markup: string, attributes: Record<string, string> = {}) {
  const node = document.createElementNS(svgNS, "svg");
  node.setAttribute("class", className);
  node.setAttribute("width", String(size));
  node.setAttribute("height", String(size));
  node.setAttribute("viewBox", "0 0 24 24");
  node.setAttribute("fill", "none");
  node.setAttribute("stroke", "currentColor");
  node.setAttribute("stroke-width", "2");
  node.setAttribute("stroke-linecap", "round");
  node.setAttribute("stroke-linejoin", "round");
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  node.innerHTML = markup;
  return node;
}

/** The lucide arrow-right the React components use. */
export const arrowRightIcon = (className: string, size = 17) => svg(size, className, '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />');

/** The success tick, drawing itself from its short stroke the way a hand would write it. */
export function drawnCheckIcon(className: string, reduced: boolean, size = 17) {
  const node = svg(size, className, '<path d="M4 12l5 5L20 6" />');
  const path = node.querySelector("path");
  if (path && !reduced) {
    animate(path, { pathLength: [0, 1], opacity: [0, 1] }, { pathLength: { duration: motionTokens.duration.standard, ease: ease("enter"), delay: 0.05 }, opacity: { duration: 0.05, delay: 0.05 } });
  }
  return node;
}

/**
 * Presses a button in on pointer down and springs it back, as `whileTap` does in the React version. Wide buttons give less
 * (.985 over 220px) so they do not seem to jump. Returns a function that removes the listeners.
 */
export function pressable(node: HTMLElement, { reduced, enabled, scale }: { reduced: boolean; enabled: () => boolean; /** One scale for every width, instead of the width-based default. */ scale?: number }) {
  if (reduced) return () => undefined;
  const down = () => {
    if (enabled()) animate(node, { scale: scale ?? (node.offsetWidth > 220 ? 0.985 : node.offsetWidth && node.offsetWidth <= 48 ? 0.96 : 0.97) }, { duration: motionTokens.duration.instant, ease: ease("standard") });
  };
  const up = () => {
    animate(node, { scale: 1 }, motionTokens.spring.snappy);
  };
  node.addEventListener("pointerdown", down);
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) node.addEventListener(type, up);
  return () => {
    node.removeEventListener("pointerdown", down);
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) node.removeEventListener(type, up);
  };
}

/** Takes a node out of the flow where it stands, so what replaces it takes its place at once (`mode="popLayout"` in React). */
export function popOut(node: HTMLElement) {
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = node;
  Object.assign(node.style, { position: "absolute", left: `${offsetLeft}px`, top: `${offsetTop}px`, width: `${offsetWidth}px`, height: `${offsetHeight}px`, margin: "0" });
}

/** A key that changes when the words or the elements of a label change, and not when only attributes do. */
function labelKey(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof Element)) return "";
  const name = node.tagName.toLowerCase();
  // Icons are told apart by their class (lucide names it after the icon), not only by being an svg.
  return `<${name}${name === "svg" ? node.getAttribute("class") ?? "" : ""}>${[...node.childNodes].map(labelKey).join("")}`;
}

export interface LabelSwap {
  destroy(): void;
}

/**
 * Crossfades a button's label when its content changes. The framework renders the label into `phase` as usual; this watches it,
 * and when the words or elements are different it keeps a copy of the old label, pops it out of the flow, lifts it away, and
 * rises the new one in from a soft blur while the slot's width follows on a spring. A label that only updates an attribute stays
 * in place. An icon-only label scales in instead of rising. The counterpart of `LabelPhase` in button.tsx.
 */
export function createLabelSwap(
  slot: HTMLElement,
  content: HTMLElement,
  phase: HTMLElement,
  { reduced, follower: shared, icon: alwaysIcon = false, pop = true }: { reduced: boolean; /** A width follower the caller owns, when the slot has other content that changes too. */ follower?: WidthFollower; /** The content is an icon, so it scales instead of rising. */ icon?: boolean; /** Take the old content out of the flow (a label); an icon stacked in a grid cell leaves in place. */ pop?: boolean },
): LabelSwap {
  const follower = shared ?? followWidth(slot, content, reduced);
  let key = labelKey(phase);
  const snapshot = () => ({ copy: phase.cloneNode(true) as HTMLElement, box: { left: phase.offsetLeft, top: phase.offsetTop, width: phase.offsetWidth, height: phase.offsetHeight } });
  let before = snapshot();
  const isIcon = (value: string) => alwaysIcon || !/\S/.test(value.replace(/<[^>]*>/g, ""));

  const observer = new MutationObserver(() => {
    const next = labelKey(phase);
    if (next === key) {
      before = snapshot();
      return;
    }
    const icon = isIcon(next);
    const leaving = before.copy;
    key = next;
    follower.arm();
    leaving.removeAttribute("id");
    leaving.setAttribute("aria-hidden", "true");
    if (pop) Object.assign(leaving.style, { position: "absolute", left: `${before.box.left}px`, top: `${before.box.top}px`, width: `${before.box.width}px`, height: `${before.box.height}px`, margin: "0" });
    content.append(leaving);

    if (reduced) {
      animate(leaving, { opacity: 0 }, { duration: motionTokens.duration.instant }).finished.then(() => leaving.remove());
      animate(phase, { opacity: [0, 1] }, { duration: motionTokens.duration.instant });
    } else {
      const out = icon ? { opacity: 0, scale: 0.6, filter: blur(motionTokens.blur.subtle) } : { opacity: 0, y: -3, filter: blur(motionTokens.blur.soft) };
      animate(leaving, out, { duration: motionTokens.duration.fast, ease: ease("standard") }).finished.then(() => leaving.remove());
      if (icon) animate(phase, { opacity: [0, 1], scale: [0.6, 1], filter: [blur(motionTokens.blur.subtle), blur(0)] }, { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast, ease: ease("enter") }, filter: { duration: motionTokens.duration.fast, ease: ease("enter") } });
      else animate(phase, { opacity: [0, 1], y: [4, 0], filter: [blur(motionTokens.blur.soft), blur(0)] }, { duration: motionTokens.duration.standard, ease: ease("enter") });
    }
    before = snapshot();
  });
  observer.observe(phase, { subtree: true, childList: true, characterData: true });

  return {
    destroy() {
      observer.disconnect();
      if (!shared) follower.destroy();
    },
  };
}

export interface Presence {
  /** Shows or hides the node, with its enter and exit motion. Pass `false` as the second argument to skip the motion (the first paint). */
  set(visible: boolean, motion?: boolean): void;
  destroy(): void;
}

/** An element that comes and goes: `build` makes it, `enter` and `exit` are its motion. The counterpart of an `AnimatePresence` child. */
export function createPresence(parent: HTMLElement, build: () => HTMLElement, { enter, exit }: { enter: (node: HTMLElement) => unknown; exit: (node: HTMLElement) => { finished: Promise<unknown> } }): Presence {
  let node: HTMLElement | undefined;
  return {
    set(visible, motion = true) {
      if (visible && !node) {
        node = build();
        parent.append(node);
        if (motion) enter(node);
      } else if (!visible && node) {
        const leaving = node;
        node = undefined;
        if (motion) exit(leaving).finished.then(() => leaving.remove());
        else leaving.remove();
      }
    },
    destroy() {
      node?.remove();
      node = undefined;
    },
  };
}

/** The motion of the loader of a button: it scales in on a spring and out a little smaller. */
export const loaderMotion = (reduced: boolean) => ({
  enter: (node: HTMLElement) =>
    reduced
      ? animate(node, { opacity: [0, 1] }, { duration: motionTokens.duration.instant })
      : animate(node, { opacity: [0, 1], scale: [0.6, 1] }, { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast, ease: ease("enter") } }),
  exit: (node: HTMLElement) =>
    reduced
      ? animate(node, { opacity: 0 }, { duration: motionTokens.duration.instant })
      : animate(node, { opacity: 0, scale: 0.8, filter: blur(motionTokens.blur.subtle) }, { duration: motionTokens.duration.fast, ease: ease("standard") }),
});

/* ------------------------------------------------------------------------------------------------------------------
 * Poses: the same enter and exit motion for a framework that animates with its own transitions (Vue's <Transition>, Svelte's
 * `in:` and `out:`) as for the helpers above. A pose is where a node rests or where it comes from and goes to.
 * ---------------------------------------------------------------------------------------------------------------- */

export type Pose = { opacity?: number; x?: number; y?: number; scale?: number; blur?: number };

/** How a pose is reached: a tween with an ease, or a spring (with its own tween for opacity and blur, so blur never overshoots). */
export type Timing = { duration: number; ease?: "enter" | "exit" | "standard" | "inOut"; delay?: number } | { spring: keyof typeof motionTokens.spring; fade?: number; delay?: number };

const keyframesOf = (from: Pose, to: Pose) => {
  const out: Record<string, unknown[]> = {};
  for (const key of ["opacity", "x", "y", "scale"] as const) if (from[key] !== undefined || to[key] !== undefined) out[key] = [from[key] ?? (key === "scale" || key === "opacity" ? 1 : 0), to[key] ?? (key === "scale" || key === "opacity" ? 1 : 0)];
  if (from.blur !== undefined || to.blur !== undefined) out.filter = [blur(from.blur ?? 0), blur(to.blur ?? 0)];
  return out;
};

const optionsOf = (timing: Timing) =>
  "spring" in timing
    ? { ...motionTokens.spring[timing.spring], delay: timing.delay, opacity: { duration: timing.fade ?? motionTokens.duration.fast, ease: ease("enter") }, filter: { duration: timing.fade ?? motionTokens.duration.fast, ease: ease("enter") } }
    : { duration: timing.duration, delay: timing.delay, ease: ease(timing.ease ?? "standard") };

/** Moves a node from one pose to another. */
export function playPose(node: Element, from: Pose, to: Pose, timing: Timing) {
  return animate(node, keyframesOf(from, to) as never, optionsOf(timing) as never);
}

/** The curve of a timing as a function of progress, for engines that drive the animation themselves (Svelte transitions). */
export function curveOf(timing: Timing): { duration: number; easing: (t: number) => number } {
  if ("spring" in timing) {
    const generator = spring({ keyframes: [0, 1], ...(motionTokens.spring[timing.spring] as object) } as never);
    const samples: number[] = [];
    let ms = 0;
    for (;;) {
      const step = generator.next(ms);
      samples.push(step.value as number);
      if (step.done || ms > 4000) break;
      ms += 16;
    }
    const duration = ms || 1;
    return { duration, easing: (t) => samples[Math.min(samples.length - 1, Math.round(t * (samples.length - 1)))] };
  }
  return { duration: timing.duration * 1000, easing: cubicBezier(...ease(timing.ease ?? "standard")) };
}

/**
 * A Svelte transition between two poses: `in:poseTransition(from, rest, timing)` or `out:poseTransition(gone, rest, timing)`.
 * Svelte passes progress 0 to 1 for an `in:` and 1 to 0 for an `out:`, so in both the off-screen pose is `from` and the resting pose is `to`.
 */
export function poseTransition(from: Pose, to: Pose, timing: Timing, { pop = false }: { pop?: boolean } = {}) {
  return (node: HTMLElement) => {
    if (pop) popOut(node);
    const { duration, easing } = curveOf(timing);
    const lerp = (a: number | undefined, b: number | undefined, fallback: number, t: number) => (a ?? fallback) + ((b ?? fallback) - (a ?? fallback)) * t;
    return {
      duration,
      delay: "delay" in timing && timing.delay ? timing.delay * 1000 : 0,
      easing,
      css: (t: number) => {
        const opacity = lerp(from.opacity, to.opacity, 1, t);
        const x = lerp(from.x, to.x, 0, t);
        const y = lerp(from.y, to.y, 0, t);
        const scale = lerp(from.scale, to.scale, 1, t);
        const filter = lerp(from.blur, to.blur, 0, t);
        return `opacity: ${opacity}; transform: translate(${x}px, ${y}px) scale(${scale});${from.blur !== undefined || to.blur !== undefined ? ` filter: blur(${filter}px);` : ""}`;
      },
    };
  };
}

/** `use:pressAction` for Svelte: presses the node in on pointer down, as `whileTap` does. */
export function pressAction(node: HTMLElement, options: { scale?: number } = {}) {
  const release = pressable(node, { reduced: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches, enabled: () => true, scale: options.scale });
  return { destroy: release };
}

/** Opens or closes a node along one axis between 0 and its natural size, so what is next to it slides instead of jumping. */
export function animateSize(node: HTMLElement, axis: "width" | "height", direction: "open" | "close", timing: Timing) {
  const natural = (() => {
    const previous = node.style[axis];
    node.style[axis] = "auto";
    const size = axis === "width" ? node.offsetWidth : node.offsetHeight;
    node.style[axis] = previous;
    return size;
  })();
  const [from, to] = direction === "open" ? [0, natural] : [node.getBoundingClientRect()[axis], 0];
  const run = animate(node, { [axis]: [`${from}px`, `${to}px`] } as never, optionsOf(timing) as never);
  if (direction === "open") run.finished.then(() => (node.style[axis] = "auto"));
  return run;
}

/**
 * A Svelte transition that opens or closes a node along one axis while it fades and scales, so the nodes next to it slide
 * instead of jumping: `in:sizeTransition("width", timing, { opacity: 0, scale: 0.9 })`.
 */
export function sizeTransition(axis: "width" | "height", timing: Timing, from: Pose = {}) {
  return (node: HTMLElement) => {
    const natural = axis === "width" ? node.offsetWidth : node.offsetHeight;
    const { duration, easing } = curveOf(timing);
    return {
      duration,
      easing,
      css: (t: number) => {
        const opacity = (from.opacity ?? 1) + (1 - (from.opacity ?? 1)) * t;
        const scale = (from.scale ?? 1) + (1 - (from.scale ?? 1)) * t;
        return `${axis}: ${natural * t}px; opacity: ${opacity}; transform: scale(${scale});`;
      },
    };
  };
}

let eyes = 0;

/**
 * The eye of a password field: one eye that a slash draws across, cutting the outline beneath it, instead of swapping two icons.
 * The counterpart of `EyeMorph` in password-field.tsx.
 */
export function createEyeMorph(host: HTMLElement, { slashed, reduced }: { slashed: boolean; reduced: boolean }) {
  const mask = `eye-${++eyes}`;
  host.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <mask id="${mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="white" stroke="none" /><path class="cut" d="M2 2l20 20" stroke="black" stroke-width="5" /></mask>
    <g mask="url(#${mask})"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></g>
    <path class="slash" d="M2 2l20 20" />
  </svg>`;
  const paths = [...host.querySelectorAll<SVGPathElement>(".cut, .slash")];
  const apply = (on: boolean, animated: boolean) => {
    for (const path of paths) {
      const target = { pathLength: on ? 1 : 0, opacity: on ? 1 : 0 };
      if (!animated || reduced) animate(path, target, { duration: 0 });
      else animate(path, target, { pathLength: { duration: motionTokens.duration.standard, ease: ease("standard") }, opacity: { duration: motionTokens.duration.instant } } as never);
    }
  };
  apply(slashed, false);
  return { set: (next: boolean) => apply(next, true) };
}
