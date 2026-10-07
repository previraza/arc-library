import { highlight, languageOf } from "@/lib/highlight";
import { getApiTable, getItemFiles, readSource } from "@/lib/props";
import {
  getDependencies,
  getInstallCommand,
  getRegistryJsonUrl,
  getRegistryPayload,
  type RegistryItem,
} from "@/lib/registry";
import type { ItemTabsProps, SourceFile } from "@/site/library/item-tabs";

async function toSourceFile(file: { path: string; target: string; type: string }): Promise<SourceFile> {
  const code = readSource(file.path) ?? "";
  const lang = languageOf(file.path);

  return { ...file, lang, code, html: await highlight(code, lang) };
}

/** Everything the reference panel needs for an item, gathered and highlighted on the server before it reaches the client. */
export async function getItemReference(item: RegistryItem): Promise<ItemTabsProps> {
  const registryJson = getRegistryPayload(item);

  return {
    command: getInstallCommand(item.name),
    registryUrl: getRegistryJsonUrl(item.name),
    registryJson,
    registryHtml: await highlight(registryJson, "json"),
    files: await Promise.all(getItemFiles(item).map(toSourceFile)),
    api: getApiTable(item),
    dependencies: getDependencies(item).map((dependency) => ({
      name: dependency.name,
      title: dependency.title,
    })),
  };
}