"use client";

import type { FrameworkId } from "@/lib/frameworks";
import { useFramework } from "@/site/library/use-framework";

/** Picks the framework a snippet is shown for. Only frameworks the item ships for are listed; the choice is remembered. */
export function FrameworkSwitch({ options }: { options: { id: FrameworkId; label: string }[] }) {
  const [value, setValue] = useFramework(options);

  return (
    <div role="tablist" aria-label="Framework" className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          role="tab"
          type="button"
          aria-selected={value === option.id}
          onClick={() => setValue(option.id)}
          className="rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:bg-fd-accent aria-selected:text-fd-foreground"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
