/**
 * Framework ports of a registry item, found by naming convention instead of being listed in registry.json.
 *
 * `frameworks.json` is the registry of formats: React is `*.tsx`, React Native `*.rn.tsx`, Vue `*.vue`, and so on. A file
 * placed next to an item's React source with one of those suffixes (`button/button.vue`, `button/button.swift`) is its port
 * for that framework. The build publishes each port as its own installable item named `<item>-<framework>`
 * (public/r/button-vue.json) and the docs site lists it in the framework switcher, with no other change.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { installTarget, installType } from "./registry-install.mjs";

export const frameworks = JSON.parse(await readFile(new URL("../frameworks.json", import.meta.url), "utf8"));
/** Frameworks other than the item's own React source. */
export const portFrameworks = frameworks.filter(framework => framework.id !== "react");

/** The folder holding an item's sources, or null for items that don't live in their own component/block folder. */
function itemFolder(item) {
  const main = item.files.find(file => file.path.endsWith(".tsx"));
  const folder = main && path.posix.dirname(main.path);
  return folder && /^registry\/(?:components|blocks)\/[^/]+$/.test(folder) ? folder : null;
}

/** The ports of an item: `{ framework, files }` for every framework that has at least one matching file in its folder. */
export async function discoverPorts(item) {
  const folder = itemFolder(item);
  if (!folder) return [];
  const names = (await readdir(folder)).sort();
  return portFrameworks
    .map(framework => ({ framework, files: names.filter(name => name.endsWith(framework.suffix)).map(name => `${folder}/${name}`) }))
    .filter(port => port.files.length > 0);
}

export const portName = (item, framework) => `${item.name}-${framework.id}`;

/** The shadcn registry item published for one port. `content` turns a source path into the payload embedded for it. */
export async function portPayload(item, { framework, files }, content) {
  const paths = [...files, ...(framework.shared ?? [])];
  // A port that imports a shared helper (`@/lib/phone`) ships that file too.
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/["']@\/lib\/([a-z0-9-]+)["']/g)) {
      const lib = `lib/${match[1]}.ts`;
      if (!paths.includes(lib) && await readFile(lib, "utf8").then(() => true, () => false)) paths.push(lib);
    }
  }
  // Swift has no imports between files, so a port names what it uses: `ManicatAvatar` is the avatar item, and a public type of
  // a lib file (`ManicatChart`) ships that file.
  const swiftSiblings = new Set();
  if (framework.id === "swift") {
    // The public types each Swift port declares tell which item a name belongs to.
    const known = new Map();
    for (const kind of ["components", "blocks"]) {
      for (const name of await readdir(`registry/${kind}`)) {
        const source = await readFile(`registry/${kind}/${name}/${name}.swift`, "utf8").catch(() => "");
        for (const match of source.matchAll(/public (?:struct|enum|final class|class|protocol) (Manicat\w+)/g)) known.set(match[1], name);
      }
    }
    const libs = [];
    for (const name of await readdir("lib")) {
      if (!name.endsWith(".swift") || (framework.shared ?? []).includes(`lib/${name}`)) continue;
      libs.push({ file: `lib/${name}`, types: [...(await readFile(`lib/${name}`, "utf8")).matchAll(/public (?:struct|enum|final class|class) (\w+)/g)].map(match => match[1]) });
    }
    for (const file of files) {
      const text = await readFile(file, "utf8");
      for (const [type, name] of known) if (name !== item.name && new RegExp(`\\b${type}\\b`).test(text)) swiftSiblings.add(name);
      for (const lib of libs) if (!paths.includes(lib.file) && lib.types.some(type => new RegExp(`\\b${type}\\b`).test(text))) paths.push(lib.file);
    }
  }
  // A port that imports another component's port (`@/registry/components/avatar/avatar.vue`) depends on that port's item.
  const siblings = new Set(swiftSiblings);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/["']@\/registry\/components\/([a-z0-9-]+)\//g)) if (match[1] !== item.name) siblings.add(match[1]);
  }
  // Extra npm packages a port needs are declared in its source: `// @manicat-dependencies react-native-svg`.
  const extra = new Set();
  for (const file of files) {
    for (const match of (await readFile(file, "utf8")).matchAll(/@manicat-dependencies[ \t]+([^\n*]+)/g)) for (const name of match[1].split(/[ ,]+/).filter(Boolean)) extra.add(name);
  }
  const registryDependencies = [
    ...(framework.registryDependencies ?? []),
    ...[...siblings].sort().map(name => `https://manicat.dev/r/${name}-${framework.id}.json`),
  ];
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: portName(item, framework),
    type: item.type,
    title: `${item.title} (${framework.label})`,
    description: item.description,
    dependencies: [...new Set([...(framework.dependencies ?? []), ...extra])],
    ...(registryDependencies.length ? { registryDependencies } : {}),
    files: await Promise.all(paths.map(async file => ({ path: file, type: installType(file), target: installTarget(file), content: await content(file) }))),
    ...(item.meta ? { meta: { ...item.meta, framework: framework.id, port: item.name } } : {}),
  };
}
