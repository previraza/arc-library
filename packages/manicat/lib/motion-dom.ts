// @manicat-dependencies motion
/**
 * The animations of the React components, for the Vue and Svelte ports. They are written against the DOM instead of a
 * framework, so a port only owns the element and hands it over: the same code runs the same motion in every framework, with the
 * same timings (`motion-tokens`) as the React version, which uses `motion/react`.
 */
import { animate } from "motion";
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
export function pressable(node: HTMLElement, { reduced, enabled }: { reduced: boolean; enabled: () => boolean }) {
  if (reduced) return () => undefined;
  const down = () => {
    if (enabled()) animate(node, { scale: node.offsetWidth > 220 ? 0.985 : node.offsetWidth && node.offsetWidth <= 48 ? 0.96 : 0.97 }, { duration: motionTokens.duration.instant, ease: ease("standard") });
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
