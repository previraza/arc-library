import type { ComponentType } from "react";
import { getDemoSource, getExampleSources, readUsage, type ExampleSource } from "@/lib/examples";
import { getPorts, reactFramework } from "@/lib/frameworks";
import { highlight } from "@/lib/highlight";
import type { RegistryItem } from "@/lib/registry";
import { demoLocations } from "@/site/demos/registry";
import { getExamples } from "@/site/examples/registry";
import { ExampleCard } from "@/site/library/example-card";
import { UsagePanels, type UsagePanel } from "@/site/library/usage-panels";

/** "Usage": the code of the preview above for React, and a hand-written snippet per other framework found in content/usage. */
export async function ItemUsage({ item }: { item: RegistryItem }) {
  const location = demoLocations[item.name];
  const react = location && (await getDemoSource(location.file, location.exportName));
  const panels: UsagePanel[] = [];

  if (react) panels.push({ id: reactFramework.id, label: reactFramework.label, fileName: "example.tsx", lang: "tsx", code: react.code, html: react.html });

  for (const port of getPorts(item)) {
    const code = readUsage(item.name, port.framework.id);
    if (!code) continue;
    panels.push({
      id: port.framework.id,
      label: port.framework.label,
      fileName: `example${port.framework.suffix}`,
      lang: port.framework.lang,
      code,
      html: await highlight(code, port.framework.lang),
    });
  }

  if (panels.length === 0) return null;

  return (
    <section id="usage" className="scroll-mt-24">
      <UsagePanels panels={panels} />
    </section>
  );
}

type LoadedExample = { source: ExampleSource; Component: ComponentType };

/** The examples of an item with their copyable source, loaded once so the page and its table of contents agree. */
export async function loadExamples(item: RegistryItem): Promise<LoadedExample[]> {
  const entries = getExamples(item.name);

  return (
    await Promise.all(
      [...Map.groupBy(entries, (entry) => entry.file)].map(async ([file, group]) => {
        const sources = await getExampleSources(file, group.map((entry) => entry.exportName));
        return sources.map((source) => ({ source, Component: group.find((entry) => entry.exportName === source.exportName)!.Component }));
      }),
    )
  ).flat();
}

/** "Examples": concrete scenarios, each a live render with its own copyable file. */
export function ItemExamples({ examples }: { examples: LoadedExample[] }) {
  if (examples.length === 0) return null;

  return (
    <section id="examples" className="grid scroll-mt-24 gap-8">
      <div className="grid gap-1">
        <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">Examples</h2>
        <p className="text-sm text-fd-muted-foreground">
          Real screens rather than isolated props. Switch to Code to copy a whole example into your project.
        </p>
      </div>
      {examples.map(({ source, Component }) => (
        <ExampleCard
          key={source.exportName}
          id={source.exportName}
          title={source.title}
          description={source.description}
          fileName={`${source.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.tsx`}
          code={source.code}
          html={source.html}
        >
          <Component />
        </ExampleCard>
      ))}
    </section>
  );
}
