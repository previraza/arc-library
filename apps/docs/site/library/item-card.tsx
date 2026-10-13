import Link from "next/link";
import type { RegistryItem } from "@/lib/registry";
import { getDemoNames } from "@/site/demos/registry";
import { CardPreview } from "@/site/library/card-preview";

const demoNames = new Set(getDemoNames());

export type ItemSummary = Pick<RegistryItem, "name" | "title" | "description"> & { tags?: string[] };

/**
 * Card of an item in the library index: the real demo, shrunk and not clickable, then the name and one line.
 * The demo loads in a lazy iframe, so a page of a hundred cards only loads the ones that scroll into view.
 */
export function ItemCard({ item, base }: { item: ItemSummary; base: "/components" | "/blocks" }) {
  const hasDemo = demoNames.has(item.name);

  return (
    <Link
      href={`${base}/${item.name}`}
      className="group grid content-start overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-card transition-colors hover:border-fd-primary/50"
    >
      <div
        aria-hidden
        className="relative aspect-[16/10] overflow-hidden border-b border-fd-border bg-fd-background"
        style={{ backgroundImage: "radial-gradient(color-mix(in oklab, var(--color-fd-foreground) 7%, transparent) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      >
        {hasDemo ? (
          <CardPreview name={item.name} />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-xs text-fd-muted-foreground">Preview coming</span>
        )}
      </div>
      <div className="grid gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-fd-foreground">{item.title}</span>
          <span aria-hidden className="text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary">
            →
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-fd-muted-foreground">{item.description}</p>
      </div>
    </Link>
  );
}
