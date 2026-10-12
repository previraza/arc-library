"use client";

import type { FrameworkId } from "@/lib/frameworks";

/** Picks the framework a snippet is shown for. Only frameworks the item ships for are listed. */
export function FrameworkSwitch({
  options,
  value,
  onChange,
}: {
  options: { id: FrameworkId; label: string }[];
  value: FrameworkId;
  onChange?: (id: FrameworkId) => void;
}) {
  return (
    <div role="tablist" aria-label="Framework" className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          role="tab"
          type="button"
          aria-selected={value === option.id}
          onClick={() => onChange?.(option.id)}
          className="rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:bg-fd-accent aria-selected:text-fd-foreground"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
