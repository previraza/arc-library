import type { ComponentType } from "react";
import { getDemoSource, getExampleSources, type ExampleSource } from "@/lib/examples";
import { frameworksOf } from "@/lib/frameworks";
import type { RegistryItem } from "@/lib/registry";
import { demoLocations } from "@/site/demos/registry";
import { getExamples } from "@/site/examples/registry";
import { CodeBlock } from "@/site/library/code-block";
import { ExampleCard } from "@/site/library/example-card";
import { FrameworkSwitch } from "@/site/library/framework-switch";

/** "Usage": the code of the preview above, ready to paste. */
export async function ItemUsage({ item }: { item: RegistryItem }) {
  const location = demoLocations[item.name];
  const source = location && (await getDemoSource(location.file, location.exportName));
  if (!source) return null;

  const options = frameworksOf(item.meta);

  return (
    <section id="usage" className="grid scroll-mt-24 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">Usage</h2>
        <FrameworkSwitch options={options} />
      </div>
      <p className="text-sm text-fd-muted-foreground">
        Install the component, then copy this into your app. Every class and value below works as is; change the content and
        the props to fit your screen.
      </p>
      <CodeBlock label="example.tsx" lang="tsx" html={source.html} code={source.code} maxHeight={520} />
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
