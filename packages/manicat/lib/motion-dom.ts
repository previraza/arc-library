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
  { reduced, follower: shared, icon: alwaysIcon = false, pop = true, width = true, variant = "label", direction }: { reduced: boolean; /** How the text moves: `label` (buttons), `badge` (badges, progress, empty states) or `rise` (it enters from the side the value moved toward, see `direction`). */ variant?: "label" | "badge" | "rise"; /** For `rise`: 1 when the new content is larger than the old, -1 when smaller. */ direction?: (next: string, previous: string) => number; /** Follow the width of the content on a spring. Off for a label whose box is set by its container. */ width?: boolean; /** A width follower the caller owns, when the slot has other content that changes too. */ follower?: WidthFollower; /** The content is an icon, so it scales instead of rising. */ icon?: boolean; /** Take the old content out of the flow (a label); an icon stacked in a grid cell leaves in place. */ pop?: boolean },
): LabelSwap {
  const follower = shared ?? (width ? followWidth(slot, content, reduced) : { arm: () => undefined, destroy: () => undefined });
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
      const em = (amount: number) => amount * parseFloat(getComputedStyle(phase).fontSize);
      const sign = direction ? direction(phase.textContent ?? "", leaving.textContent ?? "") : 1;
      const textIn = variant === "label" ? { y: 4, blur: motionTokens.blur.soft } : { y: em(variant === "rise" ? 0.3 * sign : 0.3), blur: motionTokens.blur.soft };
      const textOut = variant === "label" ? { y: -3, blur: motionTokens.blur.soft } : { y: em(variant === "rise" ? -0.3 * sign : -0.3), blur: motionTokens.blur.subtle };
      const out = icon ? { opacity: 0, scale: 0.6, filter: blur(motionTokens.blur.subtle) } : { opacity: 0, y: textOut.y, filter: blur(textOut.blur) };
      animate(leaving, out, { duration: motionTokens.duration.fast, ease: ease("standard") }).finished.then(() => leaving.remove());
      if (icon) animate(phase, { opacity: [0, 1], scale: [0.6, 1], filter: [blur(motionTokens.blur.subtle), blur(0)] }, { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast, ease: ease("enter") }, filter: { duration: motionTokens.duration.fast, ease: ease("enter") } });
      else animate(phase, { opacity: [0, 1], y: [textIn.y, 0], filter: [blur(textIn.blur), blur(0)] }, { duration: motionTokens.duration.standard, ease: ease("enter") });
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

export type Pose = { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number; blur?: number };

/** How a pose is reached: a tween with an ease, or a spring (with its own tween for opacity and blur, so blur never overshoots). */
export type Timing = { duration: number; ease?: "enter" | "exit" | "standard" | "inOut"; delay?: number } | { spring: keyof typeof motionTokens.spring | Record<string, unknown>; fade?: number; fadeDelay?: number; delay?: number };

const keyframesOf = (from: Pose, to: Pose) => {
  const out: Record<string, unknown[]> = {};
  for (const key of ["opacity", "x", "y", "scale", "rotate"] as const) if (from[key] !== undefined || to[key] !== undefined) out[key] = [from[key] ?? (key === "scale" || key === "opacity" ? 1 : 0), to[key] ?? (key === "scale" || key === "opacity" ? 1 : 0)];
  if (from.blur !== undefined || to.blur !== undefined) out.filter = [blur(from.blur ?? 0), blur(to.blur ?? 0)];
  return out;
};

const springOf = (spring: keyof typeof motionTokens.spring | Record<string, unknown>) => (typeof spring === "string" ? motionTokens.spring[spring] : spring);

const optionsOf = (timing: Timing) =>
  "spring" in timing
    ? { ...springOf(timing.spring), delay: timing.delay, opacity: { duration: timing.fade ?? motionTokens.duration.fast, ease: ease("enter"), delay: timing.fadeDelay }, filter: { duration: timing.fade ?? motionTokens.duration.fast, ease: ease("enter"), delay: timing.fadeDelay } }
    : { duration: timing.duration, delay: timing.delay, ease: ease(timing.ease ?? "standard") };

/** Moves a node from one pose to another. */
export function playPose(node: Element, from: Pose, to: Pose, timing: Timing) {
  return animate(node, keyframesOf(from, to) as never, optionsOf(timing) as never);
}

/** The curve of a timing as a function of progress, for engines that drive the animation themselves (Svelte transitions). */
export function curveOf(timing: Timing): { duration: number; easing: (t: number) => number } {
  if ("spring" in timing) {
    const generator = spring({ keyframes: [0, 1], ...(springOf(timing.spring) as object) } as never);
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
        const rotate = lerp(from.rotate, to.rotate, 0, t);
        const filter = lerp(from.blur, to.blur, 0, t);
        return `opacity: ${opacity}; transform: translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale});${from.blur !== undefined || to.blur !== undefined ? ` filter: blur(${filter}px);` : ""}`;
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

/* ------------------------------------------------------------------------------------------------------------------
 * Controls
 * ---------------------------------------------------------------------------------------------------------------- */

const checkPath = "M4.25 9.25 L7.25 12.25 L13.75 5.75";
const dashPath = "M4.75 9 L9 9 L13.25 9";

/** The checkbox mark: the fill springs in, and the check morphs into the dash and back (both share three points). */
export function animateCheckbox(parts: { fill: HTMLElement; path: SVGPathElement }, state: boolean | "indeterminate", { reduced, animated }: { reduced: boolean; animated: boolean }) {
  const on = state !== false;
  const fade = { duration: on ? motionTokens.duration.instant : motionTokens.duration.fast, ease: ease("standard") };
  const instant = reduced || !animated;
  animate(parts.fill, { opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }, instant ? { duration: 0 } : ({ scale: motionTokens.spring.snappy, opacity: fade } as never));
  animate(parts.path, { d: state === "indeterminate" ? dashPath : checkPath, pathLength: on ? 1 : 0, opacity: on ? 1 : 0 } as never, instant ? { duration: 0 } : ({ d: motionTokens.spring.morph, pathLength: motionTokens.spring.snappy, opacity: fade } as never));
}

export const checkboxPath = checkPath;

/**
 * The thumb of a switch: it stretches like a held finger while pressed and keeps its far edge anchored, then travels on a critically
 * damped spring; a change that no press caused adds one brief stretch. The counterpart of the motion in switch.tsx.
 */
export function createSwitchThumb(root: HTMLElement, thumb: HTMLElement, { on, reduced, disabled }: { on: boolean; reduced: boolean; disabled: () => boolean }) {
  const size = 18;
  const travel = 18;
  const stretch = 5;
  const glide = { type: "spring", visualDuration: 0.3, bounce: 0 } as const;
  let current = on;
  let pressed = false;
  let releasedAt = -Infinity;

  const place = (animated: boolean) => {
    const extra = pressed && !reduced && !disabled() ? stretch : 0;
    animate(thumb, { x: current ? travel - extra : 0, width: size + extra }, animated && !reduced ? ({ x: glide, width: motionTokens.spring.snappy } as never) : { duration: 0 });
  };
  place(false);

  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    pressed = true;
    place(true);
  };
  const up = () => {
    if (pressed && !disabled()) releasedAt = performance.now();
    pressed = false;
    place(true);
  };
  const away = () => {
    pressed = false;
    place(true);
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key === " ") {
      pressed = true;
      place(true);
    }
  };
  root.addEventListener("pointerdown", down);
  root.addEventListener("pointerup", up);
  root.addEventListener("pointerleave", away);
  root.addEventListener("pointercancel", away);
  root.addEventListener("keydown", keydown);
  root.addEventListener("keyup", up);
  root.addEventListener("blur", away);

  return {
    set(next: boolean) {
      if (next === current) return;
      current = next;
      place(true);
      // A pointer or Space press already stretched the thumb, so only a change without one gets a stretch of its own.
      if (!reduced && performance.now() - releasedAt >= 250) animate(thumb, { scaleX: [1, 1.16, 1] }, { duration: 0.34, times: [0, 0.4, 1], ease: ["easeOut", "easeInOut"] });
    },
    destroy() {
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", away);
      root.removeEventListener("pointercancel", away);
      root.removeEventListener("keydown", keydown);
      root.removeEventListener("keyup", up);
      root.removeEventListener("blur", away);
    },
  };
}

/** One spring drives the fill of a progress bar and the counted label, so the number always matches the bar. */
export function createProgress(parts: { fill: HTMLElement; count?: HTMLElement }, { percent, reduced }: { percent: number; reduced: boolean }) {
  let shown = percent;
  let running: AnimationPlaybackControls | undefined;
  const paint = (value: number) => {
    shown = value;
    const clamped = Math.min(Math.max(value, 0), 100);
    parts.fill.style.transform = `translateX(${clamped - 100}%)`;
    if (parts.count) parts.count.textContent = `${Math.round(clamped)}%`;
  };
  paint(percent);
  return {
    set(next: number) {
      running?.stop();
      if (reduced) return paint(next);
      running = animate(shown, next, { ...motionTokens.spring.smooth, onUpdate: paint });
    },
    destroy: () => running?.stop(),
  };
}

/**
 * A panel whose height follows its content on a spring that never overshoots, while the answer settles down into place with a brief
 * focus pull; closed panels leave the accessibility tree once they finish collapsing. The counterpart of the accordion panel.
 */
export function createCollapse(panel: HTMLElement, inner: HTMLElement, { open, reduced }: { open: boolean; reduced: boolean }) {
  let running: AnimationPlaybackControls | undefined;
  const settle = (isOpen: boolean) => {
    panel.style.height = isOpen ? "auto" : "0px";
    panel.style.opacity = isOpen ? "1" : "0";
    panel.style.visibility = isOpen ? "visible" : "hidden";
    inner.style.transform = isOpen ? "none" : "translateY(-6px)";
    inner.style.filter = isOpen ? "none" : blur(motionTokens.blur.subtle);
  };
  settle(open);
  return {
    set(next: boolean) {
      running?.stop();
      if (reduced) return settle(next);
      panel.style.visibility = "visible";
      const from = panel.getBoundingClientRect().height;
      const to = next ? inner.scrollHeight : 0;
      panel.style.height = `${from}px`;
      running = animate(panel, { height: [`${from}px`, `${to}px`], opacity: next ? 1 : 0 }, { height: motionTokens.spring.smooth, opacity: next ? { duration: motionTokens.duration.standard, ease: ease("enter") } : { duration: motionTokens.duration.fast, ease: ease("standard") } } as never);
      animate(inner, next ? { y: 0, filter: [blur(motionTokens.blur.subtle), blur(0)] } : { y: -6, filter: blur(motionTokens.blur.subtle) }, next ? { y: motionTokens.spring.smooth, filter: { duration: motionTokens.duration.standard, ease: ease("enter") } } as never : { duration: motionTokens.duration.fast, ease: ease("standard") });
      running.finished.then(() => settle(next)).catch(() => undefined);
    },
    destroy: () => running?.stop(),
  };
}

/**
 * The highlight of a radio group: one box travels to the chosen row while the new dot springs in and the old one shrinks away.
 * A new choice glides on the morph spring; the first paint and resizes place it at once.
 */
export function createRadioGroup(list: HTMLElement, highlight: HTMLElement, { reduced }: { reduced: boolean }) {
  const rows = () => [...list.querySelectorAll<HTMLElement>(":scope > label")];
  const dots = () => [...list.querySelectorAll<HTMLElement>("[data-dot]")];
  let at = "";
  let shown: number | null = null;

  const place = (row: HTMLElement | undefined, glide: boolean) => {
    const next = row ? `${row.offsetTop} ${row.offsetHeight}` : "";
    if (next === at) return;
    const visible = at !== "";
    at = next;
    if (!row) return void animate(highlight, { opacity: 0 }, { duration: 0 });
    const target = { y: row.offsetTop, height: row.offsetHeight, opacity: 1 };
    if (glide && visible) return void animate(highlight, target, { ...motionTokens.spring.morph, opacity: { duration: 0 } } as never);
    Object.assign(highlight.style, { transform: `translateY(${target.y}px)`, height: `${target.height}px`, opacity: "1" });
    animate(highlight, target, { duration: 0 });
  };

  const observer = new ResizeObserver(() => place(rows()[shown ?? -1], false));
  observer.observe(list);
  rows().forEach((row) => observer.observe(row));

  return {
    select(index: number) {
      place(rows()[index], shown !== null && shown !== index && !reduced);
      dots().forEach((dot, at) => {
        const checked = at === index;
        animate(dot, checked ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }, reduced || shown === null ? { duration: 0 } : ({ ...motionTokens.spring.snappy, opacity: { duration: checked ? motionTokens.duration.fast : motionTokens.duration.instant } } as never));
      });
      shown = index;
      list.setAttribute("data-ready", "");
    },
    destroy: () => observer.disconnect(),
  };
}

/**
 * Keeps an element as wide (or as tall) as its content, and springs it to the new size when the content has just changed (`changed()`),
 * pinning the old size first so nothing snaps. Resizes nobody asked for, such as a font swap or a hidden parent, are followed at once.
 * The counterpart of the `HeightFrame` and the badge's width in the React components.
 */
export function createAutoSize(frame: HTMLElement, content: HTMLElement, { axis, reduced }: { axis: "width" | "height"; reduced: boolean }) {
  let changedAt = 0;
  let last: number | undefined;
  let running: AnimationPlaybackControls | undefined;
  let pinned: number | undefined;
  const settle = () => {
    pinned = undefined;
    frame.style[axis] = "auto";
    if (axis === "height") frame.style.overflow = "";
  };
  const observer = new ResizeObserver(([entry]) => {
    const size = entry.borderBoxSize?.[0];
    const next = axis === "width" ? (size?.inlineSize ?? content.offsetWidth) : (size?.blockSize ?? content.offsetHeight);
    const from = pinned ?? last;
    last = next;
    running?.stop();
    if (reduced || from === undefined || from === next || performance.now() - changedAt > 120) return settle();
    // Pin the old size before this frame paints, then spring to the new one.
    frame.style[axis] = `${from}px`;
    if (axis === "height") frame.style.overflow = "hidden";
    running = animate(from, next, {
      ...(axis === "width" ? motionTokens.spring.morph : motionTokens.spring.smooth),
      onUpdate: (value: number) => {
        pinned = value;
        frame.style[axis] = `${value}px`;
      },
      onComplete: settle,
    });
  });
  observer.observe(content);
  return {
    changed() {
      changedAt = performance.now();
    },
    destroy() {
      observer.disconnect();
      running?.stop();
    },
  };
}

/**
 * A segmented control's track: the selection travels between buttons on the morph spring (a shared layout in the React version),
 * the track scrolls inside itself with fading edges when the options do not fit, and the chosen option is kept in view.
 */
export function createSegmentedControl(track: HTMLElement, { selectionClass, reduced }: { selectionClass: string; reduced: boolean }) {
  const selection = document.createElement("span");
  selection.className = selectionClass;
  selection.setAttribute("aria-hidden", "true");
  let current: HTMLElement | undefined;
  let running: AnimationPlaybackControls[] = [];
  let first = true;

  const edges = () => {
    const rest = track.scrollWidth - track.clientWidth - track.scrollLeft;
    track.toggleAttribute("data-fade-start", track.scrollLeft > 1);
    track.toggleAttribute("data-fade-end", rest > 1);
  };
  edges();
  track.addEventListener("scroll", edges, { passive: true });
  const observer = new ResizeObserver(edges);
  observer.observe(track);

  const clear = () => {
    running.forEach((run) => run.stop());
    running = [];
    Object.assign(selection.style, { inset: "", left: "", top: "", width: "", height: "" });
  };

  return {
    /** Moves the selection to the button that is pressed (`aria-pressed="true"`) and scrolls it into view. */
    update() {
      const button = track.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!button) return;
      if (button !== current) {
        const from = current ? selection.getBoundingClientRect() : undefined;
        clear();
        button.prepend(selection);
        if (from && !reduced) {
          const to = button.getBoundingClientRect();
          Object.assign(selection.style, { inset: "auto", left: `${from.left - to.left}px`, top: `${from.top - to.top}px`, width: `${from.width}px`, height: `${from.height}px` });
          running = (["left", "top", "width", "height"] as const).map((key) => animate(selection, { [key]: key === "left" || key === "top" ? "0px" : `${key === "width" ? to.width : to.height}px` } as never, motionTokens.spring.morph));
          Promise.all(running.map((run) => run.finished)).then(() => Object.assign(selection.style, { inset: "", left: "", top: "", width: "", height: "" })).catch(() => undefined);
        }
        current = button;
      }
      if (track.scrollWidth > track.clientWidth) {
        const room = 20;
        const start = button.offsetLeft - room;
        const end = button.offsetLeft + button.offsetWidth + room - track.clientWidth;
        const left = track.scrollLeft > start ? start : track.scrollLeft < end ? end : track.scrollLeft;
        if (left !== track.scrollLeft) track.scrollTo({ left: Math.max(0, left), behavior: first || reduced ? "auto" : "smooth" });
      }
      first = false;
    },
    destroy() {
      clear();
      track.removeEventListener("scroll", edges);
      observer.disconnect();
      selection.remove();
    },
  };
}

/**
 * The highlight of a menu: one box glides between the items for the pointer and jumps instantly for the keyboard. It follows focus,
 * which is where Radix, Reka and Bits put the highlighted item. A short grace period keeps it gliding across separators and gaps.
 */
export function createMenuHighlight(content: HTMLElement, highlight: HTMLElement, { reduced }: { reduced: boolean }) {
  let pointer = false;
  let shown = false;
  let timer = 0;
  const hide = () => {
    shown = false;
    animate(highlight, { opacity: 0 }, { duration: reduced ? 0 : 0.08 });
  };
  const focus = (event: FocusEvent) => {
    const item = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="menuitem"]') : null;
    window.clearTimeout(timer);
    if (!item) {
      timer = window.setTimeout(hide, pointer ? 70 : 0);
      return;
    }
    highlight.dataset.tone = item.dataset.tone === "danger" ? "danger" : "";
    if (!highlight.dataset.tone) delete highlight.dataset.tone;
    const glide = pointer && shown;
    shown = true;
    animate(highlight, { y: item.offsetTop, height: item.offsetHeight, opacity: 1 }, glide && !reduced ? ({ ...motionTokens.spring.snappy, opacity: { duration: 0.08 } } as never) : { duration: 0 });
  };
  const move = () => {
    pointer = true;
  };
  const key = () => {
    pointer = false;
  };
  content.addEventListener("focusin", focus);
  content.addEventListener("pointermove", move, true);
  content.addEventListener("keydown", key, true);
  return {
    destroy() {
      window.clearTimeout(timer);
      content.removeEventListener("focusin", focus);
      content.removeEventListener("pointermove", move, true);
      content.removeEventListener("keydown", key, true);
    },
  };
}

/** Draws a check mark from its short stroke, the way a hand would write it. */
export function drawPath(path: Element, { reduced, duration = motionTokens.duration.standard, ease: curve = "enter", delay = 0.05 }: { reduced: boolean; duration?: number; ease?: "enter" | "standard"; delay?: number }) {
  if (reduced) return;
  animate(path, { pathLength: [0, 1], opacity: [0, 1] }, { pathLength: { duration, ease: ease(curve), delay }, opacity: { duration: duration === motionTokens.duration.standard ? 0.05 : 0.01, delay } } as never);
}
