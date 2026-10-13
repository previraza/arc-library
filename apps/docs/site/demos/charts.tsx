"use client";

import { Sparkline } from "manicat/registry/components/sparkline/sparkline";
import { Gauge } from "manicat/registry/components/gauge/gauge";
import { AnimatedCounter } from "manicat/registry/components/animated-counter/animated-counter";
import { ActivityHeatmap } from "manicat/registry/components/activity-heatmap/activity-heatmap";
import { LineChart } from "manicat/registry/components/line-chart/line-chart";
import { BarChart } from "manicat/registry/components/bar-chart/bar-chart";
import { DonutChart } from "manicat/registry/components/donut-chart/donut-chart";
import { Streamgraph } from "manicat/registry/components/streamgraph/streamgraph";
import { BrushChart } from "manicat/registry/components/brush-chart/brush-chart";
import { Ridgeline } from "manicat/registry/components/ridgeline/ridgeline";
import { Treemap } from "manicat/registry/components/treemap/treemap";
import { WaffleChart } from "manicat/registry/components/waffle-chart/waffle-chart";
import { SlopeChart } from "manicat/registry/components/slope-chart/slope-chart";

import type { ActivityDay } from "manicat/registry/components/activity-heatmap/activity-heatmap";
import type { BarChartDatum } from "manicat/registry/components/bar-chart/bar-chart";
import type { BrushChartDatum } from "manicat/registry/components/brush-chart/brush-chart";
import type { DonutChartDatum } from "manicat/registry/components/donut-chart/donut-chart";
import type { LineChartDatum, LineChartSeries } from "manicat/registry/components/line-chart/line-chart";
import type { RidgelineSeries } from "manicat/registry/components/ridgeline/ridgeline";
import type { SlopeItem } from "manicat/registry/components/slope-chart/slope-chart";
import type { StreamgraphDatum, StreamgraphSeries } from "manicat/registry/components/streamgraph/streamgraph";
import type { TreemapNode } from "manicat/registry/components/treemap/treemap";
import type { WaffleCategory } from "manicat/registry/components/waffle-chart/waffle-chart";

const DAY = 86_400_000;

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function monthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function range(from: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, index) => new Date(from.getTime() + index * DAY));
}

export function SparklineDemo() {
  return (
    <div className="grid w-full max-w-md gap-4 sm:grid-cols-3">
      <Sparkline data={[12, 16, 14, 21, 18, 24, 29, 26, 33, 31, 38]} label="Signups" value="38" change="+12.4%" />
      <Sparkline data={[9, 13, 11, 17, 15, 22, 20, 27, 24, 31, 42]} label="Revenue" value="42" change="+35.5%" />
      <Sparkline data={[30, 28, 31, 26, 27, 24, 22, 23, 19, 18, 15]} label="Churn" value="15" change="−8.2%" tone="danger" />
    </div>
  );
}

export function GaugeDemo() {
  return (
    <div className="flex w-full max-w-md items-center justify-around gap-6">
      <Gauge value={72} label="Disk" detail="of 512 GB" />
      <Gauge value={64} label="Queue" detail="of 200 tasks" tone="success" />
      <Gauge value={18} label="Errors" detail="per hour" tone="danger" />
    </div>
  );
}

export function AnimatedCounterDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <AnimatedCounter value={121_408} label="Downloads" />
      <AnimatedCounter value={32_768} label="Premium seats" />
      <AnimatedCounter value={1.8} decimals={1} suffix=" ms" label="Median render" />
    </div>
  );
}

const heatmapDays: ActivityDay[] = Array.from({ length: 140 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 4, 4, 12));
  date.setUTCDate(date.getUTCDate() + index);
  const count = Math.floor(((index * 37) % 31) * (index % 5 === 0 ? 1.4 : 0.6));
  return { date: iso(date), count: Math.min(count, 26) };
});

export function ActivityHeatmapDemo() {
  // Size containers have no width of their own: give the demo the whole row.
  return <div className="w-full"><ActivityHeatmap days={heatmapDays} label="Commits" period="May to August 2026" unit={{ one: "commit", other: "commits" }} /></div>;
}

const lineSeries: LineChartSeries[] = [
  { key: "this-year", label: "This year" },
  { key: "last-year", label: "Last year", dashed: true },
];

const lineData: LineChartDatum[] = range(new Date(Date.UTC(2026, 7, 3, 12)), 49).map((date, index) => ({
  key: iso(date),
  label: dayLabel(date),
  axisLabel: index % 7 === 0 ? monthDay(date) : undefined,
  values: {
    "this-year": 900 + Math.round(240 * Math.sin(index / 2.4) + index * 9),
    "last-year": 700 + Math.round(200 * Math.sin(index / 2.4 + 1.2) + index * 6),
  },
}));

export function LineChartDemo() {
  return <LineChart data={lineData} series={lineSeries} label="Signups per day" unit="signups" legend height={240} />;
}

const barData: BarChartDatum[] = range(new Date(Date.UTC(2026, 8, 14, 12)), 7).map((date, index) => ({
  key: iso(date),
  label: dayLabel(date),
  axisLabel: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
  value: 42 + Math.round(18 * Math.sin(index / 1.3 + 1) + index * 3),
}));

export function BarChartDemo() {
  return <BarChart data={barData} label="Active minutes" period="Sep 14–20, 2026" unit="min" showAverage />;
}

const donutData: DonutChartDatum[] = [
  { key: "search", label: "Search", value: 42_134 },
  { key: "direct", label: "Direct", value: 21_809 },
  { key: "social", label: "Social", value: 15_006 },
  { key: "referral", label: "Referral", value: 9_210 },
  { key: "newsletter", label: "Newsletter", value: 5_402 },
];

export function DonutChartDemo() {
  // Size containers have no width of their own: give the demo the whole row.
  return <div className="w-full"><DonutChart data={donutData} label="Visits by source" unit="visits" totalLabel="Visits" legend /></div>;
}

const streamSeries: StreamgraphSeries[] = [
  { key: "billing", label: "Billing" },
  { key: "access", label: "Access" },
  { key: "performance", label: "Performance" },
  { key: "design", label: "Design" },
];

const streamData: StreamgraphDatum[] = range(new Date(Date.UTC(2026, 6, 6, 12)), 10).map((date, index) => ({
  key: iso(date),
  label: "Week of " + monthDay(date),
  axisLabel: "W" + (27 + index),
  values: {
    billing: Math.max(20, 40 + Math.round(30 * Math.sin(index / 1.6) + index * 4)),
    access: Math.max(20, 55 + Math.round(22 * Math.sin(index / 1.9 + 1))),
    performance: Math.max(20, 30 + Math.round(26 * Math.sin(index / 1.4 + 2))),
    design: Math.max(20, 20 + Math.round(18 * Math.sin(index / 1.7 + 3))),
  },
}));

export function StreamgraphDemo() {
  return <Streamgraph data={streamData} series={streamSeries} label="Support tickets by topic" unit="tickets" legend />;
}

const brushData: BrushChartDatum[] = range(new Date(Date.UTC(2026, 6, 1, 12)), 60).map((date, index) => ({
  date: date.getTime(),
  value: Math.max(400, 1200 + Math.round(260 * Math.sin(index / 5.5) + index * 7)),
}));

export function BrushChartDemo() {
  return (
    <BrushChart
      data={brushData}
      label="Daily active users"
      unit="users"
      annotations={[{ date: brushData[20].date, label: "v2 launch", description: "The redesign shipped on this day." }]}
      defaultRange={[brushData[20].date as number, brushData[45].date as number]}
    />
  );
}

function ridge(mean: number, spread: number): number[] {
  return Array.from({ length: 48 }, (_, index) => mean + Math.round(spread * Math.sin(index * 1.7) + ((index * 7) % 5) - 2));
}

const ridgeSeries: RidgelineSeries[] = [
  { id: "jul", label: "July", values: ridge(24, 4) },
  { id: "aug", label: "August", values: ridge(27, 3) },
  { id: "sep", label: "September", values: ridge(21, 5) },
];

export function RidgelineDemo() {
  return <Ridgeline series={ridgeSeries} label="Daily highs in Zurich" unit="°C" tint />;
}

const treemapData: TreemapNode = {
  id: "revenue",
  label: "Revenue",
  children: [
    {
      id: "storage",
      label: "Storage",
      children: [
        { id: "objects", label: "Objects", value: 84, color: 22 },
        { id: "sql", label: "Managed SQL", value: 47, color: 8 },
        { id: "backup", label: "Backups", value: 31, color: 35 },
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
    {
      id: "network",
      label: "Network",
      children: [
        { id: "bandwidth", label: "Bandwidth", value: 39, color: 18 },
        { id: "load-balancers", label: "Load balancers", value: 12, color: -5 },
      ],
    },
    {
      id: "support",
      label: "Support",
      children: [
        { id: "plan-seats", label: "Plan seats", value: 58, color: 41 },
        { id: "egress", label: "Egress overage", value: 9, color: 76 },
      ],
    },
  ],
};

export function TreemapDemo() {
  return <Treemap data={treemapData} label="Revenue by product" colorLabel="Growth" />;
}

const waffleData: WaffleCategory[] = [
  { key: "solar", label: "Solar", value: 350 },
  { key: "wind", label: "Wind", value: 490 },
  { key: "gas", label: "Gas", value: 520 },
  { key: "coal", label: "Coal", value: 610 },
  { key: "hydro", label: "Hydro", value: 260 },
];

export function WaffleChartDemo() {
  // Size containers have no width of their own: give the demo the whole row.
  return <div className="w-full"><WaffleChart data={waffleData} label="Electricity generation, 2025" unit="TWh" legend /></div>;
}

const slopeData: SlopeItem[] = [
  { key: "search", label: "Organic search", start: 38, end: 29 },
  { key: "direct", label: "Direct", start: 24, end: 27 },
  { key: "referral", label: "Referral", start: 12, end: 8 },
  { key: "social", label: "Social", start: 16, end: 21 },
  { key: "newsletter", label: "Newsletter", start: 10, end: 15 },
];

export function SlopeChartDemo() {
  // Size containers have no width of their own: give the demo the whole row.
  return <div className="w-full"><SlopeChart data={slopeData} label="Conversion rate by channel" startLabel="Q1" endLabel="Q2" ranks highlightKey="social" /></div>;
}