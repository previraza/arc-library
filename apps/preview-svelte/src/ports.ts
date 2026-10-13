import type { Component } from "svelte";

/**
 * Every Svelte port found next to its React source, and every demo written for it. Adding `registry/components/foo/foo.svelte`
 * and `src/demos/foo.svelte` is all it takes: the viewer lists them on the next reload, nothing else is registered.
 */
const ports = import.meta.glob("../../../packages/manicat/registry/{components,blocks}/*/*.svelte", { eager: false });
const demos = import.meta.glob<{ default: Component }>("./demos/*.svelte");

export type PortEntry = { name: string; kind: "components" | "blocks"; hasDemo: boolean };

export const entries: PortEntry[] = Object.keys(ports)
  .map((path) => {
    const [, kind, name, file] = /registry\/(components|blocks)\/([^/]+)\/([^/]+)\.svelte$/.exec(path) ?? [];
    return file === name ? { name, kind: kind as PortEntry["kind"], hasDemo: `./demos/${demoFile(name)}.svelte` in demos } : undefined;
  })
  .filter((entry): entry is PortEntry => Boolean(entry))
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

/** `example:<ExportName>` opens an example of an Examples section; anything else is the demo of that item. */
function demoFile(name: string) {
  return name.startsWith("example:") ? `example--${name.slice(8)}` : name;
}

export async function loadDemo(name: string): Promise<Component | undefined> {
  const load = demos[`./demos/${demoFile(name)}.svelte`];
  return load ? (await load()).default : undefined;
}
