// @manicat-dependencies motion
/**
 * The motion of the expandable card, for the Vue and Svelte ports: one morph in which the box grows in width and height on the
 * same spring, so close is the exact mirror of open. Size is animated for real (not with a scale), so the text, border and corner
 * radius never stretch. The counterpart of the effects and motion values of `ExpandableCard` in expandable-card.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

const ease = (name: keyof typeof motionTokens.ease) => [...motionTokens.ease[name]] as [number, number, number, number];
/** On close the details fade out first, then the box starts to shrink; on open they fade in once the box has made room. */
const closeHold = 0.06;
/** A close that reverses an open still in flight skips the hold, so the spring turns around with its velocity instead of stalling. */
const settleTime = 450;

export interface ExpandableParts {
  track: HTMLElement;
  card: HTMLElement;
  arrow: HTMLElement;
  panel: HTMLElement;
  inner: HTMLElement;
}

export function createExpandableCard(parts: ExpandableParts, { reduced }: { reduced: boolean }) {
  const { track, card, arrow, panel, inner } = parts;
  const width = motionValue<number | string>("100%");
  width.on("change", (value) => (card.style.width = typeof value === "number" ? `${value}px` : value));
  let room: number | null = null;
  let expanded: boolean | undefined;
  let caps: { width?: number; expandedWidth?: number } = {};
  let hold = true;
  let lastToggle = 0;
  let placed = false;
  let running: AnimationPlaybackControls[] = [];
  let widthRun: AnimationPlaybackControls | undefined;

  const box = (open: boolean, held: boolean) => (reduced ? { duration: 0 } : open || !held ? { ...motionTokens.spring.smooth } : { ...motionTokens.spring.smooth, delay: closeHold });
  const content = (open: boolean) => (reduced ? { duration: 0 } : open ? { duration: motionTokens.duration.standard, ease: ease("standard"), delay: 0.12 } : { duration: 0.1, ease: ease("standard") });
  const fit = (cap: number | undefined) => (room === null ? undefined : Math.min(room, cap ?? room));

  const place = () => {
    if (expanded === undefined) return;
    const openCap = caps.expandedWidth ?? caps.width;
    const target = fit(expanded ? openCap : caps.width);
    // The details are laid out at their final width the whole time, so nothing reflows while the box changes size.
    const innerWidth = fit(openCap);
    inner.style.width = innerWidth === undefined ? "" : `${innerWidth - 2}px`;
    if (target === undefined) return;
    card.toggleAttribute("data-measured", true);
    // The first measurement lands without motion, later changes spring from the current width and velocity.
    if (!placed) {
      placed = true;
      width.jump(target);
      return;
    }
    widthRun?.stop();
    widthRun = animate(width, target, box(expanded, hold) as never);
  };

  const measure = () => {
    room = track.clientWidth;
    place();
  };
  const observer = new ResizeObserver(measure);
  observer.observe(track);
  measure();

  return {
    /** Tells the card its state and caps. Call it after the DOM has updated; the first call lands without motion. */
    sync(next: boolean, nextCaps: { width?: number; expandedWidth?: number }) {
      const changed = expanded !== undefined && expanded !== next;
      const first = expanded === undefined;
      if (changed) {
        const now = performance.now();
        hold = now - lastToggle > settleTime;
        lastToggle = now;
      }
      expanded = next;
      caps = nextCaps;
      if (first) {
        panel.style.height = next ? "auto" : "0px";
        inner.style.opacity = next ? "1" : "0";
        arrow.style.transform = `rotate(${next ? 180 : 0}deg)`;
      } else if (changed) {
        running.forEach((run) => run.stop());
        running = [
          animate(panel, { height: next ? "auto" : 0 }, box(next, hold) as never),
          animate(inner, { opacity: next ? 1 : 0 }, content(next) as never),
          animate(arrow, { rotate: next ? 180 : 0 } as never, box(next, hold) as never),
        ];
      }
      place();
    },
    destroy() {
      observer.disconnect();
      running.forEach((run) => run.stop());
      widthRun?.stop();
    },
  };
}
