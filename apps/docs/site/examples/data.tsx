"use client";

import { useState } from "react";
import { Folder, FileText } from "lucide-react";
import { Sparkline } from "manicat/registry/components/sparkline/sparkline";
import { Gauge } from "manicat/registry/components/gauge/gauge";
import { AnimatedCounter } from "manicat/registry/components/animated-counter/animated-counter";
import { BarChart } from "manicat/registry/components/bar-chart/bar-chart";
import type { BarChartDatum } from "manicat/registry/components/bar-chart/bar-chart";
import { DonutChart } from "manicat/registry/components/donut-chart/donut-chart";
import type { DonutChartDatum } from "manicat/registry/components/donut-chart/donut-chart";
import { LineChart } from "manicat/registry/components/line-chart/line-chart";
import type { LineChartDatum, LineChartSeries } from "manicat/registry/components/line-chart/line-chart";
import { SortableDataTable } from "manicat/registry/components/sortable-data-table/sortable-data-table";
import type { DataColumn } from "manicat/registry/components/sortable-data-table/sortable-data-table";
import { Timeline } from "manicat/registry/components/timeline/timeline";
import type { TimelineEvent } from "manicat/registry/components/timeline/timeline";
import { Pagination } from "manicat/registry/components/pagination/pagination";
import { Breadcrumb } from "manicat/registry/components/breadcrumb/breadcrumb";
import { TreeView } from "manicat/registry/components/tree-view/tree-view";

/**
 * @title KPI row
 * Three KPI cards on a dashboard, each with its trend line and a delta against last week.
 */
export function SparklineKpiExample() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Sparkline data={[12, 16, 14, 21, 18, 24, 29, 26, 33, 31, 38]} label="Signups" value="3,812" change="+12.4%" />
      <Sparkline data={[9, 13, 11, 17, 15, 22, 20, 27, 24, 31, 42]} label="MRR" value="$42.1k" change="+35.5%" />
      <Sparkline data={[30, 28, 31, 26, 27, 24, 22, 23, 19, 18, 15]} label="Churn" value="1.5%" change="−8.2%" tone="danger" />
    </div>
  );
}

/**
 * @title Resource usage
 * Server capacity at a glance; the tone flips to danger when a limit is close.
 */
export function GaugeUsageExample() {
  return (
    <div className="flex w-full items-center justify-around gap-6">
      <Gauge value={72} label="CPU" detail="of 8 cores" />
      <Gauge value={91} label="Memory" detail="of 32 GB" tone="danger" />
      <Gauge value={34} label="Disk" detail="of 512 GB" tone="success" />
    </div>
  );
}

/**
 * @title Live stats
 * Numbers that count up to their value, with units and decimals.
 */
export function AnimatedCounterStatsExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <AnimatedCounter value={121_408} label="Downloads this month" />
      <AnimatedCounter value={99.98} decimals={2} suffix="%" label="Uptime" />
      <AnimatedCounter value={1.8} decimals={1} suffix=" ms" label="Median response" />
    </div>
  );
}

const DAY = 86_400_000;

const activeMinutes: BarChartDatum[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 8, 14, 12) + index * DAY);
  return {
    key: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }),
    axisLabel: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    value: [38, 52, 47, 61, 55, 24, 19][index],
  };
});

/**
 * @title Weekly activity
 * A week of daily values with the average drawn as a reference line.
 */
export function BarChartWeeklyExample() {
  return <BarChart data={activeMinutes} label="Active minutes" period="Sep 14–20, 2026" unit="min" showAverage />;
}

const sources: DonutChartDatum[] = [
  { key: "search", label: "Search", value: 42_134 },
  { key: "direct", label: "Direct", value: 21_809 },
  { key: "social", label: "Social", value: 15_006 },
  { key: "referral", label: "Referral", value: 9_210 },
];

/**
 * @title Traffic sources
 * Parts of a whole, with the total in the middle and a legend that highlights slices.
 */
export function DonutChartSourcesExample() {
  return <DonutChart data={sources} label="Visits by source" unit="visits" totalLabel="Visits" legend />;
}

const lineSeries: LineChartSeries[] = [
  { key: "this-year", label: "This year" },
  { key: "last-year", label: "Last year", dashed: true },
];

const lineData: LineChartDatum[] = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 3, 12) + index * DAY);
  return {
    key: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
    axisLabel: index % 7 === 0 ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : undefined,
    values: {
      "this-year": 900 + Math.round(240 * Math.sin(index / 2.4) + index * 9),
      "last-year": 700 + Math.round(200 * Math.sin(index / 2.4 + 1.2) + index * 6),
    },
  };
});

/**
 * @title Year over year
 * Two series on one axis, the comparison drawn dashed.
 */
export function LineChartComparisonExample() {
  return <LineChart data={lineData} series={lineSeries} label="Signups per day" unit="signups" legend height={240} />;
}

type Invoice = { id: string; customer: string; status: "Paid" | "Pending" | "Overdue"; amount: number; [key: string]: unknown };

const invoices: Invoice[] = [
  { id: "inv-1", customer: "Acme Corp", status: "Paid", amount: 4200 },
  { id: "inv-2", customer: "Globex", status: "Pending", amount: 1850 },
  { id: "inv-3", customer: "Initech", status: "Overdue", amount: 960 },
  { id: "inv-4", customer: "Umbrella", status: "Paid", amount: 12400 },
  { id: "inv-5", customer: "Hooli", status: "Pending", amount: 3300 },
];

const invoiceColumns: DataColumn<Invoice>[] = [
  { key: "customer", label: "Customer", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "amount", label: "Amount (USD)", sortable: true, numeric: true },
];

/**
 * @title Invoices table
 * Sortable columns, a default sort on the amount and row selection for bulk actions.
 */
export function SortableDataTableInvoicesExample() {
  return (
    <SortableDataTable
      rows={invoices}
      columns={invoiceColumns}
      rowKey="id"
      caption="Invoices"
      defaultSort={{ key: "amount", direction: "desc" }}
      selectable
      itemName={{ one: "invoice", other: "invoices" }}
    />
  );
}

const now = Date.UTC(2026, 8, 9, 12);

const events: TimelineEvent[] = [
  { id: "e1", at: now - 2 * 3_600_000, actor: "Elia", title: "merged the redesign into main", meta: "PR #482" },
  { id: "e2", at: now - 5 * 3_600_000, actor: "Deploy bot", title: "deployed to staging", meta: "commit 9f3ca2b", tone: "success" },
  { id: "e3", at: now - 26 * 3_600_000, actor: "CI", title: "failed on main", meta: "Run #12041", tone: "danger" },
];

/**
 * @title Activity feed
 * Who did what and when, with relative times and a tone for outcomes.
 */
export function TimelineActivityExample() {
  return <Timeline events={events} now={now} label="Project activity" timeZone="UTC" />;
}

/**
 * @title Results pager
 * Page state kept by the parent so the list below can follow it.
 */
export function PaginationResultsExample() {
  const [page, setPage] = useState(3);
  const size = 20;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-sm text-fd-muted-foreground">
        Showing {(page - 1) * size + 1}–{page * size} of 240 results
      </p>
      <Pagination page={page} pageCount={12} onPageChange={setPage} />
    </div>
  );
}

/**
 * @title Settings trail
 * Where you are in a nested settings area; the last item is the current page and isn't a link.
 */
export function BreadcrumbTrailExample() {
  return (
    <Breadcrumb
      items={[
        { label: "Settings", href: "/settings" },
        { label: "Billing", href: "/settings/billing" },
        { label: "Invoices" },
      ]}
    />
  );
}

const files = [
  {
    id: "src",
    label: "src",
    icon: <Folder className="size-4" />,
    children: [
      { id: "app", label: "app", icon: <Folder className="size-4" /> },
      {
        id: "lib",
        label: "lib",
        icon: <Folder className="size-4" />,
        children: [
          { id: "cn", label: "cn.ts", icon: <FileText className="size-4" /> },
          { id: "registry", label: "registry.ts", icon: <FileText className="size-4" /> },
        ],
      },
    ],
  },
  { id: "readme", label: "README.md", icon: <FileText className="size-4" /> },
];

/**
 * @title File explorer
 * Nested folders with icons, arrow-key navigation and a few folders open by default.
 */
export function TreeViewFilesExample() {
  return (
    <div className="w-full max-w-xs">
      <TreeView nodes={files} defaultExpandedIds={["src", "lib"]} aria-label="Project files" />
    </div>
  );
}
