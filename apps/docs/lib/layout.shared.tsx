import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { getComponentNames, getBlockNames } from "@/lib/registry";

export const site = {
  name: "Arc",
  title: "Arc",
  description:
    "Free, open source React components and blocks with calm motion. Install with the shadcn CLI or copy the code.",
  repository: "https://github.com/kuratlielia/arc-library",
  upstream: "https://uiarc.dev",
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // Plain content: Fumadocs wraps the title in its own link, so nesting an <a> here would be invalid.
      title: (
        <span className="flex items-center gap-2 font-medium tracking-(--tracking-display)">
          <ArcMark />
          <span>{site.name}</span>
        </span>
      ),
      url: "/",
    },
    githubUrl: site.repository,
    links: [
      { text: "Components", url: "/components", active: "nested-url" },
      { text: "Blocks", url: "/blocks", active: "nested-url" },
      { text: "Docs", url: "/docs", active: "nested-url" },
      {
        type: "menu",
        text: "More",
        items: [
          { text: "Introduction", url: "/docs/introduction" },
          { text: "Installation", url: "/docs/installation" },
          { text: "Theming", url: "/docs/theming" },
          { text: "Motion", url: "/docs/motion" },
          { text: "Changelog", url: "/docs/changelog" },
        ],
      },
    ],
  };
}

/** The Arc brand mark: two arcs crossing. */
export function ArcMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <path
        d="M14 52C14 30 24 12 40 12c6 0 10 3 10 8 0 12-12 24-24 24-6 0-12-3-12-8"
        stroke="currentColor"
        strokeWidth={5.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const libraryCounts = {
  components: getComponentNames().length,
  blocks: getBlockNames().length,
};