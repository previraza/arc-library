import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComponent, getComponentNames } from "@/lib/registry";
import { LibraryShell } from "@/site/library/library-shell";
import { ItemPage } from "@/site/library/item-page";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getComponentNames().map((name) => ({ slug: name }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const item = getComponent(slug);
  if (!item) notFound();

  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: `/components/${item.name}` },
  };
}

export default async function Page(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const item = getComponent(slug);

  if (!item) notFound();

  return (
    <LibraryShell section="components" active={item.name}>
      <ItemPage item={item} section="components" />
    </LibraryShell>
  );
}