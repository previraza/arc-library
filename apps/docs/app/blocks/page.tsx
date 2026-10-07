import type { Metadata } from "next";
import { getBlockIndex } from "@/lib/index-view";
import { libraryCounts } from "@/lib/layout.shared";
import { LibraryShell } from "@/site/library/library-shell";
import { ItemIndex } from "@/site/library/item-index";

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Whole sections to drop into a page: sign-in, pricing, dashboards and more, built from Manicat UI components.",
};

export default function BlocksPage() {
  const categories = getBlockIndex();

  return (
    <LibraryShell section="blocks">
      <div className="grid gap-10">
        <header className="grid max-w-2xl gap-3">
          <h1 className="text-3xl font-medium tracking-(--tracking-display) text-fd-foreground sm:text-4xl">
            Blocks
          </h1>
          <p className="text-fd-muted-foreground">
            {libraryCounts.blocks} composed sections built from Manicat UI components. Install a block the same way as a
            component, and everything it depends on comes with it.
          </p>
        </header>

        <ItemIndex base="/blocks" categories={categories} placeholder="Search blocks…" />
      </div>
    </LibraryShell>
  );
}