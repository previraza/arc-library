// @manicat-dependencies motion
/**
 * The motion of the tabs, for the Vue and Svelte ports, written against the DOM so both run the same code: the highlight that
 * travels between triggers (a shared layout in React), the strip that scrolls inside itself, and the panels that hand their height
 * over. The counterparts of `TabsList`, `TabsTrigger` and `TabsContent` in tabs.tsx.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";
import { popOut } from "./motion-dom";
import type { Pose, Timing } from "./motion-dom";

export type TabsClassNames = {
  listShell?: string;
  scrollButton?: string;
  viewport?: string;
  list?: string;
  trigger?: string;
  selection?: string;
  triggerLabel?: string;
  content?: string;
};

/** What the parts of one tab set share: the direction of the last change and what the next panel needs to know about the last one. */
export interface TabsState {
  active: () => string;
  direction: () => number;
  classNames: () => TabsClassNames | undefined;
  memory: PanelMemory;
}

export interface PanelMemory {
  /** The height of the visible panel, so the next one can morph from it. */
  height: number | null;
  /** Where the outgoing panel was on screen, so it stays there while it fades. */
  leaving: DOMRect | null;
}

export const tabsKey = Symbol("manicat-tabs");
export const createPanelMemory = (): PanelMemory => ({ height: null, leaving: null });

/** The highlight: one box that travels between triggers on the morph spring and sits in the active trigger. */
export function createSelectionGlide(list: HTMLElement, { selectionClass, reduced, selector = '[role="tab"][data-state="active"]' }: { selectionClass: string; reduced: boolean; /** Finds the element that holds the highlight. Tabs by default. */ selector?: string }) {
  const selection = document.createElement("span");
  selection.className = selectionClass;
  selection.setAttribute("aria-hidden", "true");
  let current: HTMLElement | undefined;
  let running: AnimationPlaybackControls[] = [];
  const reset = () => Object.assign(selection.style, { inset: "", left: "", top: "", width: "", height: "" });
  const clear = () => {
    running.forEach((run) => run.stop());
    running = [];
    reset();
  };
  return {
    update() {
      const tab = list.querySelector<HTMLElement>(selector);
      if (!tab) {
        // The row that held the highlight is gone or unselected: the highlight leaves with it.
        if (current) selection.remove();
        current = undefined;
        return;
      }
      if (tab === current) return;
      const from = current ? selection.getBoundingClientRect() : undefined;
      clear();
      tab.prepend(selection);
      if (from && !reduced) {
        const to = tab.getBoundingClientRect();
        Object.assign(selection.style, { inset: "auto", left: `${from.left - to.left}px`, top: `${from.top - to.top}px`, width: `${from.width}px`, height: `${from.height}px` });
        running = (["left", "top", "width", "height"] as const).map((key) => animate(selection, { [key]: key === "left" || key === "top" ? "0px" : `${key === "width" ? to.width : to.height}px` } as never, motionTokens.spring.morph as never));
        Promise.all(running.map((run) => run.finished)).then(reset).catch(() => undefined);
      }
      current = tab;
    },
    destroy() {
      clear();
      selection.remove();
    },
  };
}

export type Edges = { overflow: boolean; left: boolean; right: boolean };

/** The strip of triggers: it reports which edges can still scroll, keeps the active trigger in view and pages left or right. */
export function createTabsScroll(shell: HTMLElement, viewport: HTMLElement, list: HTMLElement, { reduced, onEdges }: { reduced: boolean; onEdges: (edges: Edges) => void }) {
  let edges: Edges = { overflow: false, left: false, right: false };
  const update = () => {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const next = { overflow: viewport.scrollWidth > shell.clientWidth + 1, left: viewport.scrollLeft > 1, right: viewport.scrollLeft < max - 1 };
    if (next.overflow !== edges.overflow || next.left !== edges.left || next.right !== edges.right) onEdges((edges = next));
  };
  const behavior = reduced ? "instant" : "smooth";
  const observer = new ResizeObserver(update);
  for (const node of [shell, viewport, list]) observer.observe(node);
  viewport.addEventListener("scroll", update, { passive: true });
  update();
  return {
    update,
    reveal(tab: HTMLElement | null) {
      if (!tab) return;
      const frame = viewport.getBoundingClientRect();
      const item = tab.getBoundingClientRect();
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const left = frame.left + (viewport.scrollLeft > 1 ? 34 : 0);
      const right = frame.right - (viewport.scrollLeft < max - 1 ? 34 : 0);
      const delta = item.left < left ? item.left - left : item.right > right ? item.right - right : 0;
      if (delta) viewport.scrollBy({ left: delta, behavior });
    },
    page(direction: number) {
      viewport.scrollBy({ left: direction * viewport.clientWidth * 0.75, behavior });
    },
    destroy() {
      observer.disconnect();
      viewport.removeEventListener("scroll", update);
    },
  };
}

/**
 * The incoming panel starts at the outgoing panel's height and settles at its own, so content below glides instead of jumping.
 * Returns what to call when the panel stops being the visible one.
 */
export function mountPanel(node: HTMLElement, memory: PanelMemory, reduced: boolean) {
  node.style.translate = "";
  node.inert = false;
  const from = memory.height;
  const to = node.offsetHeight;
  let controls: AnimationPlaybackControls | undefined;
  const release = () => {
    node.style.height = "";
    node.style.overflow = "";
  };
  if (from !== null && Math.abs(from - to) > 1 && !reduced) {
    if (to > from) node.style.overflow = "clip";
    controls = animate(node, { height: [from, to] }, { ...motionTokens.spring.smooth, onComplete: release } as never);
  }
  memory.height = controls && from !== null ? from : to;
  const observer = new ResizeObserver(() => (memory.height = node.offsetHeight));
  observer.observe(node);
  return () => {
    observer.disconnect();
    controls?.stop();
    release();
  };
}

/** Outgoing: the tab root may have changed size around the panel, so it is pinned to where it was while it fades. */
export function pinPanel(node: HTMLElement, memory: PanelMemory) {
  popOut(node);
  const before = memory.leaving;
  const now = node.getBoundingClientRect();
  if (before) node.style.translate = `${before.left - now.left}px ${before.top - now.top}px`;
  node.inert = true;
}

/** The poses of a panel: it slides in from the side the new tab sits on, and leaves a little less far. Reduced motion is a short crossfade in place. */
export function panelMotion(direction: number, reduced: boolean): { enter: { from: Pose; to: Pose; timing: Timing }; leave: { from: Pose; to: Pose; timing: Timing } } {
  if (reduced) {
    return {
      enter: { from: { opacity: 0, x: 0 }, to: { opacity: 1, x: 0 }, timing: { duration: motionTokens.duration.instant } },
      leave: { from: { opacity: 1, x: 0 }, to: { opacity: 0, x: 0 }, timing: { duration: 0.1 } },
    };
  }
  return {
    enter: { from: { opacity: 0, x: direction * 8 }, to: { opacity: 1, x: 0 }, timing: { spring: "smooth", fade: motionTokens.duration.standard } },
    leave: { from: { opacity: 1, x: 0 }, to: { opacity: 0, x: direction * -6 }, timing: { duration: motionTokens.duration.instant, ease: "standard" } },
  };
}
