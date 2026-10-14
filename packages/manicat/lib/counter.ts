// @manicat-dependencies motion
/**
 * The odometer of the animated counter, for the Vue and Svelte ports. Every digit is a wheel that always turns in the direction the
 * whole number moved and wraps 9 to 0; a gained or lost digit opens or closes its column. Columns are keyed by place value, so
 * 999 to 1,000 keeps the ones column the ones column. The counterpart of `Column`, `Glyph` and `partsFor` in animated-counter.tsx.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

type Part = { key: string; digit: number; order: number } | { key: string; text: string };
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const reveal = { ...motionTokens.spring.smooth, visualDuration: motionTokens.duration.considered };

/** Split a formatted number into columns keyed by place value. */
function partsFor(value: number, decimals: number, locale: string): Part[] {
  const parts = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, numberingSystem: "latn" }).formatToParts(value);
  let place = parts.reduce((count, part) => count + (part.type === "integer" ? part.value.length : 0), 0);
  let fraction = 0;
  let order = 0;
  return parts.flatMap((part, index): Part[] => {
    if (part.type === "integer") return [...part.value].map((char) => ({ key: `i${--place}`, digit: Number(char), order: order++ }));
    if (part.type === "fraction") return [...part.value].map((char) => ({ key: `f${fraction++}`, digit: Number(char), order: order++ }));
    return [{ key: part.type === "group" ? `g${place}` : part.type === "decimal" ? "d" : `${part.type}${index}`, text: part.value }];
  });
}

export interface CounterClasses {
  value: string;
  symbol: string;
  column: string;
  glyph: string;
  sizer: string;
}

export interface CounterOptions {
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
  locale: string;
  animateOnView: boolean;
  reduced: boolean;
  /** Takes the digits that are off the wheel out of the accessibility and text tree, as the animated counter does. On by default. */
  hideOffWheel?: boolean;
  classes: CounterClasses;
}

const make = (className: string, text?: string) => {
  const span = document.createElement("span");
  span.className = className;
  if (text !== undefined) span.textContent = text;
  return span;
};

export function createCounter(host: HTMLElement, srOnly: HTMLElement, initial: CounterOptions) {
  let options = initial;
  let direction = 1;
  let previous = options.value;
  let armed = options.animateOnView;
  type Column = { key: string; node: HTMLElement; position: { value: number; run?: AnimationPlaybackControls }; state: { digit: number; target: number; revealed: boolean }; glyphs: HTMLElement[]; digit: number };
  const columns = new Map<string, Column>();
  const symbols = new Map<string, HTMLElement>();
  const prefix = make(options.classes.symbol);
  const suffix = make(options.classes.symbol);
  host.replaceChildren(prefix, suffix);

  const offset = (digit: number, position: number) => ((((digit - position) % 10) + 15) % 10) - 5;
  const draw = (column: Column) => {
    column.glyphs.forEach((glyph, digit) => {
      const o = offset(digit, column.position.value);
      const far = Math.abs(o) >= 1;
      glyph.style.transform = `translateY(${o}em)`;
      glyph.style.opacity = String(Math.max(0, 1 - Math.abs(o)));
      if (options.hideOffWheel !== false) glyph.style.visibility = far ? "hidden" : "visible";
      glyph.style.filter = Math.abs(o) < 0.02 || far ? "none" : `blur(${(Math.abs(o) * motionTokens.blur.subtle).toFixed(2)}px)`;
    });
  };

  const buildColumn = (part: Extract<Part, { digit: number }>): Column => {
    const node = make(options.classes.column);
    node.append(make(options.classes.sizer, "0"));
    const glyphs = DIGITS.map((digit) => make(options.classes.glyph, String(digit)));
    node.append(...glyphs);
    const start = armed ? 0 : part.digit;
    const column: Column = { key: part.key, node, position: { value: start }, state: { digit: start, target: start, revealed: !armed }, glyphs, digit: part.digit };
    draw(column);
    return column;
  };

  const turn = (column: Column, part: Extract<Part, { digit: number }>) => {
    const state = column.state;
    column.digit = part.digit;
    if (armed || state.digit === part.digit) {
      if (!armed) state.revealed = true;
      return;
    }
    state.target += direction < 0 && state.revealed ? -((state.digit - part.digit + 10) % 10) : (part.digit - state.digit + 10) % 10;
    state.digit = part.digit;
    column.position.run?.stop();
    const delay = Math.min(part.order * motionTokens.stagger.item, 0.25);
    if (options.reduced) {
      column.position.value = state.target;
      draw(column);
    } else {
      column.position.run = animate(column.position.value, state.target, { ...(state.revealed ? motionTokens.spring.smooth : { ...reveal, delay }), onUpdate: (value: number) => ((column.position.value = value), draw(column)) });
    }
    state.revealed = true;
  };

  const render = () => {
    const parts = partsFor(options.value, options.decimals, options.locale);
    const text = `${options.prefix}${parts.map((part) => ("text" in part ? part.text : part.digit)).join("")}${options.suffix}`;
    srOnly.textContent = text;
    prefix.textContent = options.prefix;
    suffix.textContent = options.suffix;
    prefix.style.display = options.prefix ? "" : "none";
    suffix.style.display = options.suffix ? "" : "none";
    const keep = new Set(parts.map((part) => part.key));
    const nodes: HTMLElement[] = [];
    for (const part of parts) {
      if ("digit" in part) {
        let column = columns.get(part.key);
        if (!column) {
          column = buildColumn(part);
          columns.set(part.key, column);
          if (!options.reduced && columns.size > 0 && initialized) opening(column.node);
        }
        turn(column, part);
        nodes.push(column.node);
      } else {
        let symbol = symbols.get(part.key);
        if (!symbol) {
          symbol = make(options.classes.symbol, part.text);
          symbols.set(part.key, symbol);
          if (!options.reduced && initialized) opening(symbol);
        }
        symbol.textContent = part.text;
        nodes.push(symbol);
      }
    }
    // A column or separator that is no longer needed closes its width and leaves.
    for (const [key, column] of [...columns]) {
      if (keep.has(key)) continue;
      columns.delete(key);
      closing(column.node);
    }
    for (const [key, symbol] of [...symbols]) {
      if (keep.has(key)) continue;
      symbols.delete(key);
      closing(symbol);
    }
    host.replaceChildren(prefix, ...nodes, suffix, ...closingNodes);
  };

  const closingNodes = new Set<HTMLElement>();
  let initialized = false;
  const opening = (node: HTMLElement) => {
    const spring = options.reduced ? { duration: 0 } : { ...motionTokens.spring.morph, opacity: { duration: motionTokens.duration.fast } };
    queueMicrotask(() => {
      const natural = node.offsetWidth;
      animate(node, { width: [0, natural], opacity: [0, 1] }, spring as never).finished.then(() => (node.style.width = ""));
    });
  };
  const closing = (node: HTMLElement) => {
    if (options.reduced) return node.remove();
    closingNodes.add(node);
    node.style.position = "absolute";
    animate(node, { width: 0, opacity: 0 }, { ...motionTokens.spring.morph, opacity: { duration: motionTokens.duration.fast } } as never).finished.then(() => {
      closingNodes.delete(node);
      node.remove();
    });
  };

  // With animateOnView the digits sit at zero until the counter has been seen for the first time.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || !armed) return;
      armed = false;
      observer.disconnect();
      for (const column of columns.values()) {
        const part: Extract<Part, { digit: number }> = { key: column.key, digit: column.digit, order: [...columns.keys()].indexOf(column.key) };
        column.state.digit = 0;
        turn(column, part);
      }
    },
    { threshold: 0.6 },
  );
  if (armed) observer.observe(host);

  render();
  initialized = true;

  return {
    update(next: CounterOptions) {
      options = next;
      if (next.value !== previous) {
        direction = next.value > previous ? 1 : -1;
        previous = next.value;
      }
      render();
    },
    destroy() {
      observer.disconnect();
      for (const column of columns.values()) column.position.run?.stop();
    },
  };
}
