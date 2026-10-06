import { blockGroups, componentGroups } from "@/lib/registry-groups";
import { getBlock, getBlockNames, getComponent, getComponentNames } from "@/lib/registry";
import type { IndexCategory, IndexGroup } from "@/site/library/item-index";

function toGroups(groups: { title: string; items: string[] }[]): IndexGroup[] {
  return groups
    .map((group) => ({
      title: group.title,
      items: group.items
        .map((name) => getComponent(name) ?? getBlock(name))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          tags: item.meta?.tags,
        })),
    }))
    .filter((group) => group.items.length > 0);
}

/** The grouped index of the Components section, generated from the registry groups in the README tables. */
export function getComponentIndex(): IndexCategory[] {
  const categories: IndexCategory[] = componentGroups.map((category) => ({
    title: category.title,
    groups: toGroups(category.groups),
  }));

  const listed = new Set(componentGroups.flatMap((category) => category.groups.flatMap((group) => group.items)));
  const orphans = getComponentNames().filter((name) => !listed.has(name));
  if (orphans.length > 0) {
    // An item missing from the README tables still has to be reachable from the site.
    categories.push({ title: "More", groups: toGroups([{ title: "Ungrouped", items: orphans }]) });
  }

  return categories.filter((category) => category.groups.length > 0);
}

/** The grouped index of the Blocks section. */
export function getBlockIndex(): IndexCategory[] {
  const categories: IndexCategory[] = [{ title: "Blocks", groups: toGroups(blockGroups) }];

  const listed = new Set(blockGroups.flatMap((group) => group.items));
  const orphans = getBlockNames().filter((name) => !listed.has(name));
  if (orphans.length > 0) {
    categories.push({ title: "More", groups: toGroups([{ title: "Ungrouped", items: orphans }]) });
  }

  return categories.filter((category) => category.groups.length > 0);
}