// @manicat-dependencies motion
/**
 * The resizing of the resizable panels, for the Vue and Svelte ports: dividers that follow the pointer 1:1, resist past a pane's limits,
 * snap collapsible panes closed and restore them, and move with the arrow keys. The panes share the width through flex-grow factors that
 * ride springs. The counterpart of `ResizablePanels`, `Pane` and `Handle` in resizable-panels.tsx; a port renders the markup and routes
 * the divider events here.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";
import { motionTokens } from "./motion-tokens";

export interface PanelConfig {
  id: string;
  label: string;
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export type Mode = "open" | "before" | "after";
export interface PanelsState {
  collapsed: boolean[];
  free: boolean[];
  resizing: number | null;
  shares: number[];
  available: number;
}

type Drag = { handle: number; pointer: number; startX: number; a0: number; b0: number; pair: number; lo: number; hi: number; mode: Mode; startMode: Mode; moved: boolean; catching: boolean; samples: [number, number][] };
type Transition = Record<string, unknown>;

export const DEFAULT_MIN = 80;
/** How far in px a pane can be pulled past a limit before it stops giving. */
const STRETCH = 44;
/** Keyboard steps in px; Shift takes the larger one. */
const STEP = 16;
const BIG_STEP = 64;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Past a limit every pixel costs more, like pulling against elastic. */
const rubber = (overshoot: number) => (overshoot * STRETCH * 0.55) / (STRETCH + 0.55 * overshoot);
const band = (value: number, lo: number, hi: number) => (value < lo ? lo - rubber(lo - value) : value > hi ? hi + rubber(value - hi) : value);
/** A collapsible pane snaps closed once the pointer is this far below its minimum. */
const collapseAt = (min: number) => min - Math.max(min * 0.5, 40);
/** Short momentum projection, used only to decide whether a flick collapses or restores a pane. */
const project = (velocity: number, rate = 0.99) => ((velocity / 1000) * rate) / (1 - rate);
export const toShares = (values: number[]) => {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  return values.map((value) => (value / total) * 100);
};
const startsCollapsed = (config: PanelConfig) => Boolean(config.collapsible && config.defaultCollapsed);

function velocityOf(samples: [number, number][], now: number) {
  const recent = samples.filter(([time]) => now - time <= 90);
  if (recent.length < 2 || now - recent[recent.length - 1][0] > 50) return 0;
  const [firstTime, firstX] = recent[0];
  const [lastTime, lastX] = recent[recent.length - 1];
  return lastTime > firstTime ? (lastX - firstX) / ((lastTime - firstTime) / 1000) : 0;
}

export function initialPanels(configs: PanelConfig[]): PanelsState {
  return { collapsed: configs.map(startsCollapsed), free: configs.map(() => false), resizing: null, shares: toShares(configs.map((config) => (startsCollapsed(config) ? 0 : config.defaultSize))), available: 0 };
}

/** The CSS custom properties that hold a pane's floor and ceiling. The group is a size container: below the sum of the minimums, each floor becomes its share of the room. */
export function paneVars(config: PanelConfig, configs: PanelConfig[]) {
  const minTotal = configs.reduce((sum, item) => sum + (item.minSize ?? DEFAULT_MIN), 0);
  const min = config.minSize ?? DEFAULT_MIN;
  return { "--panel-min": `min(${min}px, (100cqw - ${configs.length - 1}px) * ${+(min / Math.max(1, minTotal)).toFixed(5)})`, "--panel-max": config.maxSize ? `${config.maxSize}px` : "none" };
}

export function createResizablePanels(group: HTMLElement, { configs, reduced, onChange, onLayoutChange }: { configs: () => PanelConfig[]; reduced: boolean; onChange: (state: PanelsState) => void; onLayoutChange?: (sizes: number[]) => void }) {
  const list = configs();
  const count = list.length;
  let state = initialPanels(list);
  // Sizes are flex-grow factors: the default shares before the first interaction, then px. Flex keeps them proportional as the group resizes.
  const sizes = list.map((config) => motionValue(startsCollapsed(config) ? 0 : config.defaultSize));
  const fades = list.map((config) => motionValue(startsCollapsed(config) ? 0 : 1));
  const panes = () => [...group.querySelectorAll<HTMLElement>(":scope > [data-pane]")];
  const restoreSizes: (number | null)[] = list.map(() => null);
  let running: AnimationPlaybackControls[] = [];
  let token = 0;
  let goals: number[] | null = null;
  let stale = true;
  let drag: Drag | null = null;

  const set = (patch: Partial<PanelsState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };
  const minTotal = () => configs().reduce((sum, config) => sum + (config.minSize ?? DEFAULT_MIN), 0);
  // A group narrower than every minimum together scales the minimums down in proportion, the same floor the CSS applies,
  // so the panes fill the group instead of overflowing it and a press never re-lays them out.
  const minOf = (index: number) => {
    const min = configs()[index]?.minSize ?? DEFAULT_MIN;
    const total = minTotal();
    return state.available > 0 && state.available < total ? (min * state.available) / total : min;
  };
  const maxOf = (index: number) => configs()[index]?.maxSize ?? Infinity;

  // Panes grow by their size value and their content fades as the pane is squeezed below its minimum, so a collapsing pane dissolves rather than crushes.
  const paint = () =>
    panes().forEach((pane, index) => {
      pane.style.flexGrow = String(Math.max(0, sizes[index].get()));
      const content = pane.firstElementChild as HTMLElement | null;
      if (content) content.style.opacity = String(fades[index].get());
    });
  const stops = sizes.flatMap((size, index) => [
    size.on("change", (value) => {
      fades[index].set(clamp(value / Math.max(1, minOf(index)), 0, 1));
      const pane = panes()[index];
      if (pane) pane.style.flexGrow = String(Math.max(0, value));
    }),
    fades[index].on("change", (value) => {
      const content = panes()[index]?.firstElementChild as HTMLElement | null;
      if (content) content.style.opacity = String(value);
    }),
  ]);
  paint();

  const observer = new ResizeObserver(() => {
    stale = true;
    set({ available: panes().reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) });
  });
  observer.observe(group);

  /** Starts an interaction: stops anything in flight and makes sure the sizes are the px widths on screen, so nothing moves. */
  function begin(involved: number[]) {
    token += 1;
    running.forEach((controls) => controls.stop());
    running = [];
    // Only a group resize (or the first interaction) can put the sizes out of step with the screen; otherwise they are the truth,
    // even before a jump has painted.
    if (stale) {
      stale = false;
      const widths = panes().slice(0, count).map((node) => node.getBoundingClientRect().width);
      if (widths.some((width, index) => Math.abs(width - sizes[index].get()) > 0.5)) widths.forEach((width, index) => sizes[index].jump(width));
    }
    // Freed panes drop their CSS limits while JS owns them, so rubber-banding and collapsing can go past them.
    if (involved.some((index) => !state.free[index])) set({ free: state.free.map((value, index) => value || involved.includes(index)) });
    return sizes.map((size) => size.get());
  }

  function commit() {
    const values = sizes.map((size) => size.get());
    set({ free: configs().map(() => false), shares: toShares(values) });
    onLayoutChange?.(toShares(values));
  }

  /** Springs panes to new widths from wherever they are, keeping their velocity, then hands the limits back to CSS. */
  function glide(targets: (number | null)[], transition: Transition = motionTokens.spring.smooth) {
    const mine = token;
    const finals = targets.map((target, index) => target ?? sizes[index].get());
    goals = finals;
    // Assistive technology hears the destination right away rather than after the spring's tail settles.
    set({ shares: toShares(finals) });
    const moving = targets.flatMap((target, index) => (target === null || Math.abs(target - sizes[index].get()) < 0.01 ? [] : [[index, target] as const]));
    let pending = moving.length;
    const done = () => {
      if (token === mine) commit();
    };
    if (reduced || !pending) {
      moving.forEach(([index, target]) => sizes[index].jump(target));
      return done();
    }
    running = moving.map(([index, target]) =>
      animate(sizes[index], target, {
        ...transition,
        onComplete: () => {
          pending -= 1;
          if (!pending) done();
        },
      } as never),
    );
  }

  function limits(handle: number, a: number, b: number) {
    const pair = a + b;
    let lo = Math.max(minOf(handle), pair - maxOf(handle + 1));
    let hi = Math.min(maxOf(handle), pair - minOf(handle + 1));
    // A group too narrow for every minimum may already hold a pane below it; never yank it to the limit on grab.
    if (a > 0 && b > 0) {
      lo = Math.min(lo, a);
      hi = Math.max(hi, a);
    }
    if (lo > hi) lo = hi = clamp((lo + hi) / 2, 0, pair);
    return { pair, lo: clamp(lo, 0, pair), hi: clamp(hi, 0, pair) };
  }

  function resolve(handle: number, raw: number, pair: number, lo: number, hi: number): { mode: Mode; size: number } {
    const cfg = configs();
    if (cfg[handle].collapsible && raw < collapseAt(minOf(handle))) return { mode: "before", size: 0 };
    if (cfg[handle + 1].collapsible && pair - raw < collapseAt(minOf(handle + 1))) return { mode: "after", size: pair };
    return { mode: "open", size: band(raw, lo, hi) };
  }

  const setCollapsedPair = (handle: number, mode: Mode) => set({ collapsed: state.collapsed.map((value, index) => (index === handle ? mode === "before" : index === handle + 1 ? mode === "after" : value)) });

  function remember(handle: number, a: number, b: number, mode: Mode) {
    if (mode === "before" && a > 0) restoreSizes[handle] = a;
    if (mode === "after" && b > 0) restoreSizes[handle + 1] = b;
  }

  const modeOf = (handle: number): Mode => (state.collapsed[handle] ? "before" : state.collapsed[handle + 1] ? "after" : "open");

  /** Sets a pane pair to a new boundary. Any change of collapse state springs; everything else moves with the pointer. */
  function moveBoundary(current: Drag, size: number) {
    const [a, b] = [sizes[current.handle], sizes[current.handle + 1]];
    if (current.catching && !reduced) {
      if (Math.abs(a.get() - size) < 0.75) {
        current.catching = false;
        running.forEach((controls) => controls.stop());
        running = [];
      } else {
        running = [animate(a, size, motionTokens.spring.smooth as never), animate(b, current.pair - size, motionTokens.spring.smooth as never)];
        return;
      }
    }
    a.set(size);
    b.set(current.pair - size);
  }

  function restore(handle: number, side: Mode) {
    const values = begin([handle, handle + 1]);
    const { pair, lo, hi } = limits(handle, values[handle], values[handle + 1]);
    const size = side === "before" ? clamp(restoreSizes[handle] ?? minOf(handle), lo, hi) : clamp(pair - (restoreSizes[handle + 1] ?? minOf(handle + 1)), lo, hi);
    setCollapsedPair(handle, "open");
    glide(sizes.map((_, index) => (index === handle ? size : index === handle + 1 ? pair - size : null)));
  }

  function collapse(handle: number, side: Mode) {
    const values = begin([handle, handle + 1]);
    const pair = values[handle] + values[handle + 1];
    remember(handle, values[handle], values[handle + 1], side);
    setCollapsedPair(handle, side);
    glide(sizes.map((_, index) => (index === handle ? (side === "before" ? 0 : pair) : index === handle + 1 ? (side === "before" ? pair : 0) : null)));
  }

  function restoreTo(handle: number, size: number, pair: number) {
    setCollapsedPair(handle, "open");
    glide(sizes.map((_, index) => (index === handle ? size : index === handle + 1 ? pair - size : null)));
  }

  return {
    initial: state,
    /** What a divider reports to assistive technology. */
    aria(handle: number) {
      const { shares, available } = state;
      const now = Math.round(shares[handle]);
      const lim = available ? limits(handle, (shares[handle] / 100) * available, (shares[handle + 1] / 100) * available) : null;
      const min = lim && available ? Math.round((lim.lo / available) * 100) : 0;
      const max = lim && available ? Math.round((lim.hi / available) * 100) : 100;
      return { now, min: Math.min(min, now), max: Math.max(max, now) };
    },
    pointerDown(handle: number, event: PointerEvent) {
      if (drag || (event.pointerType === "mouse" && event.button !== 0)) return;
      const values = begin([handle, handle + 1]);
      const { pair, lo, hi } = limits(handle, values[handle], values[handle + 1]);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      const mode = modeOf(handle);
      drag = { handle, pointer: event.pointerId, startX: event.clientX, a0: values[handle], b0: values[handle + 1], pair, lo, hi, mode, startMode: mode, moved: false, catching: false, samples: [[event.timeStamp, event.clientX]] };
    },
    pointerMove(event: PointerEvent) {
      const current = drag;
      if (!current || current.pointer !== event.pointerId) return;
      const dx = event.clientX - current.startX;
      if (!current.moved) {
        if (Math.abs(dx) < 2) return;
        current.moved = true;
        set({ resizing: current.handle });
      }
      const next = resolve(current.handle, current.a0 + dx, current.pair, current.lo, current.hi);
      if (next.mode !== current.mode) {
        current.mode = next.mode;
        current.catching = true;
      }
      moveBoundary(current, next.size);
      current.samples.push([event.timeStamp, event.clientX]);
      if (current.samples.length > 16) current.samples.shift();
    },
    pointerEnd(event: PointerEvent, cancelled: boolean) {
      const current = drag;
      if (!current || current.pointer !== event.pointerId) return;
      drag = null;
      set({ resizing: null });
      const { handle, pair, lo, hi } = current;
      if (!current.moved) {
        // A press on a divider that hides a pane brings it back.
        if (current.startMode !== "open" && !cancelled) restore(handle, current.startMode);
        else commit();
        return;
      }
      const raw = current.a0 + event.clientX - current.startX;
      const velocity = cancelled ? 0 : velocityOf(current.samples, event.timeStamp);
      const flung = resolve(handle, raw + project(velocity), pair, lo, hi);
      // A flick toward an edge collapses; a flick back out restores. Otherwise the divider stays where it was let go, inside its limits.
      const mode = cancelled ? current.startMode : flung.mode !== "open" ? flung.mode : "open";
      const size = mode === "before" ? 0 : mode === "after" ? pair : cancelled ? current.a0 : clamp(raw, lo, hi);
      remember(handle, current.a0, current.b0, mode);
      setCollapsedPair(handle, mode);
      glide(sizes.map((_, index) => (index === handle ? size : index === handle + 1 ? pair - size : null)));
    },
    /** Resets to the default shares, fitted to the current width so every pane respects its limits. */
    reset() {
      const cfg = configs();
      const values = begin(cfg.map((_, index) => index));
      const total = values.reduce((sum, value) => sum + value, 0);
      const wanted = cfg.map((config) => (startsCollapsed(config) ? 0 : config.defaultSize));
      const targets = [...wanted];
      const frozen = wanted.map((value) => value === 0);
      for (let pass = 0; pass < count; pass++) {
        const fixed = targets.reduce((sum, value, index) => (frozen[index] ? sum + value : sum), 0);
        const share = wanted.reduce((sum, value, index) => (frozen[index] ? sum : sum + value), 0);
        let violated = false;
        targets.forEach((_, index) => {
          if (frozen[index]) return;
          const size = share ? (wanted[index] / share) * (total - fixed) : 0;
          const bounded = clamp(size, minOf(index), maxOf(index));
          targets[index] = size;
          if (bounded !== size) {
            targets[index] = bounded;
            frozen[index] = true;
            violated = true;
          }
        });
        if (!violated) break;
      }
      set({ collapsed: cfg.map(startsCollapsed) });
      glide(targets);
    },
    keyDown(handle: number, event: KeyboardEvent) {
      const current = drag;
      if (event.key === "Escape" && current) {
        // Escape during a drag puts the divider back where it started.
        event.preventDefault();
        drag = null;
        set({ resizing: null });
        setCollapsedPair(handle, current.startMode);
        glide(sizes.map((_, index) => (index === handle ? current.a0 : index === handle + 1 ? current.b0 : null)));
        return;
      }
      if (current || !["ArrowLeft", "ArrowRight", "Home", "End", "Enter"].includes(event.key)) return;
      event.preventDefault();
      const cfg = configs();
      const mode = modeOf(handle);
      const canCollapseBefore = Boolean(cfg[handle].collapsible);
      const canCollapseAfter = Boolean(cfg[handle + 1].collapsible);
      if (event.key === "Enter") {
        if (mode !== "open") restore(handle, mode);
        else if (canCollapseBefore) collapse(handle, "before");
        else if (canCollapseAfter) collapse(handle, "after");
        return;
      }
      // Repeated presses build on where the divider is heading, not on where the spring happens to be this frame.
      const heading = goals && (sizes[handle].isAnimating() || sizes[handle + 1].isAnimating()) ? goals : null;
      const values = begin([handle, handle + 1]);
      const pair = values[handle] + values[handle + 1];
      const a = heading ? clamp(heading[handle], 0, pair) : values[handle];
      const step = event.shiftKey ? BIG_STEP : STEP;
      const { lo, hi } = limits(handle, a, pair - a);
      // Arrows walk out of a collapsed pane at its minimum, and past a limit into collapse when the pane allows it.
      if (event.key === "ArrowLeft" && mode === "after") return restoreTo(handle, hi, pair);
      if (event.key === "ArrowRight" && mode === "before") return restoreTo(handle, lo, pair);
      if (event.key === "ArrowLeft" && a <= lo + 0.5 && canCollapseBefore && mode === "open") return collapse(handle, "before");
      if (event.key === "ArrowRight" && a >= hi - 0.5 && canCollapseAfter && mode === "open") return collapse(handle, "after");
      if (mode !== "open") return;
      const size = event.key === "Home" ? lo : event.key === "End" ? hi : clamp(a + (event.key === "ArrowLeft" ? -step : step), lo, hi);
      glide(sizes.map((_, index) => (index === handle ? size : index === handle + 1 ? pair - size : null)), event.key.startsWith("Arrow") ? motionTokens.spring.snappy : motionTokens.spring.smooth);
    },
    destroy() {
      observer.disconnect();
      running.forEach((controls) => controls.stop());
      stops.forEach((stop) => stop());
    },
  };
}

export type ResizablePanelsController = ReturnType<typeof createResizablePanels>;
export type { MotionValue };
