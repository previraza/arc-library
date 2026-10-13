"use client";

import { useEffect, useState } from "react";

export type TocEntry = { id: string; title: string; depth?: number };

/** "On this page": the sections of an item page, with the one in view highlighted. Shown from the xl breakpoint up. */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id);

  useEffect(() => {
    const elements = entries.map((entry) => document.getElementById(entry.id)).filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    // The section that crosses the band just under the sticky header is the current one.
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((record) => record.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <aside className="hidden w-52 shrink-0 xl:block">
      <nav aria-label="On this page" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">On this page</p>
        <ul className="grid gap-0.5 border-l border-fd-border">
          {entries.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={active === entry.id ? "location" : undefined}
                className={`-ml-px block border-l py-1 text-[13px] transition-colors ${
                  entry.depth ? "pl-6" : "pl-3"
                } border-transparent text-fd-muted-foreground hover:text-fd-foreground aria-[current=location]:border-fd-primary aria-[current=location]:text-fd-foreground`}
              >
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
