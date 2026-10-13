"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { FrameworkId } from "@/lib/frameworks";
import { FrameworkSwitch } from "@/site/library/framework-switch";
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
export function FrameworkPreview({ name, options, children }: { name: string; options: { id: FrameworkId; label: string }[]; children: ReactNode }) {
  const [framework] = useFramework(options);
  if (framework === "react" || options.length < 2) return <div className="grid gap-3">{options.length > 1 && <Bar options={options} />}{children}</div>;

  const viewer = viewers[framework];
  const label = options.find((option) => option.id === framework)?.label ?? framework;

  return (
    <div className="grid gap-3">
      <Bar options={options} />
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
        {viewer?.url ? (
          <iframe key={`${framework}-${name}`} title={`${name} in ${label}`} src={`${viewer.url}/?embed#${name}`} loading="lazy" className="w-full border-0" style={{ height: viewer.height }} />
        ) : (
          <p className="p-8 text-sm text-fd-muted-foreground">
            {framework === "swift"
              ? "Swift runs as a native app: open apps/preview-swift in Xcode (or `swift run`) and pick this item. The Usage tab has the code."
              : `No preview for ${label}.`}
          </p>
        )}
      </div>
      {viewer?.url && (
        <a href={`${viewer.url}/#${name}`} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground">
          Open in the {label} viewer <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </div>
  );
}

function Bar({ options }: { options: { id: FrameworkId; label: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-fd-muted-foreground">Preview</span>
      <FrameworkSwitch options={options} />
    </div>
  );
}
