"use client";

import { useEffect, useState } from "react";
import { ActivityHeatmap } from "manicat/registry/components/activity-heatmap/activity-heatmap";
import type { ActivityDay } from "manicat/registry/components/activity-heatmap/activity-heatmap";
import { Streamgraph } from "manicat/registry/components/streamgraph/streamgraph";
import type { StreamgraphDatum, StreamgraphSeries } from "manicat/registry/components/streamgraph/streamgraph";
import { BrushChart } from "manicat/registry/components/brush-chart/brush-chart";
import type { BrushChartDatum } from "manicat/registry/components/brush-chart/brush-chart";
import { Ridgeline } from "manicat/registry/components/ridgeline/ridgeline";
import type { RidgelineSeries } from "manicat/registry/components/ridgeline/ridgeline";
import { Treemap } from "manicat/registry/components/treemap/treemap";
import type { TreemapNode } from "manicat/registry/components/treemap/treemap";
import { WaffleChart } from "manicat/registry/components/waffle-chart/waffle-chart";
import type { WaffleCategory } from "manicat/registry/components/waffle-chart/waffle-chart";
import { SlopeChart } from "manicat/registry/components/slope-chart/slope-chart";
import type { SlopeItem } from "manicat/registry/components/slope-chart/slope-chart";
import { JsonViewer } from "manicat/registry/components/json-viewer/json-viewer";
import { FilterToolbar } from "manicat/registry/components/filter-toolbar/filter-toolbar";
import type { FilterChip, FilterField } from "manicat/registry/components/filter-toolbar/filter-toolbar";
import { CodeBlock } from "manicat/registry/components/code-block/code-block";
import { TextReveal } from "manicat/registry/components/text-reveal/text-reveal";
import { InViewTitle } from "manicat/registry/components/in-view-title/in-view-title";
import { TextMorph } from "manicat/registry/components/text-morph/text-morph";
import { TextShimmer } from "manicat/registry/components/text-shimmer/text-shimmer";
import { SlotText } from "manicat/registry/components/slot-text/slot-text";

const DAY = 86_400_000;

const commits: ActivityDay[] = Array.from({ length: 140 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 4, 4, 12) + index * DAY);
  const count = Math.floor(((index * 37) % 31) * (index % 5 === 0 ? 1.4 : 0.6));
  return { date: date.toISOString().slice(0, 10), count: Math.min(count, 26) };
});

/**
 * @title Contribution graph
 * A GitHub-style calendar of commits with a plural-aware unit in the tooltip.
 */
export function ActivityHeatmapCommitsExample() {
  return <ActivityHeatmap days={commits} label="Commits" period="May to August 2026" unit={{ one: "commit", other: "commits" }} />;
}

const topics: StreamgraphSeries[] = [
  { key: "billing", label: "Billing" },
  { key: "access", label: "Access" },
  { key: "performance", label: "Performance" },
];

const tickets: StreamgraphDatum[] = Array.from({ length: 10 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 6, 6, 12) + index * 7 * DAY);
  return {
    key: date.toISOString().slice(0, 10),
    label: "Week of " + date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    axisLabel: "W" + (27 + index),
    values: {
      billing: 40 + Math.round(30 * Math.sin(index / 1.6) + index * 4),
      access: 55 + Math.round(22 * Math.sin(index / 1.9 + 1)),
      performance: 30 + Math.round(26 * Math.sin(index / 1.4 + 2)),
    },
  };
});

/**
 * @title Support load by topic
 * Stacked flowing areas showing how the mix of tickets shifts week to week.
 */
export function StreamgraphTicketsExample() {
  return <Streamgraph data={tickets} series={topics} label="Support tickets by topic" unit="tickets" legend />;
}

const daily: BrushChartDatum[] = Array.from({ length: 60 }, (_, index) => ({
  date: Date.UTC(2026, 6, 1, 12) + index * DAY,
  value: 1200 + Math.round(260 * Math.sin(index / 5.5) + index * 7),
}));

/**
 * @title Zoomable timeline
 * Drag the brush to focus on a range; an annotation marks the launch day.
 */
export function BrushChartUsersExample() {
  return (
    <BrushChart
      data={daily}
      label="Daily active users"
      unit="users"
      annotations={[{ date: daily[20].date, label: "v2 launch", description: "The redesign shipped on this day." }]}
      defaultRange={[daily[20].date as number, daily[45].date as number]}
    />
  );
}

function ridge(mean: number, spread: number): number[] {
  return Array.from({ length: 48 }, (_, index) => mean + Math.round(spread * Math.sin(index * 1.7) + ((index * 7) % 5) - 2));
}

const months: RidgelineSeries[] = [
  { id: "jul", label: "July", values: ridge(24, 4) },
  { id: "aug", label: "August", values: ridge(27, 3) },
  { id: "sep", label: "September", values: ridge(21, 5) },
];

/**
 * @title Temperature distributions
 * Overlapping density curves compare how a value is spread across groups.
 */
export function RidgelineTemperatureExample() {
  return <Ridgeline series={months} label="Daily highs in Zurich" unit="°C" tint />;
}

const revenue: TreemapNode = {
  id: "revenue",
  label: "Revenue",
  children: [
    {
      id: "storage",
      label: "Storage",
      children: [
        { id: "objects", label: "Objects", value: 84, color: 22 },
        { id: "sql", label: "Managed SQL", value: 47, color: 8 },
      ],
    },
    {
      id: "compute",
      label: "Compute",
      children: [
        { id: "instances", label: "Instances", value: 102, color: -12 },
        { id: "functions", label: "Functions", value: 23, color: 64 },
      ],
    },
    { id: "network", label: "Network", children: [{ id: "bandwidth", label: "Bandwidth", value: 39, color: 18 }] },
  ],
};

/**
 * @title Revenue by product
 * Area is revenue and colour is growth; click a group to zoom in.
 */
export function TreemapRevenueExample() {
  return <Treemap data={revenue} label="Revenue by product" colorLabel="Growth" />;
}

const generation: WaffleCategory[] = [
  { key: "solar", label: "Solar", value: 350 },
  { key: "wind", label: "Wind", value: 490 },
  { key: "gas", label: "Gas", value: 520 },
  { key: "coal", label: "Coal", value: 610 },
  { key: "hydro", label: "Hydro", value: 260 },
];

/**
 * @title Energy mix
 * Parts of a whole as a grid of squares, easier to read than slices at small sizes.
 */
export function WaffleChartEnergyExample() {
  return <WaffleChart data={generation} label="Electricity generation, 2025" unit="TWh" legend />;
}

const channels: SlopeItem[] = [
  { key: "search", label: "Organic search", start: 38, end: 29 },
  { key: "direct", label: "Direct", start: 24, end: 27 },
  { key: "referral", label: "Referral", start: 12, end: 8 },
  { key: "social", label: "Social", start: 16, end: 21 },
];

/**
 * @title Quarter over quarter
 * Compare two moments per item and highlight the one the story is about.
 */
export function SlopeChartChannelsExample() {
  return <SlopeChart data={channels} label="Conversion rate by channel" startLabel="Q1" endLabel="Q2" ranks highlightKey="social" />;
}

/**
 * @title API response
 * A collapsible tree of a payload, with types coloured and long arrays folded.
 */
export function JsonViewerResponseExample() {
  return (
    <JsonViewer
      label="GET /v1/accounts/a1b2c3"
      defaultExpandDepth={2}
      data={{
        id: "a1b2c3",
        name: "Ada Lovelace",
        role: "Staff Engineer",
        teams: ["Analytics", "Platform"],
        plan: { tier: "scale", seats: 24, renews: "2026-12-01" },
        flags: { beta: true, legacy: false },
        meta: null,
      }}
    />
  );
}

const fields: FilterField[] = [
  { id: "status", label: "Status", options: ["Trialing", "Active", "Paused", "Canceled"] },
  { id: "assignee", label: "Assignee", options: ["Elia", "Mara", "Denis", "Ravi", "Sofia"] },
];

/**
 * @title Customers filters
 * Chips for the active filters, an add-filter menu and your own search field inside the toolbar.
 */
export function FilterToolbarCustomersExample() {
  const [filters, setFilters] = useState<FilterChip[]>([
    { id: "status", label: "Trialing" },
    { id: "assignee", label: "Denis" },
  ]);

  return (
    <div className="grid w-full max-w-md gap-3">
      <FilterToolbar
        filters={filters}
        onRemove={(id) => setFilters((current) => current.filter((filter) => filter.id !== id))}
        onClearAll={() => setFilters([])}
        addFilter={{ fields, onAdd: (filter) => setFilters((current) => [...current, filter]) }}
      >
        <input
          className="min-w-40 rounded-[var(--radius-control)] border border-fd-border bg-fd-background px-3 py-1.5 text-sm outline-none"
          placeholder="Search customers"
        />
      </FilterToolbar>
      <p className="text-sm text-fd-muted-foreground">{filters.length} filters applied.</p>
    </div>
  );
}

/**
 * @title Installation snippet
 * A code card with a file name and syntax highlighting.
 */
export function CodeBlockSnippetExample() {
  return (
    <div className="w-full max-w-xl">
      <CodeBlock
        code={`export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      You pressed {count} times
    </button>
  );
}`}
        filename="counter.tsx"
        language="tsx"
      />
    </div>
  );
}

/**
 * @title Scroll-in headline
 * Each word rises as the section enters the viewport.
 */
export function TextRevealHeadlineExample() {
  return (
    <div className="w-full">
      <TextReveal text="Every word rises as it enters the viewport." as="h2" />
    </div>
  );
}

/**
 * @title Section title
 * A heading that reveals line by line, with explicit line breaks.
 */
export function InViewTitleSectionExample() {
  return (
    <div className="w-full">
      <InViewTitle as="h2" text="Designed in the open, shipped weekly." lines={["Designed in the open,", "shipped weekly."]} variant="line" />
    </div>
  );
}

const words = ["spacing", "grid", "rhythm", "order"];

/**
 * @title Rotating word
 * A word inside a sentence that morphs into the next one, letter by letter.
 */
export function TextMorphRotatingExample() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % words.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="w-full text-center text-sm text-fd-muted-foreground">
      Good interfaces are built on <TextMorph as="strong">{words[index]}</TextMorph>.
    </p>
  );
}

/**
 * @title Thinking state
 * A shimmer for “working on it” text; turn it off when the work is done.
 */
export function TextShimmerThinkingExample() {
  const [done, setDone] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <TextShimmer active={!done}>{done ? "Done." : "Synthesizing the registry…"}</TextShimmer>
      <button type="button" className="text-sm text-fd-muted-foreground underline" onClick={() => setDone((value) => !value)}>
        {done ? "Run again" : "Finish"}
      </button>
    </div>
  );
}

const prices = [1_024, 12_480, 99_200, 736_000];

/**
 * @title Rolling price
 * Digits spin like a slot machine reel when the amount changes length.
 */
export function SlotTextPriceExample() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % prices.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-3xl font-semibold tabular-nums">
      $<SlotText value={prices[index]} />
    </p>
  );
}
