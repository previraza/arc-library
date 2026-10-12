"use client";

import { useState, type ReactNode } from "react";
import { CodeBlock } from "@/site/library/code-block";

export type ExampleCardProps = {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  code: string;
  html?: string;
  /** The live, rendered example. */
  children: ReactNode;
  /** Plain surface without the dot grid, for examples that draw their own background. */
  bare?: boolean;
};

/** One example: a title, then the live render and the exact code behind it, ready to paste into an app. */
export function ExampleCard({ id, title, description, fileName, code, html, children, bare }: ExampleCardProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <section id={id} className="grid scroll-mt-24 gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-base font-medium text-fd-foreground">{title}</h3>
          {description && <p className="max-w-2xl text-sm text-fd-muted-foreground">{description}</p>}
        </div>
        <div role="tablist" aria-label={`${title} view`} className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
          {(["preview", "code"] as const).map((name) => (
            <button
              key={name}
              role="tab"
              type="button"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className="rounded-[var(--radius-pill)] px-3 py-1 text-xs capitalize text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:bg-fd-accent aria-selected:text-fd-foreground"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Both panes stay mounted: switching tabs must not reset the example's state. */}
      <div hidden={tab !== "preview"}>
        <div
          className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-6 sm:p-10"
          style={
            bare
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(color-mix(in oklab, var(--color-fd-foreground) 8%, transparent) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }
          }
        >
          <div className="relative z-10 flex w-full max-w-2xl items-center justify-center">{children}</div>
        </div>
      </div>
      <div hidden={tab !== "code"}>
        <CodeBlock label={fileName} lang="tsx" html={html} code={code} maxHeight={520} />
      </div>
    </section>
  );
}
