import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import { SiteSearch } from "@/site/library/search-dialog";

type Params = { slug?: string[] };

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}

export default async function Page(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const page = source.getPage(slug);

  if (!page) notFound();

  const MDX = page.data.body;
  const options = baseOptions();

  return (
    <DocsLayout
      tree={source.pageTree}
      {...options}
      nav={{ ...options.nav, children: <SiteSearch /> }}
      searchToggle={{ enabled: false }}
    >
      <DocsPage toc={page.data.toc} full={page.data.full}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}