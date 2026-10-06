"use client";

import { useTheme } from "fumadocs-ui/provider/base";
import { Switch } from "arc/registry/components/switch/switch";

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="not-prose my-6 grid gap-3 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5">
      <Switch
        label="Dark mode"
        checked={resolvedTheme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <p className="text-sm text-fd-muted-foreground">
        next-themes writes <code>.dark</code> and <code>data-theme</code> on the html element.
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <code className="rounded-[var(--radius-control)] bg-fd-muted px-2 py-1">--accent: var(--accent)</code>
        <code className="rounded-[var(--radius-control)] bg-fd-muted px-2 py-1">--background: var(--background)</code>
        <code className="rounded-[var(--radius-control)] bg-fd-muted px-2 py-1">--surface: var(--surface)</code>
      </div>
    </div>
  );
}