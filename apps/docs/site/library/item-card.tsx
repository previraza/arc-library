import Link from "next/link";
import type { RegistryItem } from "@/lib/registry";
import { getDemoNames } from "@/site/demos/registry";

const demoNames = new Set(getDemoNames());

export type ItemSummary = Pick<RegistryItem, "name" | "title" | "description"> & { tags?: string[] };

/** Grid card of an item in the library index. */
export function ItemCard({ item, base }: { item: ItemSummary; base: "/components" | "/blocks" }) {
  return (
    <Link
      href={`${base}/${item.name}`}
      className="group grid gap-2 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/50 hover:bg-fd-secondary/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-fd-foreground">{item.title}</span>
        <span
          aria-hidden
          className="text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary"
        >
          →
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-fd-muted-foreground">{item.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {item.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-[var(--radius-pill)] border border-fd-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-fd-muted-foreground"
          >
            {tag}
          </span>
        ))}
        {demoNames.has(item.name) && (
          <span className="rounded-[var(--radius-pill)] bg-fd-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fd-primary">
            Live demo
          </span>
        )}
      </div>
    </Link>
  );
}