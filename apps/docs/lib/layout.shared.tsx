import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { getComponentNames, getBlockNames } from "@/lib/registry";

export const site = {
  name: "Manicat UI",
  title: "Manicat UI",
  description:
    "Free, open source React components and blocks with calm motion. Install with the shadcn CLI or copy the code.",
  repository: "https://github.com/previraza/arc-library",
  upstream: "https://uiarc.dev",
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // Plain content: Fumadocs wraps the title in its own link, so nesting an <a> here would be invalid.
      title: (
        <span className="flex items-center gap-2 font-medium tracking-(--tracking-display)">
          <ManicatMark />
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
          { text: "Introduction", url: "/docs" },
          { text: "Installation", url: "/docs/installation" },
          { text: "Theming", url: "/docs/theming" },
          { text: "Motion", url: "/docs/motion" },
          { text: "AI", url: "/docs/ai" },
          { text: "Changelog", url: "/docs/changelog" },
        ],
      },
    ],
  };
}

/** The Manicat UI brand mark: a cat head with two ears, drawn with calm arcs. */
export function ManicatMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <path
        d="M18 6l7 17M46 6l-7 17"
        stroke="currentColor"
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      <path
        d="M15 30C15 12 49 12 49 30c0 13-7 22-17 22s-17-9-17-22Z"
        stroke="currentColor"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 36l5 4 5-4" stroke="currentColor" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const libraryCounts = {
  components: getComponentNames().length,
  blocks: getBlockNames().length,
};