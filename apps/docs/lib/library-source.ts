import { loader } from "fumadocs-core/source";
import type { StructuredData } from "fumadocs-core/mdx-plugins";
import { blockGroups, componentGroups } from "@/lib/registry-groups";
import registry from "manicat/registry.json";

type Item = (typeof registry.items)[number];

const items = registry.items as Item[];
const byName = new Map(items.map((item) => [item.name, item]));

/**
 * Component and block pages are generated from registry.json instead of living in content/docs, so adding an item to the
 * registry is enough to publish its page, its sidebar entry and its search record.
 *
 * Virtual paths are flat (`components/button.mdx`) to match the published URLs; the category and
 * group stay on the record so the sidebar can nest them.
 */
type LibraryPageData = {
  title: string;
  description: string;
  name: string;
  kind: "component" | "block";
  category?: string;
  group?: string;
  tags: string[];
  structuredData: StructuredData;
};

function toPage(path: string, item: Item, category?: string, group?: string) {
  return {
    type: "page" as const,
    path,
    data: {
      title: item.title,
      description: item.description,
      name: item.name,
      kind: item.type === "registry:block" ? ("block" as const) : ("component" as const),
      category,
      group,
      tags: item.meta?.tags ?? [],
      structuredData: {
        headings: [],
        contents: [
          {
            heading: undefined,
            content: [item.title, item.description, (item.dependencies ?? []).join(" "), (item.meta?.tags ?? []).join(" ")].join(
              " ",
            ),
          },
        ],
      },
    } satisfies LibraryPageData,
  };
}

const files = [
  ...componentGroups.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.items
        .map((name) => byName.get(name))
        .filter((item): item is Item => Boolean(item))
        .map((item) => toPage(`components/${item.name}.mdx`, item, category.title, group.title)),
    ),
  ),
  ...blockGroups.flatMap((group) =>
    group.items
      .map((name) => byName.get(name))
      .filter((item): item is Item => Boolean(item))
      .map((item) => toPage(`blocks/${item.name}.mdx`, item, undefined, group.title)),
  ),
];

export const library = loader({
  baseUrl: "/",
  source: { files },
});

export type LibraryPage = ReturnType<typeof library.getPage>;