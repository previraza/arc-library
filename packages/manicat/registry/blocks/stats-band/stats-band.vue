<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

export type StatVisual =
  | { kind: "trend"; values: number[] }
  | { kind: "uptime"; days: number[] }
  | { kind: "distribution"; bins: number[]; max: number; marker: number };

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** `compact` shortens large numbers to 2.3M or 12K. */
  notation?: "standard" | "compact";
  label: string;
  detail?: string;
  context?: string;
  visual?: StatVisual;
}

const uptimeDays = Array.from({ length: 90 }, (_, day) => (day === 51 ? 99.24 : day === 23 ? 99.93 : 100));
const exampleStats: Stat[] = [
  { value: 2_334_000, notation: "compact", decimals: 1, label: "Deploys in the last 12 months", detail: "Across 12,400 teams", context: "Up from 1.4M the year before", visual: { kind: "trend", values: [141, 148, 139, 162, 171, 184, 196, 203, 221, 238, 257, 274] } },
  { value: 99.99, decimals: 2, suffix: "%", label: "API uptime over 90 days", detail: "Measured every 30 seconds", context: "12 minutes down, 11 of them on July 14", visual: { kind: "uptime", days: uptimeDays } },
  { value: 38, suffix: "ms", label: "Median response time", detail: "At the edge, worldwide", context: "p95 is 96 ms, down from 141 ms", visual: { kind: "distribution", bins: [2, 8, 18, 26, 15, 10, 7, 5, 3, 2, 1.5, 1, 0.8, 0.7, 0.5, 0.3], max: 160, marker: 38 } },
  { value: 35, label: "Edge regions on six continents", detail: "Most people are under 20 ms away", context: "Eight added this year, including Lagos" },
];

const props = withDefaults(
  defineProps<{
    stats?: Stat[];
    /** `plain` lets the stats float on whitespace; `divided` sets them in a hairline grid. */
    layout?: "plain" | "divided";
    title?: string;
    description?: string;
    /** Milliseconds each number takes to count up. */
    duration?: number;
    locale?: string;
    /** Extend the inner, named parts of the band: title, description, stat, number or label. */
    classNames?: { title?: string; description?: string; stat?: string; number?: string; label?: string };
  }>(),
  { stats: () => exampleStats, layout: "plain", duration: 1600, locale: "en-US" },
);

const progress = ref(0);
const root = ref<HTMLElement>();
let frame = 0;
let observer: IntersectionObserver | undefined;

function run() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const tick = (now: number) => {
    const t = reduced ? 1 : Math.min(1, (now - start) / props.duration);
    progress.value = 1 - Math.pow(1 - t, 3);
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !root.value) return run();
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer?.disconnect();
    run();
  }, { threshold: 0.4 });
  observer.observe(root.value);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
});

function parts(stat: Stat, value: number) {
  const digits = new Intl.NumberFormat(props.locale, { minimumFractionDigits: stat.decimals ?? 0, maximumFractionDigits: stat.decimals ?? 0 });
  if (stat.notation !== "compact") return { text: digits.format(value), unit: "" };
  const size = Math.abs(stat.value);
  const [scale, unit] = size >= 1e9 ? [1e9, "B"] : size >= 1e6 ? [1e6, "M"] : size >= 1e3 ? [1e3, "K"] : [1, ""];
  return { text: digits.format(value / scale), unit: unit as string };
}
const live = (stat: Stat) => { const p = parts(stat, stat.value * progress.value); return `${stat.prefix ?? ""}${p.text}${p.unit}${stat.suffix ?? ""}`; };
const final = (stat: Stat) => { const p = parts(stat, stat.value); return `${stat.prefix ?? ""}${p.text}${p.unit}${stat.suffix ?? ""}`; };

function bars(visual: StatVisual) {
  if (visual.kind === "trend") {
    const min = Math.min(...visual.values), span = Math.max(...visual.values) - min || 1;
    return visual.values.map((value) => ({ h: 0.2 + ((value - min) / span) * 0.8, ink: true }));
  }
  if (visual.kind === "uptime") return visual.days.map((uptime) => ({ h: Math.min(1, Math.max(0.3, 1 - (100 - uptime) * 0.7)), ink: uptime < 100 }));
  const peak = Math.max(...visual.bins) || 1, width = visual.max / visual.bins.length;
  return visual.bins.map((count, index) => ({ h: Math.max(0.04, count / peak), ink: index * width < visual.marker }));
}
</script>

<template>
  <section ref="root" :class="['mc-stats', `mc-stats--${layout}`]" :aria-label="title ?? 'Key numbers'">
    <header v-if="title || description" class="mc-stats__header">
      <h2 v-if="title" :class="['mc-stats__title', classNames?.title]">{{ title }}</h2>
      <p v-if="description" :class="['mc-stats__description', classNames?.description]">{{ description }}</p>
    </header>
    <dl class="mc-stats__list" :style="{ '--count': Math.min(stats.length, 4) }">
      <div v-for="(stat, index) in stats" :key="`${stat.label}-${index}`" :class="['mc-stats__stat', classNames?.stat]" :tabindex="stat.context ? 0 : undefined">
        <dt :class="['mc-stats__label', classNames?.label]">{{ stat.label }}</dt>
        <dd :class="['mc-stats__number', classNames?.number]">
          <span class="mc-stats__sr">{{ final(stat) }}</span>
          <span aria-hidden="true">{{ live(stat) }}</span>
        </dd>
        <dd v-if="stat.detail || stat.context" class="mc-stats__caption">
          <span class="mc-stats__detail">{{ stat.detail }}</span>
          <span class="mc-stats__context">{{ stat.context }}</span>
        </dd>
        <dd v-if="stat.visual" class="mc-stats__bars" aria-hidden="true">
          <span v-for="(bar, at) in bars(stat.visual)" :key="at" :class="['mc-stats__bar', { 'mc-stats__bar--ink': bar.ink }]" :style="{ height: `${bar.h * progress * 100}%` }" />
        </dd>
      </div>
    </dl>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-stats { display: grid; gap: 24px; color: var(--foreground); }
.mc-stats__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.03em; }
.mc-stats__description { margin: 6px 0 0; max-width: 52ch; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-stats__list { display: grid; grid-template-columns: repeat(var(--count, 3), minmax(0, 1fr)); gap: 24px; margin: 0; }
.mc-stats--divided .mc-stats__list { gap: 0; border-block: 1px solid var(--border); }
.mc-stats--divided .mc-stats__stat { padding: 24px; border-inline-start: 1px solid var(--border); }
.mc-stats--divided .mc-stats__stat:first-child { border-inline-start: 0; }
.mc-stats__stat { display: grid; align-content: start; gap: 6px; outline: none; }
.mc-stats__label { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-stats__number { margin: 0; font-size: 44px; font-weight: 600; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.mc-stats__caption { display: grid; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-stats__context { display: none; }
.mc-stats__stat:is(:hover, :focus-visible) .mc-stats__context { display: block; color: var(--foreground); }
.mc-stats__stat:is(:hover, :focus-visible) .mc-stats__context ~ *, .mc-stats__stat:is(:hover, :focus-visible) .mc-stats__detail:has(+ .mc-stats__context) { display: none; }
.mc-stats__bars { display: flex; align-items: flex-end; gap: 1px; height: 40px; margin: 8px 0 0; }
.mc-stats__bar { flex: 1; border-radius: 1px; background: var(--border-strong, var(--border)); }
.mc-stats__bar--ink { background: var(--foreground); }
.mc-stats__stat:is(:hover, :focus-visible) .mc-stats__bar--ink { background: var(--accent); }
.mc-stats__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 720px) { .mc-stats__list { grid-template-columns: 1fr 1fr; } }
@media (max-width: 420px) { .mc-stats__list { grid-template-columns: 1fr; } }
</style>
