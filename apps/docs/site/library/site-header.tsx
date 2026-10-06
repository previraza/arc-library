"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "fumadocs-ui/provider/base";
import { Moon, Sun } from "lucide-react";
import { SiteSearch } from "@/site/library/search-dialog";
import { ArcMark, site } from "@/lib/layout.shared";

const links = [
  { text: "Docs", url: "/docs" },
  { text: "Components", url: "/components" },
  { text: "Blocks", url: "/blocks" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-fd-border bg-fd-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-medium tracking-(--tracking-display)">
          <ArcMark />
          <span>{site.name}</span>
        </Link>

        <nav aria-label="Primary" className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              pathname === link.url ||
              (link.url !== "/docs" && pathname.startsWith(`${link.url}/`)) ||
              (link.url === "/docs" && pathname.startsWith("/docs"));

            return (
              <Link
                key={link.url}
                href={link.url}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-fd-secondary text-fd-secondary-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }`}
              >
                {link.text}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <SiteSearch />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid size-8 place-items-center rounded-[var(--radius-pill)] text-fd-muted-foreground transition-colors hover:bg-fd-secondary hover:text-fd-foreground"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="size-4 hidden dark:block" />
          </button>
          <a
            href={site.repository}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Arc on GitHub"
            className="grid size-8 place-items-center rounded-[var(--radius-pill)] text-fd-muted-foreground transition-colors hover:bg-fd-secondary hover:text-fd-foreground"
          >
            <GitHubIcon className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

/** lucide dropped brand icons, so the GitHub mark is drawn inline. */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
