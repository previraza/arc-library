<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import type { Component } from "vue";
import TimelineCount from "@/registry/components/timeline/timeline-count.vue";
import TimelineRow from "@/registry/components/timeline/timeline-row.vue";
import { animateSize, playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface TimelineEvent {
  id: string;
  /** When it happened, as an ISO string or epoch milliseconds. */
  at: string | number;
  /** Who did it, shown first in the foreground color. */
  actor?: string;
  /** What happened, completing the actor: "merged Checkout redesign into main". */
  title: string;
  /** Short context under the title, such as a pull request or a build. */
  meta?: string;
  /** Revealed in place when the row is expanded. Rows without detail are not interactive. */
  detail?: string;
  /** Portrait for an event by a person. */
  avatar?: string;
  /** Icon for a system event, used when there is no avatar. */
  icon?: Component;
  /** Status of a system event. Always say the outcome in the title too, so it never rests on color. */
  tone?: "neutral" | "success" | "danger";
}

type Row = TimelineEvent & { time: number; day: string };

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Updates in any order; the newest shows first. */
    events: TimelineEvent[];
    /** Reference time for relative labels and day groups, in epoch milliseconds. Pass a ticking clock to keep labels fresh. */
    now: number;
    /** Accessible name for the feed. */
    label: string;
    /** Time zone for day groups and clock times. Fixed by default so server and client agree. */
    timeZone?: string;
    locale?: string;
    /** Height of the scrolling area. Without it the feed grows with the page and reveals on page scroll. */
    maxHeight?: number | string;
    /** Scroll back to the top when a new update arrives while the feed is scrolled down. */
    scrollToNew?: boolean;
    defaultExpanded?: string[];
    /** Heading level for the day labels. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    classNames?: Record<string, string | undefined>;
  }>(),
  { timeZone: "UTC", locale: "en-US", scrollToNew: true, defaultExpanded: () => [], headingLevel: 3 },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration } = motionTokens;
const HOUR = 3_600_000;
/** Seconds between rows revealed together, so the line reads as drawing downward. */
const STEP = 0.09;
const uid = useId();
const scroller = ref<HTMLElement>();
const track = ref<HTMLElement>();
const expanded = ref(new Set(props.defaultExpanded));
const cn = (base: string, key: string, extra?: string) => [base, props.classNames?.[key], extra].filter(Boolean).join(" ");

function dayKey(time: number, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(time));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function relative(time: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - time) / 60_000));
  if (minutes < 1) return { short: "Now", long: "just now" };
  if (minutes < 60) return { short: `${minutes}m`, long: `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago` };
  const hours = Math.floor(minutes / 60);
  return { short: `${hours}h`, long: `${hours} ${hours === 1 ? "hour" : "hours"} ago` };
}

// Rows added after the first render are fresh: they slide in and the rest glide down. Their titles are announced.
const known = ref({ ids: props.events.map((event) => event.id).join("|"), set: new Set(props.events.map((event) => event.id)), fresh: new Set<string>(), announcement: "" });
watch(() => props.events.map((event) => event.id).join("|"), (ids) => {
  const added = props.events.filter((event) => !known.value.set.has(event.id));
  known.value = { ids, set: new Set(props.events.map((event) => event.id)), fresh: new Set([...known.value.fresh, ...added.map((event) => event.id)]), announcement: added.length ? `New update: ${added.map((event) => [event.actor, event.title].filter(Boolean).join(" ")).join(". ")}` : known.value.announcement };
}, { flush: "sync" });
const scrolls = computed(() => props.maxHeight !== undefined);

// The bottom edge feathers while more updates wait below, and clears once the end is in view.
let observer: ResizeObserver | undefined;
onMounted(() => {
  const area = scroller.value;
  const inner = track.value;
  if (!scrolls.value || !area || !inner) return;
  const update = () => { if (area.scrollHeight - area.clientHeight - area.scrollTop > 2) area.dataset.more = ""; else delete area.dataset.more; };
  update();
  area.addEventListener("scroll", update, { passive: true });
  observer = new ResizeObserver(update);
  observer.observe(area);
  observer.observe(inner);
});
onBeforeUnmount(() => observer?.disconnect());

const newestId = computed(() => props.events.reduce<TimelineEvent | null>((latest, event) => (!latest || new Date(event.at).getTime() > new Date(latest.at).getTime() ? event : latest), null)?.id);
watch(newestId, () => {
  const area = scroller.value;
  if (!props.scrollToNew || !area || area.scrollTop < 1) return;
  area.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
});

const initialDays = new Set(props.events.map((event) => dayKey(new Date(event.at).getTime(), props.timeZone)));
const groups = computed(() => {
  const today = dayKey(props.now, props.timeZone);
  const yesterday = dayKey(props.now - 24 * HOUR, props.timeZone);
  const heading = new Intl.DateTimeFormat(props.locale, { weekday: "long", month: "long", day: "numeric", timeZone: props.timeZone });
  const byDay = new Map<string, Row[]>();
  [...props.events].map((event) => ({ ...event, time: new Date(event.at).getTime() })).sort((a, b) => b.time - a.time).forEach((event) => {
    const day = dayKey(event.time, props.timeZone);
    byDay.set(day, [...(byDay.get(day) ?? []), { ...event, day }]);
  });
  return [...byDay].map(([day, rows]) => ({ day, rows, label: day === today ? "Today" : day === yesterday ? "Yesterday" : heading.format(new Date(rows[0].time)) }));
});
const formats = computed(() => ({
  clock: new Intl.DateTimeFormat(props.locale, { hour: "numeric", minute: "2-digit", timeZone: props.timeZone }),
  full: new Intl.DateTimeFormat(props.locale, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: props.timeZone }),
}));
const timeOf = (group: { label: string }, row: Row) => {
  const today = group.label === "Today" && props.now - row.time < 12 * HOUR;
  const time = today ? relative(row.time, props.now) : { short: formats.value.clock.format(new Date(row.time)), long: "" };
  return { label: time.short, full: today ? `${time.long}, ${formats.value.full.format(new Date(row.time))}` : formats.value.full.format(new Date(row.time)) };
};

// Rows that come into view together are spaced a beat apart, so the line reads as drawing down the feed.
let nextReveal = 0;
function schedule() {
  if (reduced) return 0;
  const current = performance.now() / 1000;
  const start = Math.min(Math.max(current, nextReveal), current + 0.45);
  nextReveal = start + STEP;
  return start - current;
}
function toggle(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}
function onKeydown(event: KeyboardEvent) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const triggers = [...(scroller.value?.querySelectorAll<HTMLElement>("[data-timeline-trigger]") ?? [])];
  const index = triggers.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? triggers.length - 1 : Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), triggers.length - 1);
  triggers[next]?.focus();
}

// A new day opens from nothing and pushes the older days down; it clips only while it grows.
function enterDay(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (!node.hasAttribute("data-fresh")) return done();
  if (reduced) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: 0.15 }).finished.then(done);
  node.dataset.entering = "";
  node.style.height = "0px";
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.standard, ease: "enter" });
  animateSize(node, "height", "open", { spring: "smooth" }).finished.then(() => {
    delete node.dataset.entering;
    done();
  });
}
function leaveDay(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.dataset.entering = "";
  playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: reduced ? duration.instant : duration.exit, ease: "standard" });
  animateSize(node, "height", "close", { duration: reduced ? duration.instant : duration.exit }).finished.then(done);
}
// A new update slides in at the top while the rest glide down; one that goes closes its space.
function enterRow(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (!node.hasAttribute("data-fresh")) return done();
  if (reduced) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: 0.15 }).finished.then(done);
  node.dataset.entering = "";
  node.style.height = "0px";
  animateSize(node, "height", "open", { spring: "smooth" }).finished.then(() => {
    delete node.dataset.entering;
    done();
  });
  const content = node.querySelector<HTMLElement>("[data-content]");
  if (content) playPose(content, { opacity: 0, y: -10, blur: motionTokens.blur.soft }, { opacity: 1, y: 0, blur: 0 }, { spring: "smooth", fade: duration.standard, fadeDelay: 0.05 });
}
function leaveRow(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.dataset.entering = "";
  if (reduced) return void playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: 0.1 }).finished.then(done);
  playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: 0.12 });
  animateSize(node, "height", "close", { spring: { ...(motionTokens.spring.smooth as object), visualDuration: 0.3 } }).finished.then(done);
}
</script>

<template>
  <div v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-timeline__root', 'root', $attrs.class as string | undefined)" role="region" :aria-label="label">
    <div ref="scroller" class="mc-timeline__scroller" :data-scrolls="scrolls || undefined" :style="scrolls ? { '--timeline-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined" @keydown="onKeydown">
      <div ref="track">
        <TransitionGroup tag="div" style="display: contents" :css="false" @enter="enterDay" @leave="leaveDay">
          <section v-for="group in groups" :key="group.day" :class="cn('mc-timeline__group', 'group')" :aria-labelledby="`${uid}-${group.day}`" :data-fresh="!initialDays.has(group.day) || undefined">
            <div :class="cn('mc-timeline__day', 'day')" role="heading" :aria-level="headingLevel" :id="`${uid}-${group.day}`">
              <span>{{ group.label }}</span>
              <span :class="cn('mc-timeline__count', 'count')" aria-hidden="true"><TimelineCount :value="group.rows.length" :class-names="classNames" /> {{ group.rows.length === 1 ? "update" : "updates" }}</span>
              <span class="mc-timeline__srOnly">{{ `, ${group.rows.length} ${group.rows.length === 1 ? "update" : "updates"}` }}</span>
            </div>
            <ol :class="cn('mc-timeline__list', 'list')">
              <TransitionGroup tag="div" style="display: contents" :css="false" @enter="enterRow" @leave="leaveRow">
                <TimelineRow v-for="(row, index) in group.rows" :key="row.id" :row="row" :last="index === group.rows.length - 1" :expanded="expanded.has(row.id)" :fresh="known.fresh.has(row.id)" :schedule="schedule" :time-label="timeOf(group, row).label" :time-full="timeOf(group, row).full" :class-names="classNames" @toggle="toggle(row.id)" />
              </TransitionGroup>
            </ol>
          </section>
        </TransitionGroup>
      </div>
    </div>
    <span class="mc-timeline__srOnly" role="status">{{ known.announcement }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Geometry: a 28px marker column, the line centred under it, and rows whose first text line centres on the marker. */
.mc-timeline__root { --marker: 28px; --marker-top: 8px; --line-gap: 4px; position: relative; display: grid; min-width: 0; color: var(--foreground); }
/* Inserting at the top pushes the rows down instead of the browser holding the scroll position still. */
.mc-timeline__scroller { min-width: 0; overflow-anchor: none; }
@property --timeline-feather { syntax: "<length>"; inherits: false; initial-value: 0px; }
.mc-timeline__scroller[data-scrolls] { max-height: var(--timeline-height); overflow-y: auto; overscroll-behavior: contain; scrollbar-color: var(--border-strong) transparent; scrollbar-width: thin; mask-image: linear-gradient(to bottom, #000 calc(100% - var(--timeline-feather)), transparent); transition: --timeline-feather var(--duration-standard) var(--ease-standard); }
/* While more updates wait below, the last visible row fades into the edge instead of being cut. */
.mc-timeline__scroller[data-more] { --timeline-feather: 36px; }
.mc-timeline__group { position: relative; }
.mc-timeline__group[data-entering] { overflow: clip; }
/* Day labels stay pinned while their updates scroll under them. Set --timeline-surface when the feed sits on another surface. */
.mc-timeline__day { position: sticky; z-index: 2; top: 0; display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); padding: var(--space-2) var(--space-3) var(--space-2) 0; background: var(--timeline-surface, var(--surface)); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-timeline__count { color: var(--text-muted); font-size: var(--text-xs); font-weight: 400; font-variant-numeric: tabular-nums; }
.mc-timeline__rolling { display: inline-flex; }
.mc-timeline__place { position: relative; display: inline-flex; overflow: clip; overflow-clip-margin: .15em; }
.mc-timeline__rise { position: relative; display: inline-flex; }
.mc-timeline__riseLine { display: inline-block; white-space: nowrap; }
.mc-timeline__list { margin: 0 0 var(--space-3); padding: 0; list-style: none; }

.mc-timeline__item { position: relative; padding-left: calc(var(--marker) + var(--space-2)); }
.mc-timeline__item[data-entering] { overflow: clip; }
.mc-timeline__marker { position: absolute; z-index: 1; top: var(--marker-top); left: 0; display: grid; width: var(--marker); height: var(--marker); place-items: center; border-radius: var(--radius-pill); color: var(--text-secondary); }
.mc-timeline__marker img { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
/* A person's portrait sits on a hairline ring; a system event is a quiet node with its icon. */
.mc-timeline__marker::after { content: ""; position: absolute; inset: 0; border: 1px solid color-mix(in oklab, var(--foreground) 10%, transparent); border-radius: inherit; pointer-events: none; }
.mc-timeline__marker[data-tone] { background: var(--surface); }
.mc-timeline__marker[data-tone="success"] { background: color-mix(in oklab, var(--success) 12%, var(--surface)); color: var(--success); }
.mc-timeline__marker[data-tone="danger"] { background: color-mix(in oklab, var(--danger) 12%, var(--surface)); color: var(--danger); }
.mc-timeline__marker svg { width: 14px; height: 14px; stroke-width: 2; }
/* The line runs from just under this marker to just above the next one and draws downward from its top. */
.mc-timeline__segment { position: absolute; top: calc(var(--marker-top) + var(--marker) + var(--line-gap)); bottom: calc(var(--line-gap) - var(--marker-top)); left: calc(var(--marker) / 2 - .5px); width: 1px; background: var(--border-strong); transform-origin: 50% 0; }

.mc-timeline__content { min-width: 0; }
.mc-timeline__trigger { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto; align-items: start; column-gap: var(--space-3); margin: 0; padding: 12px var(--space-3); border: 0; border-radius: var(--radius-control); background: transparent; color: inherit; font: inherit; text-align: left; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
button.mc-timeline__trigger { grid-template-columns: minmax(0, 1fr) auto 16px; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { button.mc-timeline__trigger:hover { background: var(--surface-muted); } }
button.mc-timeline__trigger:active { background: var(--surface-muted); }
.mc-timeline__text { display: grid; min-width: 0; gap: 2px; }
.mc-timeline__title { color: var(--text-secondary); font-size: var(--text-sm); line-height: 20px; }
.mc-timeline__actor { color: var(--foreground); font-weight: 500; }
.mc-timeline__meta { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
/* Times keep a steady column, so "9m" becoming "10m" never rewraps the title beside it. */
.mc-timeline__time { display: flex; min-width: 2.75rem; justify-content: flex-end; color: var(--text-muted); font-size: var(--text-xs); line-height: 20px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mc-timeline__chevron { display: grid; height: 20px; place-items: center; color: var(--text-muted); }
.mc-timeline__detail { overflow: clip; overflow-clip-margin: 4px; }
.mc-timeline__detailInner { padding: 0 var(--space-3) var(--space-4); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }

.mc-timeline__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 420px) { .mc-timeline__trigger { column-gap: var(--space-2); padding-inline: var(--space-2); } .mc-timeline__detailInner { padding-inline: var(--space-2); } }
@media (prefers-reduced-motion: reduce) { .mc-timeline__trigger { transition: none; } .mc-timeline__scroller[data-scrolls] { transition: --timeline-feather var(--duration-instant) var(--ease-standard); } }
</style>
