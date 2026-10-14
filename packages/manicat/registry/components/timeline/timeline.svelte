<script lang="ts" module>
  import type { Component } from "svelte";

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
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import TimelineCount from "@/registry/components/timeline/timeline-count.svelte";
  import TimelineRow from "@/registry/components/timeline/timeline-row.svelte";
  import { curveOf } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  type Row = TimelineEvent & { time: number; day: string };

  interface Props {
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
    class?: string;
    classNames?: Record<string, string | undefined>;
  }

  let { events, now, label, timeZone = "UTC", locale = "en-US", maxHeight, scrollToNew = true, defaultExpanded = [], headingLevel = 3, class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration } = motionTokens;
  const HOUR = 3_600_000;
  /** Seconds between rows revealed together, so the line reads as drawing downward. */
  const STEP = 0.09;
  const uid = $props.id();
  let scroller: HTMLElement;
  let track: HTMLElement;
  let expanded = $state(new Set(defaultExpanded));
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);

  function dayKey(time: number, zone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(time));
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
  function relative(time: number, reference: number) {
    const minutes = Math.max(0, Math.floor((reference - time) / 60_000));
    if (minutes < 1) return { short: "Now", long: "just now" };
    if (minutes < 60) return { short: `${minutes}m`, long: `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago` };
    const hours = Math.floor(minutes / 60);
    return { short: `${hours}h`, long: `${hours} ${hours === 1 ? "hour" : "hours"} ago` };
  }

  // Rows added after the first render are fresh: they slide in and the rest glide down. Their titles are announced.
  let known = $state({ ids: events.map((event) => event.id).join("|"), set: new Set(events.map((event) => event.id)), fresh: new Set<string>(), announcement: "" });
  $effect.pre(() => {
    const ids = events.map((event) => event.id).join("|");
    if (known.ids === ids) return;
    const added = events.filter((event) => !known.set.has(event.id));
    known = { ids, set: new Set(events.map((event) => event.id)), fresh: new Set([...known.fresh, ...added.map((event) => event.id)]), announcement: added.length ? `New update: ${added.map((event) => [event.actor, event.title].filter(Boolean).join(" ")).join(". ")}` : known.announcement };
  });
  const scrolls = $derived(maxHeight !== undefined);

  // The bottom edge feathers while more updates wait below, and clears once the end is in view.
  onMount(() => {
    if (!scrolls) return;
    const update = () => { if (scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 2) scroller.dataset.more = ""; else delete scroller.dataset.more; };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(track);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  });
  const newestId = $derived(events.reduce<TimelineEvent | null>((latest, event) => (!latest || new Date(event.at).getTime() > new Date(latest.at).getTime() ? event : latest), null)?.id);
  let seenNewest = newestId;
  $effect(() => {
    const next = newestId;
    if (next === seenNewest) return;
    seenNewest = next;
    if (!scrollToNew || !scroller || scroller.scrollTop < 1) return;
    scroller.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  const initialDays = new Set(events.map((event) => dayKey(new Date(event.at).getTime(), timeZone)));
  const groups = $derived.by(() => {
    const today = dayKey(now, timeZone);
    const yesterday = dayKey(now - 24 * HOUR, timeZone);
    const heading = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone });
    const byDay = new Map<string, Row[]>();
    [...events].map((event) => ({ ...event, time: new Date(event.at).getTime() })).sort((a, b) => b.time - a.time).forEach((event) => {
      const day = dayKey(event.time, timeZone);
      byDay.set(day, [...(byDay.get(day) ?? []), { ...event, day }]);
    });
    return [...byDay].map(([day, rows]) => ({ day, rows, label: day === today ? "Today" : day === yesterday ? "Yesterday" : heading.format(new Date(rows[0].time)) }));
  });
  const formats = $derived({
    clock: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }),
    full: new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }),
  });
  const timeOf = (group: { label: string }, row: Row) => {
    const today = group.label === "Today" && now - row.time < 12 * HOUR;
    const time = today ? relative(row.time, now) : { short: formats.clock.format(new Date(row.time)), long: "" };
    return { label: time.short, full: today ? `${time.long}, ${formats.full.format(new Date(row.time))}` : formats.full.format(new Date(row.time)) };
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
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expanded = next;
  }
  function onkeydown(event: KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const triggers = [...(scroller.querySelectorAll<HTMLElement>("[data-timeline-trigger]") ?? [])];
    const index = triggers.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? triggers.length - 1 : Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), triggers.length - 1);
    triggers[next]?.focus();
  }

  // A new day opens from nothing and pushes the older days down; it clips only while it grows.
  const heightCss = (natural: number, t: number) => `height: ${natural * t}px; overflow: hidden; opacity: ${Math.min(1, t * 2)};`;
  function dayIn(node: HTMLElement) {
    if (!node.hasAttribute("data-fresh") || reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => heightCss(natural, t) };
  }
  function dayOut(node: HTMLElement) {
    const natural = node.offsetHeight;
    const length = (reduced ? duration.instant : duration.exit) * 1000;
    return { duration: length, css: (t: number) => heightCss(natural, t) };
  }
  // A new update slides in at the top while the rest glide down; one that goes closes its space.
  function rowIn(node: HTMLElement) {
    if (!node.hasAttribute("data-fresh") || reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; overflow: hidden; opacity: ${Math.min(1, t * 4)};` };
  }
  function rowOut(node: HTMLElement) {
    if (reduced) return { duration: 100 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: { ...(motionTokens.spring.smooth as object), visualDuration: 0.3 } });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; overflow: hidden; opacity: ${Math.min(1, t * 6)};` };
  }
</script>

<div class={["mc-timeline__root", className, classNames?.root]} role="region" aria-label={label}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={scroller} class="mc-timeline__scroller" data-scrolls={scrolls || undefined} style={scrolls ? `--timeline-height: ${typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}` : undefined} {onkeydown}>
    <div bind:this={track}>
      {#each groups as group (group.day)}
        <section class={cn("mc-timeline__group", "group")} aria-labelledby={`${uid}-${group.day}`} data-fresh={!initialDays.has(group.day) || undefined} in:dayIn out:dayOut>
          <div class={cn("mc-timeline__day", "day")} role="heading" aria-level={headingLevel} id={`${uid}-${group.day}`}>
            <span>{group.label}</span>
            <span class={cn("mc-timeline__count", "count")} aria-hidden="true"><TimelineCount value={group.rows.length} {classNames} /> {group.rows.length === 1 ? "update" : "updates"}</span>
            <span class="mc-timeline__srOnly">{`, ${group.rows.length} ${group.rows.length === 1 ? "update" : "updates"}`}</span>
          </div>
          <ol class={cn("mc-timeline__list", "list")}>
            {#each group.rows as row, index (row.id)}
              <TimelineRow {row} last={index === group.rows.length - 1} expanded={expanded.has(row.id)} fresh={known.fresh.has(row.id)} {schedule} timeLabel={timeOf(group, row).label} timeFull={timeOf(group, row).full} {classNames} onToggle={() => toggle(row.id)} {rowIn} {rowOut} />
            {/each}
          </ol>
        </section>
      {/each}
    </div>
  </div>
  <span class="mc-timeline__srOnly" role="status">{known.announcement}</span>
</div>

<style>
:global {
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
}
</style>
