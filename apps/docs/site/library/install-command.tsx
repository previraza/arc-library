"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: select the text instead of failing silently.
      const field = document.getElementById("install-command");
      if (field instanceof HTMLInputElement) field.select();
    }
  }

  return (
    <div className="flex items-stretch gap-px overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-card">
      <input
        id="install-command"
        readOnly
        value={command}
        onFocus={(event) => event.currentTarget.select()}
        aria-label="Install command"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-xs text-fd-foreground outline-none"
      />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
        className="flex shrink-0 items-center gap-1.5 border-l border-fd-border px-3 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        {copied ? <Check className="size-3.5 text-fd-primary" /> : <Copy className="size-3.5" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}