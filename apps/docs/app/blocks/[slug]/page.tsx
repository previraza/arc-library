import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlock, getBlockNames } from "@/lib/registry";
import { LibraryShell } from "@/site/library/library-shell";
import { FrameworkFromRequest } from "@/site/library/use-framework";
import { ItemPage } from "@/site/library/item-page";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getBlockNames().map((name) => ({ slug: name }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const item = getBlock(slug);
  if (!item) notFound();

  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: `/blocks/${item.name}` },
  };
}

export default async function Page(props: { params: Promise<Params>; searchParams: Promise<{ framework?: string | string[] }> }) {
  const { slug } = await props.params;
  const { framework } = await props.searchParams;
  const item = getBlock(slug);

  if (!item) notFound();

  return (
    <LibraryShell section="blocks" active={item.name}>
      <FrameworkFromRequest id={framework}>
        <ItemPage item={item} section="blocks" />
      </FrameworkFromRequest>
    </LibraryShell>
  );
}