"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { Button } from "manicat/registry/components/button/button";

/**
 * @title Page header actions
 * One primary action, a secondary one and a quiet ghost button, the usual hierarchy of a page header.
 */
export function ButtonHeaderExample() {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-4">
      <div>
        <h4 className="text-base font-medium text-fd-foreground">Invoices</h4>
        <p className="text-sm text-fd-muted-foreground">42 invoices this quarter</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost">
          <Download className="size-4" /> Export
        </Button>
        <Button variant="secondary">Filters</Button>
        <Button>
          <Plus className="size-4" /> New invoice
        </Button>
      </div>
    </div>
  );
}

/**
 * @title Async submit
 * The loading state keeps the label and blocks double submits while a request is in flight.
 */
export function ButtonLoadingExample() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setLoading(true);
    setSaved(false);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
    }, 1400);
  }

  return (
    <div className="flex items-center gap-3">
      <Button loading={loading} onClick={save}>
        Save changes
      </Button>
      {saved && <span className="text-sm text-fd-muted-foreground">Saved just now</span>}
    </div>
  );
}

/**
 * @title Destructive action
 * Danger is reserved for the one irreversible choice; Cancel stays the easy way out.
 */
export function ButtonDestructiveExample() {
  return (
    <div className="grid w-full max-w-sm gap-4 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-5">
      <div>
        <h4 className="text-base font-medium text-fd-foreground">Delete project</h4>
        <p className="mt-1 text-sm text-fd-muted-foreground">This removes 12 deployments and every environment variable. It can&apos;t be undone.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
    </div>
  );
}

/**
 * @title Sizes
 * Small for dense toolbars, medium by default, large for hero calls to action.
 */
export function ButtonSizesExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}
