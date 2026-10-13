// @manicat-dependencies motion
/**
 * The reels of the slot text, for the Vue and Svelte ports. Every character is a reel; digits count through the wheel in the
 * direction the number moved, letters shuffle through the alphabet, and reels stop one after another from left to right with a soft,
 * overshoot-free landing. The counterpart of `Reel` and `SlotText` in slot-text.tsx, driven against the DOM.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls, MotionValue } from "motion";

const DIGITS = "0123456789";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = LOWER.toUpperCase();
/** Fast out, long soft landing, never past the target. */
const LANDING = [0.12, 0.8, 0.16, 1] as [number, number, number, number];
/** Cell pitch in em. Keep in sync with .cell in the stylesheet. */
const CELL = 1.6;

const classOf = (char: string) => (DIGITS.includes(char) ? DIGITS : LOWER.includes(char) ? LOWER : UPPER.includes(char) ? UPPER : null);

/** Deterministic shuffle so the same change always spins the same letters. */
function seeded(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** The reel's cells, from what is visible now to the target. */
function buildStrip(from: string, to: string, spins: number, rising: boolean, seed: number) {
  if (from === to) return [to];
  const set = classOf(to);
  if (!set) return [from, to];
  if (set === DIGITS && classOf(from) === DIGITS) {
    const a = Number(from);
    const b = Number(to);
    const steps = spins * 10 + (rising ? (b - a + 10) % 10 : (a - b + 10) % 10);
    return Array.from({ length: steps + 1 }, (_, i) => String((a + (rising ? i : -i) + 100) % 10));
  }
  const random = seeded(seed);
  const fillers = Array.from({ length: Math.max(2, spins * 5 + 2) }, () => set[Math.floor(random() * set.length)]);
  return [from, ...fillers, to];
}

export interface SlotTextClasses {
  slot: string;
  sizer: string;
  window: string;
  strip: string;
  cell: string;
}

export interface SlotTextOptions {
  classes: SlotTextClasses;
  duration: number;
  stagger: number;
  spins: number;
  reduced: boolean;
}

interface Reel {
  key: string;
  char: string;
  order: number;
  slot: HTMLElement;
  sizer: HTMLElement;
  strip: HTMLElement;
  pos: MotionValue<number>;
  width: MotionValue<number | "auto">;
  cells: string[];
  from: number;
  grow: boolean;
  time: number;
  running: AnimationPlaybackControls[];
  leaving?: boolean;
  watch?: ResizeObserver;
}

const printable = (cell: string) => (cell === " " ? " " : cell);

export function createSlotText(host: HTMLElement, options: SlotTextOptions) {
  const reels = new Map<string, Reel>();
  let known: Set<string> | undefined;

  const fill = (reel: Reel) => {
    reel.strip.replaceChildren(
      ...reel.cells.map((cell) => {
        const node = document.createElement("span");
        node.className = options.classes.cell;
        node.textContent = printable(cell);
        return node;
      }),
    );
  };

  const run = (reel: Reel) => {
    reel.running.forEach((control) => control.stop());
    reel.running = [];
    const measured = reel.sizer.getBoundingClientRect().width;
    const last = reel.cells.length - 1;
    if (options.reduced) {
      reel.pos.jump(last);
      reel.width.jump(measured);
      return;
    }
    reel.pos.jump(reel.from);
    const settled = (control: AnimationPlaybackControls) => control.finished.then(() => { reel.running = reel.running.filter((item) => item !== control); }, () => undefined);
    const spin = animate(reel.pos, last, { duration: last === 0 ? 0.2 : reel.time, ease: LANDING });
    reel.running.push(spin);
    settled(spin);
    if (reel.grow) reel.width.jump(0);
    if (reel.width.get() === "auto") {
      reel.width.jump(measured);
      return;
    }
    const size = animate(reel.width, measured, { type: "spring", visualDuration: Math.min(reel.time, 0.6), bounce: 0 } as never);
    reel.running.push(size);
    settled(size);
  };

  const create = (key: string, char: string, order: number, entering: boolean, rising: boolean): Reel => {
    const slot = document.createElement("span");
    slot.className = options.classes.slot;
    const sizer = document.createElement("span");
    sizer.className = options.classes.sizer;
    sizer.textContent = printable(char);
    const window = document.createElement("span");
    window.className = options.classes.window;
    const strip = document.createElement("span");
    strip.className = options.classes.strip;
    window.append(strip);
    slot.append(sizer, window);
    const pos = motionValue(0);
    const width = motionValue<number | "auto">("auto");
    const reel: Reel = {
      key,
      char,
      order,
      slot,
      sizer,
      strip,
      pos,
      width,
      cells: entering && !options.reduced ? buildStrip("", char, options.spins, rising, char.charCodeAt(0) + order) : [char],
      from: 0,
      grow: entering,
      time: options.duration + order * options.stagger,
      running: [],
    };
    // Cells are taller than the line, so the neighbours of a landed glyph sit fully outside the window.
    pos.on("change", (value) => {
      strip.style.transform = `translate3d(0, ${(-value * CELL).toFixed(4)}em, 0)`;
      const amount = Math.min(Math.abs(pos.getVelocity()) * 0.05, 2.4);
      strip.style.filter = amount < 0.15 ? "none" : `blur(${amount.toFixed(2)}px)`;
    });
    width.on("change", (value) => (slot.style.width = typeof value === "number" ? `${value}px` : value));
    fill(reel);
    // A font that arrives after the first measure changes the glyph widths: a reel that is at rest follows them.
    reel.watch = new ResizeObserver(() => {
      if (reel.leaving) return;
      const next = sizer.getBoundingClientRect().width;
      const now = reel.width.get();
      if (typeof now === "number" && Math.abs(now - next) > 0.5 && !reel.width.isAnimating() && !reel.running.length) reel.width.jump(next);
    });
    reel.watch.observe(sizer);
    return reel;
  };

  const retarget = (reel: Reel, char: string, order: number, rising: boolean) => {
    // A new target restarts the reel from the cell that is on screen right now, keeping its sub-cell offset, so nothing jumps.
    const current = reel.pos.get();
    const index = Math.max(0, Math.min(reel.cells.length - 1, Math.round(current)));
    const visible = reel.cells[index];
    reel.cells = options.reduced ? [char] : buildStrip(visible, char, options.spins, rising, char.charCodeAt(0) * 31 + visible.charCodeAt(0) * 7 + order + reel.cells.length);
    reel.from = options.reduced ? 0 : current - index;
    reel.grow = false;
    reel.time = options.duration + order * options.stagger;
    reel.char = char;
    reel.sizer.textContent = printable(char);
    fill(reel);
    run(reel);
  };

  const leave = (reel: Reel) => {
    reels.delete(reel.key);
    reel.leaving = true;
    reel.watch?.disconnect();
    reel.slot.dataset.exiting = "";
    if (options.reduced) {
      reel.slot.remove();
      return;
    }
    reel.running.forEach((control) => control.stop());
    const exit = animate(reel.width, 0, { type: "spring", visualDuration: 0.35, bounce: 0, onComplete: () => reel.slot.remove() } as never);
    reel.running = [exit];
    if (reel.width.get() === "auto") reel.width.jump(reel.slot.getBoundingClientRect().width);
  };

  return {
    /**
     * Shows `text`. Reels are matched by key: from the start, or from the end for numbers, so separators and suffixes keep their own
     * reels when the number grows. A leading run of symbols never spins into a digit.
     */
    update(text: string, { fromEnd, rising }: { fromEnd: boolean; rising: boolean }) {
      const chars = Array.from(text);
      const lead = fromEnd ? chars.findIndex((char) => /[\p{L}\p{N}]/u.test(char)) : 0;
      const prefix = lead < 0 ? chars.length : lead;
      const keyOf = (i: number) => (i < prefix ? `p${i}` : fromEnd ? `e${chars.length - 1 - i}` : `s${i}`);
      const keys = chars.map((_, i) => keyOf(i));
      const first = known === undefined;
      known ??= new Set(keys);
      // Reels that are gone leave with their width.
      for (const reel of [...reels.values()]) if (!keys.includes(reel.key)) leave(reel);
      let after: ChildNode | null = null;
      chars.forEach((char, i) => {
        const key = keys[i];
        const existing = reels.get(key);
        if (existing) {
          existing.order = i;
          if (existing.char !== char) retarget(existing, char, i, rising);
          after = existing.slot;
          return;
        }
        const reel = create(key, char, i, !first && !known!.has(key), rising);
        reels.set(key, reel);
        host.insertBefore(reel.slot, after ? (after as ChildNode).nextSibling : host.firstChild);
        run(reel);
        after = reel.slot;
      });
    },
    destroy() {
      for (const reel of reels.values()) {
        reel.running.forEach((control) => control.stop());
        reel.watch?.disconnect();
      }
      host.replaceChildren();
      reels.clear();
    },
  };
}
