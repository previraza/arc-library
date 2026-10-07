import type { Metadata } from "next";
import { getComponentIndex } from "@/lib/index-view";
import { libraryCounts } from "@/lib/layout.shared";
import { LibraryShell } from "@/site/library/library-shell";
import { ItemIndex } from "@/site/library/item-index";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every Manicat UI component, grouped by what it does: actions, inputs, disclosure, feedback, navigation and data display.",
};

export default function ComponentsPage() {
  const categories = getComponentIndex();

  return (
    <LibraryShell section="components">
      <div className="grid gap-10">
        <header className="grid max-w-2xl gap-3">
          <h1 className="text-3xl font-medium tracking-(--tracking-display) text-fd-foreground sm:text-4xl">
            Components
          </h1>
          <p className="text-fd-muted-foreground">
            {libraryCounts.components} components with calm motion, ready to install with the shadcn CLI or copy by
            hand. Every item ships its source, its API reference and a live preview.
          </p>
        </header>

        <ItemIndex base="/components" categories={categories} placeholder="Search components…" />
      </div>
    </LibraryShell>
  );
}