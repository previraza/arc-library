import { source } from "@/lib/source";
import { blockGroups, componentGroups } from "@/lib/registry-groups";
import { getItem } from "@/lib/registry";

export type SearchEntry = {
  title: string;
  description: string;
  url: string;
  section: string;
  keywords: string;
};

let cache: SearchEntry[] | undefined;

/**
 * One flat index for the whole site: the docs pages and every registry item. Built once per process and searched
 * in memory, so the dialog answers without a query language and without a database.
 */
export function getSearchIndex(): SearchEntry[] {
  if (cache) return cache;

  const docs: SearchEntry[] = source.getPages().map((page) => ({
    title: page.data.title,
    description: page.data.description ?? "",
    url: page.url,
    section: "Docs",
    keywords: page.data.title,
  }));

  const components: SearchEntry[] = componentGroups.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.items
        .map((name) => getItem(name))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          title: item.title,
          description: item.description,
          url: `/components/${item.name}`,
          section: `Components › ${category.title}`,
          keywords: [item.name, item.title, group.title, (item.meta?.tags ?? []).join(" ")].join(" "),
        })),
    ),
  );

  const blocks: SearchEntry[] = blockGroups.flatMap((group) =>
    group.items
      .map((name) => getItem(name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        title: item.title,
        description: item.description,
        url: `/blocks/${item.name}`,
        section: `Blocks › ${group.title}`,
        keywords: [item.name, item.title, group.title, (item.meta?.tags ?? []).join(" ")].join(" "),
      })),
  );

  cache = [...docs, ...components, ...blocks];
  return cache;
}

/** Ranked search over the index: title hits first, then keyword hits, capped for the dialog. */
export function search(query: string, limit = 14): SearchEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];

  for (const entry of getSearchIndex()) {
    const title = entry.title.toLowerCase();
    const keywords = entry.keywords.toLowerCase();

    let score = 0;
    if (title === needle) score = 100;
    else if (title.startsWith(needle)) score = 80;
    else if (title.includes(needle)) score = 60;
    else if (keywords.includes(needle)) score = 30;
    else continue;

    scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map(({ entry }) => entry);
}