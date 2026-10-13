// @manicat-dependencies motion
/**
 * The helper and error copy under a field, as the React inputs animate it, for the Vue and Svelte ports. The row opens its height
 * on a spring and then the words settle in; when the copy changes, only the words that changed rise in and unblur while the rest hold
 * still, and counts such as "12 characters" roll digit by digit. The counterpart of `FieldMessage`, `MotionText` and `RollingNumber`.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";
import { popOut } from "./motion-dom";

const ease = (name: keyof typeof motionTokens.ease) => [...motionTokens.ease[name]] as [number, number, number, number];
const blur = (px: number) => `blur(${px}px)`;
const node = (className: string, text?: string) => {
  const span = document.createElement("span");
  if (className) span.className = className;
  if (text !== undefined) span.textContent = text;
  return span;
};
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
const isNumber = (word: string) => /^\d[\d.,/:]*%?$/.test(word);
const value = (word: string) => parseFloat(word.replace(/,/g, ""));

export interface FieldMessageClasses {
  messageSlot: string;
  /** The copy: `hint` or `error`. */
  copy: string;
  srOnly: string;
  words: string;
  word: string;
  column: string;
}

export interface FieldMessage {
  /** Shows the copy (or hides the row for an empty one). */
  set(text: string | undefined): void;
  destroy(): void;
}

/** A count in the copy: each character is a column; a changed digit rolls, a gained or lost one opens or closes its width. */
function rolling(host: HTMLElement, word: string, classes: FieldMessageClasses, reduced: boolean) {
  type Column = { char: string; column: HTMLElement; glyph: HTMLElement };
  let columns: Column[] = [];
  let shown = word;
  const spring = motionTokens.spring;
  const enter = (el: HTMLElement, direction: number) =>
    animate(el, { opacity: [0, 1], y: [em(el, 0.6 * direction), 0], filter: [blur(motionTokens.blur.subtle), blur(0)] }, reduced ? { duration: 0 } : { ...spring.snappy, opacity: { duration: motionTokens.duration.fast }, filter: { duration: motionTokens.duration.fast } });

  const build = (char: string, direction: number, animateIn: boolean): Column => {
    const column = node(classes.column);
    const glyph = node("", char);
    column.append(glyph);
    if (animateIn && !reduced) {
      column.style.overflow = "hidden";
      const natural = (() => {
        host.append(column);
        const width = column.offsetWidth;
        column.remove();
        return width;
      })();
      animate(column, { width: [0, natural], opacity: [0, 1] }, { ...spring.morph, opacity: { duration: motionTokens.duration.fast } }).finished.then(() => {
        column.style.width = "";
        column.style.overflow = "";
      });
      enter(glyph, direction);
    }
    return { char, column, glyph };
  };

  const set = (next: string) => {
    const direction = value(next) < value(shown) ? -1 : 1;
    const characters = next.split("");
    // Columns are keyed from the right, so "9" to "10" keeps the ones column and opens a tens column.
    const before = columns;
    const result: Column[] = [];
    for (let index = 0; index < characters.length; index++) {
      const fromRight = characters.length - index;
      const old = before[before.length - fromRight];
      if (!old) {
        result.push(build(characters[index], direction, true));
      } else if (old.char === characters[index]) {
        result.push(old);
      } else {
        // The digit in this column changed: the old one rolls out, the new one rolls in.
        const leaving = old.glyph;
        popOut(leaving);
        old.column.style.position = "relative";
        const fresh = node("", characters[index]);
        old.column.append(fresh);
        if (reduced) leaving.remove();
        else animate(leaving, { opacity: [1, 0], y: [0, em(leaving, -0.6 * direction)], filter: [blur(0), blur(motionTokens.blur.subtle)] }, { ...spring.snappy, opacity: { duration: motionTokens.duration.fast }, filter: { duration: motionTokens.duration.fast } }).finished.then(() => leaving.remove());
        if (!reduced) enter(fresh, direction);
        old.glyph = fresh;
        old.char = characters[index];
        result.push(old);
      }
    }
    // Columns that are no longer needed close their width and leave.
    for (const gone of before.filter((column) => !result.includes(column))) {
      if (reduced) gone.column.remove();
      else {
        popOut(gone.column);
        animate(gone.column, { opacity: 0, width: 0 }, { ...spring.morph, opacity: { duration: motionTokens.duration.fast } }).finished.then(() => gone.column.remove());
      }
    }
    columns = result;
    host.append(...result.map((column) => column.column));
    shown = next;
  };

  columns = word.split("").map((char) => build(char, 1, false));
  host.append(...columns.map((column) => column.column));
  return { set, get word() { return shown; } };
}

/**
 * Words rise in and unblur while unchanged ones hold still. Assistive tech reads the plain copy (`srOnly`), the animated words are
 * hidden from it. A word is kept when its position and text match; counts keep their position and roll instead.
 */
function motionText(host: HTMLElement, text: string, classes: FieldMessageClasses, reduced: boolean) {
  type Word = { key: string; word: string; el: HTMLElement; roller?: ReturnType<typeof rolling> };
  const sr = node(classes.srOnly, text);
  const container = node(classes.words);
  container.setAttribute("aria-hidden", "true");
  host.replaceChildren(sr, container);
  let words: Word[] = [];

  const make = (word: string, index: number, last: boolean, animateIn: boolean): Word => {
    const el = node(classes.word);
    let roller: Word["roller"];
    if (isNumber(word)) roller = rolling(el, word, classes, reduced);
    else el.textContent = word;
    if (!last) el.append(" ");
    if (animateIn) {
      if (reduced) animate(el, { opacity: [0, 1] }, { duration: motionTokens.duration.instant });
      else animate(el, { opacity: [0, 1], y: [em(el, 0.35), 0], filter: [blur(motionTokens.blur.soft), blur(0)] }, { duration: motionTokens.duration.standard, ease: ease("enter") });
    }
    return { key: `${index}:${isNumber(word) ? "#" : word}`, word, el, roller };
  };

  const set = (next: string, animateIn: boolean) => {
    sr.textContent = next;
    const parts = next.split(" ");
    const before = words;
    const result = parts.map((word, index) => {
      const key = `${index}:${isNumber(word) ? "#" : word}`;
      const kept = before.find((entry) => entry.key === key);
      if (kept) {
        if (kept.roller && kept.word !== word) {
          kept.roller.set(word);
          kept.word = word;
        }
        return kept;
      }
      return make(word, index, index === parts.length - 1, animateIn);
    });
    for (const gone of before.filter((entry) => !result.includes(entry))) {
      if (reduced) {
        gone.el.remove();
        continue;
      }
      popOut(gone.el);
      animate(gone.el, { opacity: 0, y: em(gone.el, -0.35), filter: blur(motionTokens.blur.subtle) }, { duration: motionTokens.duration.exit, ease: ease("exit") }).finished.then(() => gone.el.remove());
    }
    words = result;
    container.append(...result.map((entry) => entry.el), ...before.filter((entry) => !result.includes(entry)).map((entry) => entry.el));
  };

  set(text, false);
  return { set: (next: string) => set(next, true) };
}

/**
 * `host` is an element with `display: contents` that the framework renders where the message goes; the message row is built
 * inside it. `id` is what the field points `aria-describedby` at.
 */
export function createFieldMessage(host: HTMLElement, { id, classes, alert = false, reduced }: { id?: string; classes: FieldMessageClasses; alert?: boolean; reduced: boolean }): FieldMessage {
  let slot: HTMLElement | undefined;
  let copy: HTMLElement | undefined;
  let text: ReturnType<typeof motionText> | undefined;
  let observer: ResizeObserver | undefined;
  let height: AnimationPlaybackControls | undefined;
  let current: string | undefined;
  let first = true;

  const open = (next: string, animateIn: boolean) => {
    slot = node(classes.messageSlot);
    copy = node(classes.copy);
    if (id) copy.id = id;
    if (alert) copy.setAttribute("role", "alert");
    slot.append(copy);
    const holder = node("");
    holder.style.display = "contents";
    copy.append(holder);
    text = motionText(holder, next, classes, reduced);
    host.append(slot);

    let measured = false;
    observer = new ResizeObserver(([entry]) => {
      const size = entry.borderBoxSize?.[0]?.blockSize ?? copy!.offsetHeight;
      height?.stop();
      if (!measured && animateIn && !reduced) {
        slot!.style.overflow = "hidden";
        height = animate(slot!, { height: [0, size], opacity: [0, 1] }, { height: motionTokens.spring.smooth, opacity: { duration: motionTokens.duration.fast } } as never);
        animate(copy!, { y: [em(copy!, 0.35), 0], filter: [blur(motionTokens.blur.soft), blur(0)] }, { duration: motionTokens.duration.standard, ease: ease("enter") });
      } else if (!measured || reduced) {
        slot!.style.height = `${size}px`;
      } else {
        height = animate(slot!, { height: size }, { height: motionTokens.spring.smooth } as never);
      }
      measured = true;
    });
    observer.observe(copy);
  };

  const close = () => {
    const leaving = slot;
    observer?.disconnect();
    height?.stop();
    slot = copy = text = observer = undefined;
    if (!leaving) return;
    if (reduced) leaving.remove();
    else animate(leaving, { height: 0, opacity: 0 }, { height: motionTokens.spring.smooth, opacity: { duration: motionTokens.duration.instant } } as never).finished.then(() => leaving.remove());
  };

  return {
    set(next) {
      const animateIn = !first;
      first = false;
      if (next === current) return;
      current = next;
      if (!next) return close();
      if (!slot) return open(next, animateIn);
      text?.set(next);
    },
    destroy() {
      observer?.disconnect();
      height?.stop();
      slot?.remove();
    },
  };
}
