import { readdirSync } from "node:fs";
import { posix } from "node:path";
import registryFrameworks from "manicat/frameworks.json";
import { manicatRoot } from "@/lib/manicat-root";
import type { RegistryItem } from "@/lib/registry";

/**
 * The registry of formats lives in packages/manicat/frameworks.json (React is `*.tsx`, React Native `*.rn.tsx`, Vue `*.vue`…),
 * the same file the registry build reads. A file placed next to an item's React source with one of those suffixes is its
 * port for that framework: it is found here at build time, so adding `button.swift` is all it takes to enable Swift for Button.
 */
export type Framework = {
  id: string;
  label: string;
  suffix: string;
  lang: string;
  dependencies?: string[];
  registryDependencies?: string[];
  shared?: string[];
  classNamesProp?: string;
};

export type FrameworkId = string;

export const frameworks: Framework[] = registryFrameworks;
export const reactFramework = frameworks[0];

export type ItemPort = {
  framework: Framework;
  /** The item published for this port, e.g. button-vue. */
  name: string;
  /** Source files of the port, relative to the package root. */
  files: string[];
  /** Everything an install writes: the files above plus the framework's shared files. */
  installs: { path: string; target: string; type: string }[];
};

/** Mirror of scripts/registry-install.mjs: where a package file installs in a project. */
function installTarget(file: string): string {
  if (file.startsWith("registry/components/")) return `@components/manicat/${file.slice("registry/components/".length)}`;
  if (file.startsWith("registry/")) return `@components/manicat/${file.slice("registry/".length)}`;
  return `@components/manicat/${file}`;
}

const cache = new Map<string, ItemPort[]>();

/** The framework ports found on disk for an item, in the order of frameworks.json. */
export function getPorts(item: RegistryItem): ItemPort[] {
  // Cached for a build; in dev a new file shows up on the next request.
  const hit = process.env.NODE_ENV === "production" ? cache.get(item.name) : undefined;
  if (hit) return hit;

  const main = item.files.find((file) => file.path.endsWith(".tsx"))?.path;
  const folder = main && posix.dirname(main);
  let names: string[] = [];
  if (folder && /^registry\/(?:components|blocks)\/[^/]+$/.test(folder)) {
    try {
      names = readdirSync(`${manicatRoot}/${folder}`).sort();
    } catch {
      names = [];
    }
  }

  const ports = frameworks
    .filter((framework) => framework.id !== reactFramework.id)
    .map((framework) => {
      const files = names.filter((name) => name.endsWith(framework.suffix)).map((name) => `${folder}/${name}`);
      const paths = [...files, ...(framework.shared ?? [])];
      return {
        framework,
        name: `${item.name}-${framework.id}`,
        files,
        installs: paths.map((path) => ({
          path,
          target: installTarget(path),
          type: path.startsWith("lib/") ? "registry:lib" : "registry:component",
        })),
      };
    })
    .filter((port) => port.files.length > 0);

  cache.set(item.name, ports);
  return ports;
}

/** The frameworks an item is available in, React first. */
export function frameworksOf(item: RegistryItem): { id: FrameworkId; label: string }[] {
  return [reactFramework, ...getPorts(item).map((port) => port.framework)].map(({ id, label }) => ({ id, label }));
}
