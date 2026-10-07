"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export type CodeBlockProps = {
  /** The file path or title shown in the header. */
  label?: string;
  lang?: string;
  /** Highlighted markup produced on the server. When missing, the raw code is shown instead. */
  html?: string;
  /** Exact text the copy button writes to the clipboard. */
  code: string;
  /** Caps the pane so a long file doesn't push the rest of the page away. */
  maxHeight?: number;
};

/** A formatted, copyable code area: header with the file name and language, then the highlighted body. */
export function CodeBlock({ label, lang, html, code, maxHeight }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: select the text so it can still be copied by hand.
      const selection = window.getSelection();
      const range = document.createRange();
      const body = document.getElementById(`code-${label ?? lang ?? "source"}`);
      if (selection && body) {
        range.selectNodeContents(body);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  return (
    <div className="arc-code overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-card px-3 py-1.5">
        <span className="min-w-0 truncate font-mono text-[11px] text-fd-muted-foreground">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          {lang && (
            <span className="rounded-[var(--radius-pill)] border border-fd-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-fd-muted-foreground">
              {lang}
            </span>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-fd-border px-2 py-0.5 text-[11px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            {copied ? <Check className="size-3 text-fd-primary" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div
        id={label ? `code-${label}` : undefined}
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
        dangerouslySetInnerHTML={html ? { __html: html } : undefined}
      >
        {html ? null : <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">{code}</pre>}
      </div>
    </div>
  );
}