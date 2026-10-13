import type { Component } from "vue";

/**
 * Every Vue port found next to its React source, and every demo synced from the docs Usage snippets. Adding
 * `registry/components/foo/foo.vue` and `apps/docs/content/usage/foo.vue.txt` is all it takes: the viewer lists them on
 * the next reload, nothing else is registered.
 */
const ports = import.meta.glob("../../../packages/manicat/registry/{components,blocks}/*/*.vue", { eager: false });
const demos = import.meta.glob<{ default: Component }>("./demos/*.vue");

export type PortEntry = { name: string; kind: "components" | "blocks"; hasDemo: boolean };

export const entries: PortEntry[] = Object.keys(ports)
  .map((path) => {
    const [, kind, name, file] = /registry\/(components|blocks)\/([^/]+)\/([^/]+)\.vue$/.exec(path) ?? [];
    return file === name ? { name, kind: kind as PortEntry["kind"], hasDemo: `./demos/${name}.vue` in demos } : undefined;
  })
  .filter((entry): entry is PortEntry => Boolean(entry))
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

export async function loadDemo(name: string): Promise<Component | undefined> {
  const load = demos[`./demos/${name}.vue`];
  return load ? (await load()).default : undefined;
}
