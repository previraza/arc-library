import Link from "next/link";
import { blockGroups, componentGroups } from "@/lib/registry-groups";
import { getItem } from "@/lib/registry";

export type LibrarySection = "components" | "blocks";

/**
 * The nested navigation of a library section. Structure comes from the generated registry groups, so a new item
 * shows up here as soon as it lands in registry.json and the README tables.
 */
export function LibrarySidebar({ section, active }: { section: LibrarySection; active?: string }) {
  const base = `/${section}`;
  const tree =
    section === "components"
      ? componentGroups.map((category) => ({
          title: category.title,
          count: category.groups.reduce((total, group) => total + group.items.length, 0),
          groups: category.groups,
        }))
      : [{ title: "Blocks", count: blockGroups.reduce((total, group) => total + group.items.length, 0), groups: blockGroups }];

  return (
    <nav aria-label={`${section} navigation`} className="grid gap-6">
      {tree.map((category) => (
        <div key={category.title} className="grid gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-fd-foreground">{category.title}</h2>
            <span className="text-xs tabular-nums text-fd-muted-foreground">{category.count}</span>
          </div>

          <div className="grid gap-4">
            {category.groups.map((group) => (
              <div key={group.title} className="grid gap-1">
                <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground/80">
                  {group.title}
                </p>
                <ul className="grid gap-0.5">
                  {group.items.map((name) => {
                    const item = getItem(name);
                    if (!item) return null;
                    const isActive = active === name;

                    return (
                      <li key={name}>
                        <Link
                          href={`${base}/${name}`}
                          aria-current={isActive ? "page" : undefined}
                          className={`block rounded-[var(--radius-surface)] px-2 py-1 text-sm transition-colors ${
                            isActive
                              ? "bg-fd-secondary font-medium text-fd-secondary-foreground"
                              : "text-fd-muted-foreground hover:text-fd-foreground"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}