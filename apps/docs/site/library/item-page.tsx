import Link from "next/link";
import { getItemReference } from "@/lib/item-reference";
import { getItemPath, getRelated, getSiblings, type RegistryItem } from "@/lib/registry";
import { ItemPreview } from "@/site/library/item-preview";
import { ItemTabs } from "@/site/library/item-tabs";
import { ItemCard } from "@/site/library/item-card";
import type { LibrarySection } from "@/site/library/library-sidebar";

const labels: Record<LibrarySection, string> = { components: "Components", blocks: "Blocks" };

/** The full page of a component or a block: preview, reference panel, related items and the pager. */
export async function ItemPage({ item, section }: { item: RegistryItem; section: LibrarySection }) {
  const { category, group } = getItemPath(item.name);
  const { previous, next } = getSiblings(item.name);
  const related = getRelated(item.name);
  const base = `/${section}`;

  return (
    <article className="grid gap-10">
      <header className="grid gap-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-fd-muted-foreground">
          <Link href={base} className="transition-colors hover:text-fd-foreground">
            {labels[section]}
          </Link>
          {category && (
            <>
              <span aria-hidden>/</span>
              <span>{category}</span>
            </>
          )}
          {group && (
            <>
              <span aria-hidden>/</span>
              <span>{group}</span>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-fd-foreground">{item.title}</span>
        </nav>

        <div className="grid gap-2">
          <h1 className="text-3xl font-medium tracking-(--tracking-display) text-fd-foreground sm:text-4xl">
            {item.title}
          </h1>
          <p className="max-w-2xl text-fd-muted-foreground">{item.description}</p>
        </div>

        {item.meta?.tags && item.meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-pill)] border border-fd-border px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-fd-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <section aria-label="Live preview" className="grid gap-3">
        <ItemPreview item={item} />
      </section>

      <ItemTabs {...(await getItemReference(item))} />

      {related.length > 0 && (
        <section className="grid gap-4">
          <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">Related</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((sibling) => (
              <ItemCard
                key={sibling.name}
                item={{ ...sibling, tags: sibling.meta?.tags }}
                base={section === "blocks" ? "/blocks" : "/components"}
              />
            ))}
          </div>
        </section>
      )}

      <nav aria-label="Pagination" className="grid gap-3 border-t border-fd-border pt-6 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`${base}/${previous.name}`}
            className="grid gap-1 rounded-[var(--radius-surface)] border border-fd-border p-4 transition-colors hover:border-fd-primary/50"
          >
            <span className="text-xs text-fd-muted-foreground">← Previous</span>
            <span className="font-medium text-fd-foreground">{previous.title}</span>
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {next && (
          <Link
            href={`${base}/${next.name}`}
            className="grid gap-1 justify-self-end rounded-[var(--radius-surface)] border border-fd-border p-4 text-right transition-colors hover:border-fd-primary/50 sm:w-full"
          >
            <span className="text-xs text-fd-muted-foreground">Next →</span>
            <span className="font-medium text-fd-foreground">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}