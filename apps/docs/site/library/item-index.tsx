"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ItemCard, type ItemSummary } from "@/site/library/item-card";

export type IndexGroup = { title: string; items: ItemSummary[] };
export type IndexCategory = { title: string; groups: IndexGroup[] };

/**
 * The library index: one filter field across every item, then the generated categories as a grid.
 * Filtering is local so typing stays instant regardless of how many items the registry has.
 */
export function ItemIndex({
  base,
  categories,
  placeholder,
}: {
  base: "/components" | "/blocks";
  categories: IndexCategory[];
  placeholder: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;

    return categories
      .map((category) => ({
        ...category,
        groups: category.groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              [item.title, item.name, item.description, ...(item.tags ?? [])]
                .join(" ")
                .toLowerCase()
                .includes(needle),
            ),
          }))
          .filter((group) => group.items.length > 0),
      }))
      .filter((category) => category.groups.length > 0);
  }, [categories, query]);

  const total = filtered.reduce(
    (count, category) => count + category.groups.reduce((sum, group) => sum + group.items.length, 0),
    0,
  );

  return (
    <div className="grid gap-8">
      <label className="flex w-full items-center gap-2 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card px-3 py-2 transition-colors focus-within:border-fd-primary/60">
        <Search className="size-4 shrink-0 text-fd-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground"
        />
        <span className="shrink-0 text-xs tabular-nums text-fd-muted-foreground">{total}</span>
      </label>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-fd-muted-foreground">
          Nothing matches “{query}”.
        </p>
      ) : (
        filtered.map((category) => (
          <section key={category.title} className="grid gap-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">
                {category.title}
              </h2>
              <span className="h-px flex-1 bg-fd-border" />
              <span className="text-xs tabular-nums text-fd-muted-foreground">
                {category.groups.reduce((sum, group) => sum + group.items.length, 0)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {category.groups.map((group) => (
                <div key={group.title} className="grid gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <ItemCard key={item.name} item={item} base={base} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}