import Link from "next/link";
import type { Metadata } from "next";
import { componentGroups, blockGroups } from "@/lib/registry-groups";
import { getCounts, getComponentNames, getBlockNames, getInstallCommand, getItem } from "@/lib/registry";
import { ManicatMark, libraryCounts, site } from "@/lib/layout.shared";
import { SiteHeader } from "@/site/library/site-header";
import { Button } from "manicat/registry/components/button/button";
import { ButtonGroup } from "manicat/registry/components/button-group/button-group";
import { Badge } from "manicat/registry/components/badge/badge";
import { ThemeSwitchDemo } from "@/site/demos/actions";
import { SegmentedControlDemo } from "@/site/demos/inputs";

export const metadata: Metadata = {
  title: "Manicat UI — React components with calm motion",
  description: site.description,
};

const featured = ["button", "segmented-control", "theme-switch", "badge"];

export default function HomePage() {
  const counts = getCounts();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-fd-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background: [
                "radial-gradient(60% 55% at 18% 12%, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)",
                "radial-gradient(50% 45% at 82% 0%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 72%)",
                "radial-gradient(80% 60% at 50% 120%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%)",
              ].join(", "),
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in oklab, var(--color-fd-foreground) 14%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(to bottom, black, transparent 80%)",
            }}
          />

          <div className="relative mx-auto grid w-full max-w-screen-2xl gap-8 px-4 py-20 sm:px-6 sm:py-28">
            <div className="grid max-w-3xl gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">Open source</Badge>
                <Badge>MIT</Badge>
                <Badge tone="success">shadcn CLI</Badge>
              </div>

              <h1 className="text-4xl font-medium tracking-(--tracking-display) text-fd-foreground sm:text-6xl">
                Components that move like they mean it.
              </h1>

              <p className="max-w-2xl text-lg text-fd-muted-foreground">
                {site.description} Built on Motion, typed end to end, and yours to edit: every file lands in your
                codebase.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/docs/installation"
                  className="rounded-[var(--radius-control)] bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
                >
                  Get started
                </Link>
                <Link
                  href="/components"
                  className="rounded-[var(--radius-control)] border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-secondary"
                >
                  Browse {libraryCounts.components} components
                </Link>
              </div>

              <div className="grid gap-1 pt-4 font-mono text-xs text-fd-muted-foreground sm:grid-cols-2">
                <span>{getInstallCommand("button")}</span>
                <span className="text-fd-foreground/70">{counts.total} items · {counts.blocks} blocks</span>
              </div>
            </div>

            <div className="grid gap-4 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card/70 p-5 backdrop-blur sm:max-w-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
                  Live, right here on this page
                </p>
                <ThemeSwitchDemo />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <SegmentedControlDemo />
                <ButtonGroup
                  label="Range"
                  size="sm"
                  items={[
                    { id: "day", label: "Day" },
                    { id: "week", label: "Week" },
                    { id: "month", label: "Month" },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {componentGroups.map((category) => (
            <Link
              key={category.title}
              href="/components"
              className="grid gap-2 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-fd-foreground">{category.title}</span>
                <span className="text-xs tabular-nums text-fd-muted-foreground">
                  {category.groups.reduce((total, group) => total + group.items.length, 0)}
                </span>
              </div>
              <p className="text-sm text-fd-muted-foreground">{category.groups.map((group) => group.title).join(" · ")}</p>
            </Link>
          ))}
        </section>

        <section className="mx-auto grid w-full max-w-screen-2xl gap-6 border-t border-fd-border px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-2">
              <h2 className="text-2xl font-medium tracking-(--tracking-display) text-fd-foreground">
                {libraryCounts.blocks} blocks, ready to drop in
              </h2>
              <p className="max-w-2xl text-fd-muted-foreground">
                Full sections composed from components. Installing one pulls everything it needs.
              </p>
            </div>
            <Link href="/blocks" className="text-sm text-fd-primary hover:underline">
              All blocks →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blockGroups.flatMap((group) => group.items).slice(0, 6).map((name) => {
              const item = getItem(name);
              if (!item) return null;

              return (
                <Link
                  key={name}
                  href={`/blocks/${name}`}
                  className="grid gap-2 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50"
                >
                  <span className="font-medium text-fd-foreground">{item.title}</span>
                  <span className="line-clamp-2 text-sm text-fd-muted-foreground">{item.description}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-screen-2xl gap-6 border-t border-fd-border px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-2">
              <h2 className="text-2xl font-medium tracking-(--tracking-display) text-fd-foreground">
                Featured components
              </h2>
              <p className="max-w-2xl text-fd-muted-foreground">
                A few to start with. Each page carries a live preview, the source and a generated API table.
              </p>
            </div>
            <Link href="/components" className="text-sm text-fd-primary hover:underline">
              All components →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((name) => {
              const item = getItem(name);
              if (!item) return null;

              return (
                <Link
                  key={name}
                  href={`/components/${name}`}
                  className="grid gap-2 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50"
                >
                  <span className="font-medium text-fd-foreground">{item.title}</span>
                  <span className="line-clamp-3 text-sm text-fd-muted-foreground">{item.description}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-fd-border">
          <div className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
            {[
              {
                title: "Yours to edit",
                body: "Files land in your project through the shadcn CLI. No runtime dependency, no wrapper you can't read.",
              },
              {
                title: "Typed from source",
                body: "Every API table on this site is parsed from the component itself, so it can never drift from the code.",
              },
              {
                title: "Motion with restraint",
                body: "Spring presets, reduced-motion fallbacks and shared timing tokens keep the whole UI in step.",
              },
            ].map((feature) => (
              <div key={feature.title} className="grid gap-2">
                <div className="flex items-center gap-2">
                  <ManicatMark size={18} className="text-fd-primary" />
                  <h3 className="font-medium text-fd-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-fd-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-fd-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <ManicatMark size={18} />
            {site.name} · {getComponentNames().length} components · {getBlockNames().length} blocks
          </span>
          <span className="flex gap-4">
            <Link href="/docs" className="hover:text-fd-foreground">
              Docs
            </Link>
            <Link href="/components" className="hover:text-fd-foreground">
              Components
            </Link>
            <Link href="/blocks" className="hover:text-fd-foreground">
              Blocks
            </Link>
            <a href={site.repository} target="_blank" rel="noreferrer noopener" className="hover:text-fd-foreground">
              GitHub
            </a>
          </span>
          <span className="text-xs text-fd-muted-foreground/70">
            Fork of <a href={site.upstream} target="_blank" rel="noreferrer noopener" className="hover:text-fd-foreground">Arc</a>, by Elia Kuratli.
          </span>
        </div>
      </footer>
    </div>
  );
}