import type { ComponentType } from "react";

/**
 * Every React Native port found next to its React source, and every demo synced from the docs Usage snippets. Adding
 * `registry/components/foo/foo.rn.tsx` and `apps/docs/content/usage/foo.react-native.txt` is all it takes.
 */
const ports = import.meta.glob("../../../packages/manicat/registry/{components,blocks}/*/*.rn.tsx", { eager: false });
const demos = import.meta.glob<Record<string, unknown>>("./demos/*.tsx");

export type PortEntry = { name: string; kind: "components" | "blocks"; hasDemo: boolean };

export const entries: PortEntry[] = Object.keys(ports)
  .map((path) => {
    const [, kind, name, file] = /registry\/(components|blocks)\/([^/]+)\/([^/]+)\.rn\.tsx$/.exec(path) ?? [];
    return file === name ? { name, kind: kind as PortEntry["kind"], hasDemo: `./demos/${demoFile(name)}.tsx` in demos } : undefined;
  })
  .filter((entry): entry is PortEntry => Boolean(entry))
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

/** A snippet exports one function: the screen it draws. */
/** `example:<ExportName>` opens an example of an Examples section; anything else is the demo of that item. */
function demoFile(name: string) {
  return name.startsWith("example:") ? `example--${name.slice(8)}` : name;
}

export async function loadDemo(name: string): Promise<ComponentType | undefined> {
  const load = demos[`./demos/${demoFile(name)}.tsx`];
  if (!load) return undefined;
  const exports = await load();
  return Object.values(exports).find((value): value is ComponentType => typeof value === "function");
}
