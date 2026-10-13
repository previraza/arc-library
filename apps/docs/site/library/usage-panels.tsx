"use client";

import { CodeBlock } from "@/site/library/code-block";
import { FrameworkSwitch } from "@/site/library/framework-switch";
import { useFramework } from "@/site/library/use-framework";

export type UsagePanel = { id: string; label: string; fileName: string; lang: string; code: string; html?: string };

/** The usage snippet for the framework the visitor picked; the choice is shared with the switcher in the reference panel. */
export function UsagePanels({ panels }: { panels: UsagePanel[] }) {
  const [framework] = useFramework(panels);
  const panel = panels.find((entry) => entry.id === framework) ?? panels[0];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">Usage</h2>
        {panels.length > 1 && <FrameworkSwitch options={panels} />}
      </div>
      <p className="text-sm text-fd-muted-foreground">
        Install the component, then copy this into your app. Change the content and the props to fit your screen.
        {panel.id !== panels[0].id && " The live previews on this page render the React version."}
      </p>
      <CodeBlock label={panel.fileName} lang={panel.lang} html={panel.html} code={panel.code} maxHeight={520} />
    </div>
  );
}
