// @manicat-dependencies motion
/**
 * The shared highlight of the floating button group, for the Vue and Svelte ports: one box that morphs, in position and size, to
 * whichever button the pointer or keyboard focus is on, fades when the pointer leaves the tray, and settles darker while a button is
 * pressed. The counterpart of the motion values and `place` callback in floating-button-group.tsx.
 */
import { animate, motionValue } from "motion";
import { motionTokens } from "./motion-tokens";

const standard = [...motionTokens.ease.standard] as [number, number, number, number];

export function createGroupHighlight(tray: HTMLElement, highlight: HTMLElement, reduced: boolean) {
  const x = motionValue(0);
  const y = motionValue(0);
  const width = motionValue(0);
  const height = motionValue(0);
  const opacity = motionValue(0);
  const scale = motionValue(1);
  const paint = () => {
    highlight.style.transform = `translate(${x.get()}px, ${y.get()}px) scale(${scale.get()})`;
    highlight.style.width = `${width.get()}px`;
    highlight.style.height = `${height.get()}px`;
    highlight.style.opacity = String(opacity.get());
  };
  for (const value of [x, y, width, height, opacity, scale]) value.on("change", paint);
  paint();
  let traveling = false;
  let active: string | null = null;
  let pressing = false;
  const nodes = () => new Map([...tray.querySelectorAll<HTMLElement>("[data-fbg-item]")].map((node) => [node.dataset.fbgItemId!, node]));

  /** The button's box in tray coordinates, exact to the device pixel (offsetLeft rounds to whole pixels) and free of ancestor transforms. */
  const measure = (node: HTMLElement) => {
    const outer = tray.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const unscale = outer.width ? tray.offsetWidth / outer.width : 1;
    const dpr = window.devicePixelRatio || 1;
    const snap = (value: number) => Math.round(value * unscale * dpr) / dpr;
    return { x: snap(box.left - outer.left) - tray.clientLeft, y: snap(box.top - outer.top) - tray.clientTop, width: snap(box.width), height: snap(box.height) };
  };

  const place = (id: string | null, mode: "move" | "follow") => {
    active = id;
    const node = id ? nodes().get(id) : undefined;
    if (!node) {
      animate(opacity, 0, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.standard, ease: standard } as never);
      return;
    }
    const rect = measure(node);
    const visible = opacity.get() > 0.15;
    // Travel between buttons on the morph spring. Appearing from nothing, and every move with reduced motion, lands in place.
    const travel = !reduced && visible && (mode === "move" || traveling);
    if (travel) {
      traveling = true;
      animate(x as never, rect.x, motionTokens.spring.morph as never);
      animate(y as never, rect.y, motionTokens.spring.morph as never);
      animate(width as never, rect.width, motionTokens.spring.morph as never);
      animate(height as never, rect.height, { ...(motionTokens.spring.morph as object), onComplete: () => (traveling = false) } as never);
    } else {
      traveling = false;
      x.jump(rect.x);
      y.jump(rect.y);
      width.jump(rect.width);
      height.jump(rect.height);
      if (!visible && !reduced) {
        scale.jump(0.94);
        animate(scale as never, pressing ? 0.965 : 1, motionTokens.spring.snappy as never);
      }
    }
    if (opacity.get() !== 1) animate(opacity as never, 1, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: standard } as never);
  };

  // A font that loads or a container that reflows moves the buttons; the highlight follows without travel.
  const observer = new ResizeObserver(() => active && place(active, "follow"));
  observer.observe(tray);
  return {
    place,
    /** Observe the buttons too, once they are rendered. */
    watchItems() {
      observer.disconnect();
      observer.observe(tray);
      nodes().forEach((node) => observer.observe(node));
    },
    /** The highlight settles darker in place while a button is pressed. */
    press(isPressing: boolean, id: string | null) {
      pressing = isPressing;
      animate(scale as never, isPressing && id ? 0.965 : 1, (reduced ? { duration: 0 } : motionTokens.spring.snappy) as never);
    },
    destroy() {
      observer.disconnect();
    },
  };
}

/** What the items of one group share: which button is active, who holds the tab stop and how a press, a focus or a pick is reported. */
export interface GroupContext {
  activeId: () => string | null;
  tabStop: () => string | null;
  side: () => "top" | "bottom" | "left" | "right";
  iconOnly: () => boolean;
  classNames: () => Record<string, string | undefined> | undefined;
  hover(id: string): void;
  press(id: string, disabled: boolean): void;
  release(): void;
  focus(event: FocusEvent, id: string): void;
  select(id: string): void;
}
export const groupKey = Symbol("manicat-floating-button-group");
