"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { FrameworkId } from "@/lib/frameworks";
import { useState } from "react";
import { CodeBlock } from "@/site/library/code-block";
import { FrameworkSwitch } from "@/site/library/framework-switch";
import type { UsagePanel } from "@/site/library/usage-panels";
import { useFramework } from "@/site/library/use-framework";

/**
 * Where each viewer is framed from: this site's own /preview/<framework> (a rewrite in next.config.ts to the viewer's server),
 * so visitors never need to reach the viewers' ports. Swift has no web viewer: it is a native app.
 */
const viewers: Record<string, { label: string; url: string; height: number }> = {
  vue: { label: "Vue", url: "/preview/vue", height: 420 },
  svelte: { label: "Svelte", url: "/preview/svelte", height: 420 },
  "react-native": { label: "React Native", url: "/preview/react-native", height: 820 },
};

/**
 * The preview of an item for the framework picked in the switcher. React is the live preview of this site; Vue, Svelte and
 * React Native load the demo (the Usage snippet) from their viewer; Swift explains how to run it.
 */
export function FrameworkPreview({ name, options, codes, children }: { name: string; options: { id: FrameworkId; label: string }[]; codes?: UsagePanel[]; children: ReactNode }) {
  const [framework] = useFramework(options);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const panel = codes?.find((entry) => entry.id === framework);
  if (framework === "react" || options.length < 2) return <div className="grid gap-3">{options.length > 1 && <Bar options={options} />}{children}</div>;

  const viewer = viewers[framework];
  const label = options.find((option) => option.id === framework)?.label ?? framework;

  return (
    <div className="grid gap-3">
      <Bar options={options} tabs={panel ? { tab, setTab } : undefined} />
      {panel && tab === "code" ? (
        <CodeBlock label={panel.fileName} lang={panel.lang} html={panel.html} code={panel.code} maxHeight={520} />
      ) : (
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
        {viewer?.url ? (
          <iframe key={`${framework}-${name}`} title={`${name} in ${label}`} src={`${viewer.url}/?embed#${name}`} loading="lazy" className="w-full border-0" style={{ height: name.startsWith("example:") ? viewer.height + 100 : viewer.height }} />
        ) : (
          <p className="p-8 text-sm text-fd-muted-foreground">
            {framework === "swift"
              ? "Swift runs as a native app: open apps/preview-swift in Xcode (or `swift run`) and pick this item. The Usage tab has the code."
              : `No preview for ${label}.`}
          </p>
        )}
      </div>
      )}
      {viewer?.url && tab === "preview" && (
        <a href={`${viewer.url}/#${name}`} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground">
          Open in the {label} viewer <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </div>
  );
}

function Bar({ options, tabs }: { options: { id: FrameworkId; label: string }[]; tabs?: { tab: "preview" | "code"; setTab: (tab: "preview" | "code") => void } }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {tabs ? (
        <div role="tablist" aria-label="Example" className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
          {(["preview", "code"] as const).map((id) => (
            <button key={id} role="tab" type="button" aria-selected={tabs.tab === id} onClick={() => tabs.setTab(id)} className="rounded-[var(--radius-pill)] px-3 py-1 text-xs capitalize text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:bg-fd-accent aria-selected:text-fd-foreground">
              {id}
            </button>
          ))}
        </div>
      ) : (
        <span className="text-xs text-fd-muted-foreground">Preview</span>
      )}
      <FrameworkSwitch options={options} />
    </div>
  );
}
