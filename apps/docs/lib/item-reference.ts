import { getApiTable, getItemFiles, readSource } from "@/lib/props";
import {
  getDependencies,
  getInstallCommand,
  getRegistryJsonUrl,
  getRegistryPayload,
  type RegistryItem,
} from "@/lib/registry";
import type { ItemTabsProps } from "@/site/library/item-tabs";

/** Everything the reference panel needs for an item, gathered on the server before it reaches the client. */
export function getItemReference(item: RegistryItem): ItemTabsProps {
  return {
    command: getInstallCommand(item.name),
    registryUrl: getRegistryJsonUrl(item.name),
    registryJson: getRegistryPayload(item),
    files: getItemFiles(item).map((file) => ({ ...file, source: readSource(file.path) })),
    api: getApiTable(item),
    dependencies: getDependencies(item).map((dependency) => ({
      name: dependency.name,
      title: dependency.title,
    })),
  };
}