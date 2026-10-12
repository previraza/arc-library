"use client";

import { useState } from "react";

import { JsonViewer } from "manicat/registry/components/json-viewer/json-viewer";
import { SortableDataTable } from "manicat/registry/components/sortable-data-table/sortable-data-table";
import { FilterToolbar } from "manicat/registry/components/filter-toolbar/filter-toolbar";
import { Timeline } from "manicat/registry/components/timeline/timeline";

import type { DataColumn } from "manicat/registry/components/sortable-data-table/sortable-data-table";
import type { FilterChip, FilterField } from "manicat/registry/components/filter-toolbar/filter-toolbar";
import type { TimelineEvent } from "manicat/registry/components/timeline/timeline";

export function JsonViewerDemo() {
  return (
    <JsonViewer
      label="Account payload"
      defaultExpandDepth={2}
      data={{
        id: "a1b2c3",
        name: "Ada Lovelace",
        role: "Staff Engineer",
        teams: ["Analytics", "Platform"],
        plan: { tier: "scale", seats: 24, renews: "2026-12-01" },
        flags: { beta: true, legacy: false },
        logins: [1700000000000, 1700003600000, 1700007200000],
        meta: null,
      }}
    />
  );
}

type Project = { id: string; name: string; owner: string; status: "Active" | "Trialing" | "Paused"; seats: number; [key: string]: unknown };

const projects: Project[] = [
  { id: "p1", name: "Manicat UI", owner: "Elia", status: "Active", seats: 24 },
  { id: "p2", name: "Atlas", owner: "Mara", status: "Trialing", seats: 6 },
  { id: "p3", name: "Halo", owner: "Denis", status: "Active", seats: 12 },
  { id: "p4", name: "Nimbus", owner: "Ravi", status: "Paused", seats: 3 },
  { id: "p5", name: "Quartz", owner: "Sofia", status: "Active", seats: 9 },
];

const projectColumns: DataColumn<Project>[] = [
  { key: "name", label: "Project", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "seats", label: "Seats", sortable: true, numeric: true },
];

export function SortableDataTableDemo() {
  return (
    <SortableDataTable
      rows={projects}
      columns={projectColumns}
      rowKey="id"
      caption="Projects in the workspace"
      defaultSort={{ key: "seats", direction: "desc" }}
      selectable
      itemName={{ one: "project", other: "projects" }}
    />
  );
}

const filterFields: FilterField[] = [
  { id: "status", label: "Status", options: ["Trialing", "Active", "Paused", "Canceled"] },
  { id: "assignee", label: "Assignee", options: ["Elia", "Mara", "Denis", "Ravi", "Sofia"] },
  {
    id: "priority",
    label: "Priority",
    options: [{ value: "low" }, { value: "medium" }, { value: "high" }, { value: "urgent", hint: 2 }],
  },
];

export function FilterToolbarDemo() {
  const [filters, setFilters] = useState<FilterChip[]>([
    { id: "status", label: "Trialing" },
    { id: "assignee", label: "Denis" },
  ]);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <FilterToolbar
        filters={filters}
        onRemove={(id) => setFilters((current) => current.filter((filter) => filter.id !== id))}
        onClearAll={() => setFilters([])}
        addFilter={{ fields: filterFields, onAdd: (filter) => setFilters((current) => [...current, filter]) }}
      >
        <input
          className="min-w-40 rounded-[var(--radius-control)] border border-fd-border bg-fd-background px-3 py-1.5 text-sm outline-none transition focus:border-fd-primary"
          placeholder="Search the team"
        />
      </FilterToolbar>
      <p className="text-xs text-fd-muted-foreground">Chips narrow the rows rendered below the toolbar.</p>
    </div>
  );
}

const now = Date.UTC(2026, 8, 9, 12);

const timelineEvents: TimelineEvent[] = [
  { id: "m1", at: now - 2 * 3_600_000, actor: "Elia", title: "merged Manicat v2 into main", meta: "PR #482" },
  { id: "m2", at: now - 5 * 3_600_000, actor: "Deploy bot", title: "deployed to staging", meta: "commit 9f3ca2b", tone: "success" },
  { id: "m3", at: now - 26 * 3_600_000, actor: "Mara", title: "opened a PR for the search dialog", meta: "PR #491" },
  { id: "m4", at: now - 30 * 3_600_000, actor: "CI", title: "failed on main", meta: "Run #12041", tone: "danger" },
];

export function TimelineDemo() {
  return <Timeline events={timelineEvents} now={now} label="Project activity" timeZone="UTC" />;
}