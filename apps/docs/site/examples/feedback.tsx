"use client";

import { useState } from "react";
import { Button } from "manicat/registry/components/button/button";
import { Alert } from "manicat/registry/components/alert/alert";
import { Progress } from "manicat/registry/components/progress/progress";
import { Badge } from "manicat/registry/components/badge/badge";

/**
 * @title Dismissible banner
 * A trial warning the user can dismiss, with a call to action inside.
 */
export function AlertBannerExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert tone="warning" title="Your trial ends in 3 days" open={open} onDismiss={() => setOpen(false)}>
        <span className="block">Add a payment method to keep your workspace and its 14 projects.</span>
        <Button size="sm" className="mt-3">
          Add payment method
        </Button>
      </Alert>
      {!open && (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Bring the banner back
        </Button>
      )}
    </div>
  );
}

/**
 * @title Deploy result
 * Success and failure side by side, so the tones read as a set.
 */
export function AlertResultExample() {
  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert tone="success" title="Deployed to production">
        v2.4.0 is live. Cache purged in 3 regions.
      </Alert>
      <Alert tone="danger" title="Build failed">
        Type error in src/billing.ts:42, “amount” is possibly undefined.
      </Alert>
    </div>
  );
}

/**
 * @title Upload progress
 * A controlled progress bar driven by a timer, the way an upload or an import would drive it.
 */
export function ProgressUploadExample() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);

  function start() {
    setValue(0);
    setRunning(true);
    const timer = setInterval(() => {
      setValue((current) => {
        if (current >= 100) {
          clearInterval(timer);
          setRunning(false);
          return 100;
        }
        return current + 10;
      });
    }, 250);
  }

  return (
    <div className="grid w-full max-w-sm gap-4">
      <Progress label="Uploading brand-assets.zip" value={value} showValue />
      <Button onClick={start} disabled={running} variant="secondary">
        {value === 100 ? "Upload again" : running ? "Uploading…" : "Start upload"}
      </Button>
    </div>
  );
}

/**
 * @title Status column
 * Tones carry meaning: green is done, amber needs attention, red is broken.
 */
export function BadgeStatusExample() {
  const rows = [
    { name: "marketing-site", tone: "success", label: "Live" },
    { name: "billing-api", tone: "warning", label: "Degraded" },
    { name: "docs-preview", tone: "info", label: "Building" },
    { name: "legacy-admin", tone: "danger", label: "Failed" },
    { name: "playground", tone: "neutral", label: "Paused" },
  ] as const;

  return (
    <ul className="grid w-full max-w-sm divide-y divide-(--border) rounded-[var(--radius-panel)] border border-fd-border bg-fd-card">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center justify-between px-4 py-3">
          <span className="font-mono text-sm text-fd-foreground">{row.name}</span>
          <Badge tone={row.tone}>{row.label}</Badge>
        </li>
      ))}
    </ul>
  );
}
