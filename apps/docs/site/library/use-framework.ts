"use client";

import { createContext, createElement, useCallback, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { FrameworkId } from "@/lib/frameworks";

const key = "manicat:framework";
const listeners = new Set<() => void>();

/** What the server was asked for with `?framework=vue`, so the HTML already holds the right tab and code. */
const InitialFramework = createContext<string | null>(null);

export function FrameworkFromRequest({ id, children }: { id?: string | string[]; children: ReactNode }) {
  return createElement(InitialFramework.Provider, { value: typeof id === "string" && id ? id : null }, children);
}

/** A link can carry the choice: `?framework=vue` (the server renders it, so curl sees it) or `#vue` (this browser only). */
function fromUrl(): string | null {
  const query = new URLSearchParams(location.search).get("framework");
  return query || location.hash.slice(1) || null;
}

function read(): string | null {
  try {
    const linked = fromUrl();
    if (linked) return linked;
    return localStorage.getItem(key);
  } catch {
    return null; // Private window or blocked storage: the choice just doesn't persist.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

/**
 * The framework the visitor picked, remembered in the browser and shared by every switcher on the page and across tabs.
 * `available` is what the current item ships for; a remembered choice the item doesn't have falls back to its first option
 * without erasing the preference, so Vue stays selected on the next item that has it.
 */
export function useFramework(available: { id: FrameworkId }[]): [FrameworkId, (id: FrameworkId) => void] {
  const requested = useContext(InitialFramework);
  const stored = useSyncExternalStore(subscribe, read, () => requested);
  const current = available.find((option) => option.id === stored)?.id ?? available[0]?.id ?? "react";

  const set = useCallback((id: FrameworkId) => {
    try {
      localStorage.setItem(key, id);
    } catch {
      // Nothing to do: the listeners below still update this page.
    }
    // Keep the address shareable: the page now opens on this framework for anyone, and for curl.
    const url = new URL(location.href);
    url.searchParams.set("framework", id);
    url.hash = "";
    history.replaceState(history.state, "", url);
    listeners.forEach((listener) => listener());
  }, []);

  return [current, set];
}
