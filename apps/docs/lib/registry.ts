import registry from "manicat/registry.json";
import { blockGroups, componentGroups } from "@/lib/registry-groups";

export type RegistryItem = {
  name: string;
  type: "registry:ui" | "registry:block" | "registry:item" | "registry:theme";
  title: string;
  description: string;
  categories?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; type: string; target: string }[];
  docs?: string;
  meta?: {
    tier?: string;
    kind?: "component" | "block";
    docs?: string;
    markdown?: string;
    tags?: string[];
  };
};

export type Category = {
  title: string;
  groups: { title: string; items: RegistryItem[] }[];
  count: number;
};

export type BlockGroup = { title: string; items: RegistryItem[] };

const items = registry.items as RegistryItem[];

/** The origin this site publishes, used for install commands and copy buttons. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const byName = new Map(items.map((item) => [item.name, item]));
const componentItems = items.filter((item) => item.type === "registry:ui");
const blockItems = items.filter((item) => item.type === "registry:block");

export function getItem(name: string): RegistryItem | undefined {
  return byName.get(name);
}

export function getComponent(name: string): RegistryItem | undefined {
  const item = byName.get(name);
  return item?.type === "registry:ui" ? item : undefined;
}

export function getBlock(name: string): RegistryItem | undefined {
  const item = byName.get(name);
  return item?.type === "registry:block" ? item : undefined;
}

export function getComponentNames(): string[] {
  return componentItems.map((item) => item.name);
}

export function getBlockNames(): string[] {
  return blockItems.map((item) => item.name);
}

export function getCategories(): Category[] {
  return componentGroups.map((category) => {
    const groups = category.groups.map((group) => ({
      title: group.title,
      items: group.items.map((name) => byName.get(name)).filter((item): item is RegistryItem => Boolean(item)),
    }));
    return { title: category.title, groups, count: groups.reduce((total, group) => total + group.items.length, 0) };
  });
}

export function getCategoryItems(category: string): RegistryItem[] {
  return componentItems.filter((item) => item.categories?.includes(category));
}

export function getBlockGroups(): BlockGroup[] {
  return blockGroups.map((group) => ({
    title: group.title,
    items: group.items.map((name) => byName.get(name)).filter((item): item is RegistryItem => Boolean(item)),
  }));
}

/** Items an install pulls along, resolved from registryDependencies, manicat-foundation first. */
export function getDependencies(item: RegistryItem): RegistryItem[] {
  const resolved = (item.registryDependencies ?? [])
    .map((dependency) => {
      const match = /\/r\/(.+?)\.json$/.exec(dependency);
      return match ? byName.get(match[1]) : undefined;
    })
    .filter((dependency): dependency is RegistryItem => Boolean(dependency));
  return resolved.filter((dependency) => dependency.name !== item.name);
}

export function getRegistryJsonUrl(name: string): string {
  return `${siteUrl}/r/${name}.json`;
}

/** Published origins that predate this site having its own domain: the upstream fork and this project's own name. */
const publishedOrigins = ["https://uiarc.dev", "https://manicat.dev"];

/**
 * Re-points a link written for a published origin at this site, so the docs links, the registry payloads and the
 * installable dependencies all resolve to the instance the visitor is reading.
 */
export function selfLink(url: string): string {
  const origin = publishedOrigins.find((origin) => url.startsWith(origin));
  return origin ? siteUrl + url.slice(origin.length) : url;
}

/** The payload this site publishes for an item. File contents stay in the .json, so the tab shows structure only. */
export function getRegistryPayload(item: RegistryItem): string {
  const payload = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    ...(item.registryDependencies ? { registryDependencies: item.registryDependencies.map(selfLink) } : {}),
    ...(item.docs ? { docs: selfLink(item.docs) } : {}),
    ...(item.meta ? { meta: { ...item.meta, ...(item.meta.docs ? { docs: selfLink(item.meta.docs) } : {}) } } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export function getInstallCommand(name: string, packageManager = "npx shadcn@latest"): string {
  return `${packageManager} add ${siteUrl}/r/${name}.json`;
}

export function getCounts() {
  return {
    components: componentItems.length,
    blocks: blockItems.length,
    total: items.length,
  };
}

/** Where an item sits in the sidebar tree, for breadcrumbs on its page. */
export function getItemPath(name: string): { category?: string; group?: string } {
  for (const category of componentGroups) {
    for (const group of category.groups) {
      if (group.items.includes(name)) return { category: category.title, group: group.title };
    }
  }
  for (const group of blockGroups) {
    if (group.items.includes(name)) return { group: group.title };
  }
  return {};
}

/** Sibling items of the same category, used by the prev/next pager and the related grid. */
export function getSiblings(name: string): { previous?: RegistryItem; next?: RegistryItem } {
  const ordered = [
    ...componentGroups.flatMap((category) => category.groups.flatMap((group) => group.items)),
    ...blockGroups.flatMap((group) => group.items),
  ];
  const index = ordered.indexOf(name);
  if (index < 0) return {};
  const previous = index > 0 ? byName.get(ordered[index - 1]) : undefined;
  const next = index < ordered.length - 1 ? byName.get(ordered[index + 1]) : undefined;
  return { previous, next };
}

export function getRelated(name: string, limit = 4): RegistryItem[] {
  const item = byName.get(name);
  if (!item) return [];
  const sameCategory = componentItems.filter((candidate) => candidate.categories?.[0] === item.categories?.[0]);
  const related = sameCategory.filter((candidate) => candidate.name !== name).slice(0, limit);
  if (related.length >= limit) return related;
  const rest = items.filter(
    (candidate) => candidate.name !== name && candidate.type === item.type && !related.includes(candidate),
  );
  return [...related, ...rest].slice(0, limit);
}