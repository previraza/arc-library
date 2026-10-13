// @manicat-dependencies motion
/**
 * What the code block needs besides its markup, for the Vue and Svelte ports: the lightweight highlighter, the file name whose box
 * follows its width on a spring, and the source area that follows its content height. The counterparts of `highlight`, `FileName`
 * and the height effect in code-block.tsx.
 */
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export type TokenKind = "comment" | "string" | "number" | "keyword" | "type" | "function" | "property" | "tag" | "punctuation";
export interface Token {
  text: string;
  kind?: TokenKind;
}

const keywordPattern = /^(?:abstract|as|async|await|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|of|private|protected|public|readonly|return|set|static|switch|throw|try|type|typeof|var|void|while|with|yield|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)$/;
const literalPattern = /^(?:true|false|null|undefined|NaN|Infinity)$/;
const typePattern = /^(?:Array|Boolean|Date|Error|Map|Number|Promise|Record|Set|String|ReactNode|HTMLElement|HTMLButtonElement|Event|unknown|never|void|any|boolean|number|string|object)$/;
const tokenPattern = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$-]*\b|[{}[\]();,.<>:=+*/!?|&-]/g;

export const normaliseLanguage = (language: string) => language.toLowerCase().replace(/^\./, "");

function tokenKind(value: string, source: string, index: number, language: string): TokenKind | undefined {
  if (value.startsWith("//") || value.startsWith("/*") || value.startsWith("<!--")) return "comment";
  if (value.startsWith('"') || value.startsWith("'") || value.startsWith("`")) {
    return language === "json" && /^\s*:/.test(source.slice(index + value.length)) ? "property" : "string";
  }
  if (/^\d/.test(value)) return "number";
  if (keywordPattern.test(value) || literalPattern.test(value)) return "keyword";
  if (typePattern.test(value)) return "type";
  if (/^[{}[\]();,.<>:=+*/!?|&-]$/.test(value)) return "punctuation";

  const before = source.slice(0, index);
  const after = source.slice(index + value.length);
  if ((language === "tsx" || language === "jsx" || language === "html" || language === "vue") && /<\/?$/.test(before)) return "tag";
  if (/^\s*\(/.test(after) && language !== "json") return "function";
  if ((language === "css" || language === "tsx" || language === "jsx") && /^\s*[:=]/.test(after)) return "property";
  return undefined;
}

/** Splits `code` into plain runs and highlighted tokens. */
export function highlight(code: string, language: string): Token[] {
  const parts: Token[] = [];
  let cursor = 0;
  for (const match of code.matchAll(tokenPattern)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (cursor < index) parts.push({ text: code.slice(cursor, index) });
    parts.push({ text: value, kind: tokenKind(value, code, index, language) });
    cursor = index + value.length;
  }
  if (cursor < code.length) parts.push({ text: code.slice(cursor) });
  return parts;
}

/** A new file name swaps in while its box follows the new width on a spring, then returns to auto so it can still truncate. */
export function createFileWidth(box: HTMLElement, sizer: HTMLElement, reduced: boolean) {
  let rest = 0;
  const width = motionValue<number | "auto">("auto");
  width.on("change", (value) => (box.style.width = typeof value === "number" ? `${value}px` : value));
  let controls: AnimationPlaybackControls | undefined;
  const observer = new ResizeObserver(() => (rest = sizer.offsetWidth));
  observer.observe(sizer);
  return {
    /** Call after the name changed and the DOM has the new one. */
    update() {
      controls?.stop();
      const moving = width.get();
      const to = sizer.offsetWidth;
      const from = typeof moving === "number" ? moving : rest;
      rest = to;
      if (reduced || !from || !to || Math.abs(from - to) < 1) return width.jump("auto");
      width.jump(from);
      controls = animate(width, to, { ...motionTokens.spring.morph, onComplete: () => width.jump("auto") } as never);
    },
    destroy() {
      observer.disconnect();
      controls?.stop();
    },
  };
}

/** The source area follows its content on a spring: expanding, collapsing, and new code all resize smoothly. */
export function createCodeHeight(viewport: HTMLElement, pre: HTMLElement, { maxLines, open, reduced }: { maxLines?: number; open: boolean; reduced: boolean }) {
  let measured: { full: number; collapsed: number } | null = null;
  let target = { open, reduced };
  const height = motionValue<number | null>(null);
  height.on("change", (value) => (viewport.style.height = value === null ? (target.open ? "" : "var(--code-collapsed)") : `${value}px`));
  // Before the first measurement the clip height comes from CSS, so the first paint is already collapsed.
  viewport.style.height = open ? "" : "var(--code-collapsed)";
  let run: AnimationPlaybackControls | undefined;
  const settle = (instant: boolean) => {
    if (!measured) return;
    const next = target.open ? measured.full : measured.collapsed;
    run?.stop();
    if (instant || target.reduced || typeof height.get() !== "number") height.jump(next);
    else run = animate(height as never, next, motionTokens.spring.smooth as never);
  };
  const observer = new ResizeObserver(() => {
    const style = getComputedStyle(pre);
    const full = pre.offsetHeight;
    const collapsed = maxLines ? Math.min(full, Math.round(maxLines * parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom))) : full;
    const first = !measured;
    measured = { full, collapsed };
    settle(first);
  });
  observer.observe(pre);
  return {
    setOpen(next: boolean, nextReduced = reduced) {
      target = { open: next, reduced: nextReduced };
      settle(false);
    },
    destroy() {
      observer.disconnect();
      run?.stop();
    },
  };
}
