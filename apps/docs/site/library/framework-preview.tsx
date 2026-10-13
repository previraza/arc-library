"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { FrameworkId } from "@/lib/frameworks";
import { CodeBlock } from "@/site/library/code-block";
import { FrameworkSwitch } from "@/site/library/framework-switch";
import { PreviewShell } from "@/site/library/preview-shell";
import { PreviewSkeleton } from "@/site/library/preview-skeleton";
import type { UsagePanel } from "@/site/library/usage-panels";
import { useFramework } from "@/site/library/use-framework";

/**
 * Where each viewer is framed from: this site's own /preview/<framework> (a rewrite in next.config.ts to the viewer's server),
 * so visitors never need to reach the viewers' ports. Swift has no web viewer: it is a native app.
 */
const viewers: Record<string, { label: string; url: string; height: number }> = {
  vue: { label: "Vue", url: "/preview/vue", height: 420 },
  svelte: { label: "Svelte", url: "/preview/svelte", height: 420 },
  "react-native": { label: "React Native", url: "/preview/react-native", height: 420 },
};

/**
 * The preview of an item for the framework picked in the switcher. React is the live preview of this site; Vue, Svelte and
 * React Native load the demo (the Usage snippet) from their viewer, in the same Fit / Mobile / fullscreen shell, so a React
 * Native screen can be seen at the width of the page as well as in a phone; Swift explains how to run it.
 */
export function FrameworkPreview({ name, options, codes, children }: { name: string; options: { id: FrameworkId; label: string }[]; codes?: UsagePanel[]; children: ReactNode }) {
  const [framework] = useFramework(options);
  const [loadedKey, setLoadedKey] = useState("");
  const panel = codes?.find((entry) => entry.id === framework);

  if (framework === "react" || options.length < 2) return <div className="grid gap-3">{options.length > 1 && <Bar options={options} />}{children}</div>;

  const viewer = viewers[framework];
  const label = options.find((option) => option.id === framework)?.label ?? framework;
  const key = `${framework}-${name}`;
  const src = viewer ? `${viewer.url}/?embed#${name}` : undefined;
  const loaded = loadedKey === key;

  return (
    <div className="grid gap-3">
      <Bar options={options} />
      {src ? (
        <PreviewShell label={`${name} in ${label}`} frameSrc={src} code={panel ? <CodeBlock label={panel.fileName} lang={panel.lang} html={panel.html} code={panel.code} maxHeight={520} /> : undefined}>
          <div className="relative w-full overflow-hidden rounded-[var(--radius-surface)]" style={{ height: name.startsWith("example:") ? viewer.height + 100 : viewer.height }}>
            {!loaded && <PreviewSkeleton />}
            <iframe key={key} title={`${name} in ${label}`} src={src} loading="lazy" onLoad={() => setLoadedKey(key)} className={`relative h-full w-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
          </div>
        </PreviewShell>
      ) : (
        <div className="rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-8 text-sm text-fd-muted-foreground">
          {framework === "swift" ? "Swift runs as a native app: open apps/preview-swift in Xcode (or `swift run`) and pick this item. The Usage tab has the code." : `No preview for ${label}.`}
        </div>
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
