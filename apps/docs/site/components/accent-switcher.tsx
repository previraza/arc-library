"use client";

import { useSyncExternalStore } from "react";
import { Button } from "manicat/registry/components/button/button";
import { Slider } from "manicat/registry/components/slider/slider";
import { Switch } from "manicat/registry/components/switch/switch";

const accents = [
  { name: "neutral", color: "oklch(33% 0 0)" },
  { name: "violet", color: "#7747ff" },
  { name: "blue", color: "#0562ef" },
  { name: "green", color: "#0db879" },
  { name: "amber", color: "#f3ad20" },
  { name: "orange", color: "#f48120" },
  { name: "coral", color: "#f15f55" },
  { name: "rose", color: "#ed4e9d" },
] as const;

type Accent = (typeof accents)[number]["name"];

const STORAGE_KEY = "arc-accent";

function applyAccent(accent: string) {
  const root = document.documentElement;
  if (accent === "neutral") root.removeAttribute("data-accent");
  else root.dataset.accent = accent;
  // The switcher and every other open tab read the same store.
  window.dispatchEvent(new Event("arc-accent"));
}

/** Reads the persisted accent from localStorage, "neutral" until the first client render. */
const accentStore = {
  subscribe(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener("arc-accent", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("arc-accent", callback);
    };
  },
  getSnapshot: () => window.localStorage.getItem(STORAGE_KEY) ?? "neutral",
  getServerSnapshot: () => "neutral",
};

export function AccentSwitcher() {
  const stored = useSyncExternalStore(accentStore.subscribe, accentStore.getSnapshot, accentStore.getServerSnapshot);
  const accent = accents.find((entry) => entry.name === stored)?.name ?? "neutral";

  function select(next: Accent) {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyAccent(next);
  }

  return (
    <div className="not-prose my-6 grid gap-4 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        {accents.map(({ color, name }) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={accent === name}
            onClick={() => select(name)}
            className="size-7 rounded-[var(--radius-pill)] border border-fd-border transition-transform duration-150 hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-fd-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-fd-background"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="grid content-start gap-4">
          <Switch label="Notifications" defaultChecked />
          <Slider label="Volume" defaultValue={62} />
          <p className="text-sm text-fd-muted-foreground">
            Select this sentence to see it pick up the accent.
          </p>
        </div>
      </div>
    </div>
  );
}