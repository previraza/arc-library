import { getPorts, reactFramework, type ItemPort } from "@/lib/frameworks";
import { highlight, languageOf } from "@/lib/highlight";
import { getApiTable, getItemFiles, readSource } from "@/lib/props";
import {
  getDependencies,
  getInstallCommand,
  getItem,
  getRegistryJsonUrl,
  getRegistryPayload,
  selfLink,
  siteUrl,
  type RegistryItem,
} from "@/lib/registry";
import type { FrameworkRef, ItemTabsProps, SourceFile } from "@/site/library/item-tabs";

async function toSourceFile(file: { path: string; target: string; type: string }): Promise<SourceFile> {
  const code = readSource(file.path) ?? "";
  const lang = languageOf(file.path);

  return { ...file, lang, code, html: await highlight(code, lang) };
}

/** Dependencies shown under "Also installs": the foundation items a port's registryDependencies point at. */
function dependencyOf(url: string): { name: string; title: string } | undefined {
  const name = /\/r\/(.+?)\.json$/.exec(url)?.[1];
  const found = name ? getItem(name) : undefined;
  return found ? { name: found.name, title: found.title } : undefined;
}

async function reactReference(item: RegistryItem): Promise<FrameworkRef> {
  const registryJson = getRegistryPayload(item);

  return {
    id: reactFramework.id,
    label: reactFramework.label,
    command: getInstallCommand(item.name),
    registryUrl: getRegistryJsonUrl(item.name),
    registryJson,
    registryHtml: await highlight(registryJson, "json"),
    files: await Promise.all(getItemFiles(item).map(toSourceFile)),
    api: getApiTable(item),
    dependencies: getDependencies(item).map((dependency) => ({ name: dependency.name, title: dependency.title })),
    classNamesProp: reactFramework.classNamesProp ?? "classNames",
  };
}

async function portReference(item: RegistryItem, port: ItemPort): Promise<FrameworkRef> {
  const { framework } = port;
  // The same structure the published port item has; file contents stay in the .json.
  const registryJson = JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: port.name,
      type: item.type,
      title: `${item.title} (${framework.label})`,
      description: item.description,
      dependencies: framework.dependencies ?? [],
      ...(framework.registryDependencies ? { registryDependencies: framework.registryDependencies.map(selfLink) } : {}),
      files: port.installs,
      meta: { ...item.meta, framework: framework.id, port: item.name },
    },
    null,
    2,
  );
  const mainFile = port.files.find((file) => /\.(?:tsx|vue)$/.test(file));

  return {
    id: framework.id,
    label: framework.label,
    command: getInstallCommand(port.name),
    registryUrl: `${siteUrl}/r/${port.name}.json`,
    registryJson,
    registryHtml: await highlight(registryJson, "json"),
    files: await Promise.all(port.installs.map(toSourceFile)),
    api: mainFile ? getApiTable(item, mainFile) : undefined,
    dependencies: (framework.registryDependencies ?? []).map(dependencyOf).filter((dependency) => dependency !== undefined),
    classNamesProp: framework.classNamesProp ?? "classNames",
  };
}

/** Everything the reference panel needs for an item, per framework, gathered and highlighted on the server before it reaches the client. */
export async function getItemReference(item: RegistryItem): Promise<ItemTabsProps> {
  const frameworks = await Promise.all([reactReference(item), ...getPorts(item).map((port) => portReference(item, port))]);

  return { frameworks };
}
