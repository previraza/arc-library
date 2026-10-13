"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { FrameworkId } from "@/lib/frameworks";
import { FrameworkSwitch } from "@/site/library/framework-switch";
import { useFramework } from "@/site/library/use-framework";

/**
 * Where each viewer runs. Set `NEXT_PUBLIC_VIEWER_URL_<ID>` (for example `NEXT_PUBLIC_VIEWER_URL_VUE=https://vue.ds.viraza.net`)
 * on a deploy; in development the viewers of `pnpm dev` are used. Swift has no web viewer: it is a native app.
 */
const viewers: Record<string, { label: string; url: string | undefined; height: number }> = {
  vue: { label: "Vue", url: process.env.NEXT_PUBLIC_VIEWER_URL_VUE ?? (process.env.NODE_ENV === "development" ? "http://localhost:3002" : undefined), height: 420 },
  svelte: { label: "Svelte", url: process.env.NEXT_PUBLIC_VIEWER_URL_SVELTE ?? (process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined), height: 420 },
  "react-native": { label: "React Native", url: process.env.NEXT_PUBLIC_VIEWER_URL_REACT_NATIVE ?? (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined), height: 820 },
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
              : `The ${label} viewer is not configured on this site. Run it with pnpm dev, or set NEXT_PUBLIC_VIEWER_URL_${framework.toUpperCase().replace("-", "_")}.`}
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
