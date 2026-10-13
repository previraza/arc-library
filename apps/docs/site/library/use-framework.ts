"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FrameworkId } from "@/lib/frameworks";

const key = "manicat:framework";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Private window or blocked storage: the choice just doesn't persist.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * The framework the visitor picked, remembered in the browser and shared by every switcher on the page and across tabs.
 * `available` is what the current item ships for; a remembered choice the item doesn't have falls back to its first option
 * without erasing the preference, so Vue stays selected on the next item that has it.
 */
export function useFramework(available: { id: FrameworkId }[]): [FrameworkId, (id: FrameworkId) => void] {
  const stored = useSyncExternalStore(subscribe, read, () => null);
  const current = available.find((option) => option.id === stored)?.id ?? available[0]?.id ?? "react";

  const set = useCallback((id: FrameworkId) => {
    try {
      localStorage.setItem(key, id);
    } catch {
      // Nothing to do: the listeners below still update this page.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [current, set];
}
