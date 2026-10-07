"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import type { SearchEntry } from "@/lib/search";

/**
 * The site search: a button in the header plus a dialog on Cmd/Ctrl+K. Results come from /api/search, ranked
 * server-side, and the list is fully keyboard driven.
 *
 * The dialog panel unmounts when closed, so opening it always starts from an empty query with fresh results.
 * It portals to <body>: the blurred header would otherwise become the containing block of the fixed overlay,
 * which would then only cover the header instead of the whole viewport.
 */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-fd-border px-2.5 py-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-fd-border px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>

      {open && createPortal(<SearchPanel onClose={close} />, document.body)}
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  /** The query the current results belong to, so a fresh query reads as loading rather than empty. */
  const [searched, setSearched] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus after paint so the dialog is on screen when the caret lands.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(needle)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { results: SearchEntry[] };
        if (cancelled) return;
        setResults(data.results);
        setSearched(needle);
        setActive(0);
      } catch {
        // A failed lookup leaves the previous results in place rather than throwing in the dialog.
      }
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function go(url: string) {
    onClose();
    router.push(url);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].url);
    }
  }

  const pending = query.trim().length >= 2 && searched !== query.trim();

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center bg-fd-background/60 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        className="grid w-full max-w-lg overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-fd-border px-3">
          <Search className="size-4 shrink-0 text-fd-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search components, blocks and docs…"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-fd-border px-1.5 py-0.5 font-mono text-[10px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            esc
          </button>
        </div>

        <ul ref={listRef} role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto p-1.5">
          {query.trim().length < 2 ? (
            <li className="px-3 py-6 text-center text-sm text-fd-muted-foreground">Type at least two characters.</li>
          ) : pending || results.length === 0 ? (
            <li className="flex flex-col items-center gap-2 px-3 py-6 text-center text-sm text-fd-muted-foreground">
              <SearchX className="size-5" />
              {pending ? "Searching…" : <>No results for “{query}”.</>}
            </li>
          ) : (
            results.map((result, index) => (
              <li key={result.url} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onClick={() => go(result.url)}
                  onMouseEnter={() => setActive(index)}
                  className={`grid w-full gap-0.5 rounded-[var(--radius-surface)] px-3 py-2 text-left transition-colors ${
                    index === active ? "bg-fd-secondary" : ""
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-fd-foreground">{result.title}</span>
                    <span className="shrink-0 text-[11px] text-fd-muted-foreground">{result.section}</span>
                  </span>
                  <span className="truncate text-xs text-fd-muted-foreground">{result.description}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}