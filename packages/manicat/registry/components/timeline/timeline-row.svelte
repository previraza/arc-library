<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount } from "svelte";
  import type { Component } from "svelte";
  import { ChevronDown } from "@lucide/svelte";
  import TimelineRise from "@/registry/components/timeline/timeline-rise.svelte";
  import { curveOf, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  let { row, last, expanded, fresh, schedule, timeLabel, timeFull, classNames, onToggle, rowIn, rowOut }: {
    row: { id: string; at: string | number; actor?: string; title: string; meta?: string; detail?: string; avatar?: string; icon?: Component; tone?: "neutral" | "success" | "danger"; time: number };
    last: boolean;
    expanded: boolean;
    fresh: boolean;
    schedule: () => number;
    timeLabel: string;
    timeFull: string;
    classNames?: Record<string, string | undefined>;
    onToggle: () => void;
    rowIn: (node: HTMLElement) => object;
    rowOut: (node: HTMLElement) => object;
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, spring } = motionTokens;
  const detailId = $props.id();
  let item: HTMLElement;
  let marker: HTMLElement;
  let segment = $state<HTMLElement>();
  let chevron = $state<HTMLElement>();
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const tone = $derived(row.avatar ? undefined : (row.tone ?? "neutral"));

  // The row reveals once, the first time it scrolls into view: its marker pops, then its line draws toward the next row.
  onMount(() => {
    marker.style.opacity = "0";
    marker.style.transform = "scale(0.4)";
    if (segment) segment.style.transform = "scaleY(0)";
    const seen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      seen.disconnect();
      const delay = schedule() + (fresh ? 0.12 : 0);
      if (reduced) animate(marker, { scale: 1, opacity: 1 } as never, { duration: 0, opacity: { duration: 0.15 } } as never);
      else animate(marker, { scale: [0.4, 1], opacity: [0, 1] } as never, { ...(spring.morph as object), visualDuration: 0.36, bounce: 0.32, delay, opacity: { duration: duration.fast, ease: [...motionTokens.ease.enter], delay } } as never);
      if (segment) animate(segment, { scaleY: [0, 1] } as never, (reduced ? { duration: 0 } : { ...(spring.smooth as object), visualDuration: 0.34, delay: delay + 0.1 }) as never);
    }, { threshold: 0.2 });
    seen.observe(item);
    return () => seen.disconnect();
  });
  let firstChevron = true;
  $effect(() => {
    const open = expanded;
    if (!chevron) return;
    if (firstChevron) {
      firstChevron = false;
      return;
    }
    animate(chevron, { rotate: open ? 180 : 0 } as never, (reduced ? { duration: 0 } : spring.snappy) as never);
  });

  // The detail opens in place: its height first, then its text settles in.
  function detailIn(node: HTMLElement) {
    if (reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; overflow: hidden;` };
  }
  function detailOut(node: HTMLElement) {
    if (reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: { ...(spring.smooth as object), visualDuration: 0.28 } });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; overflow: hidden;` };
  }
  const innerIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -4, blur: motionTokens.blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0.15 } : { duration: duration.standard, ease: "enter", delay: 0.06 })(node);
</script>

<li bind:this={item} class={cn("mc-timeline__item", "item")} data-fresh={fresh || undefined} in:rowIn out:rowOut>
  <span bind:this={marker} class={cn("mc-timeline__marker", "marker")} data-tone={tone} aria-hidden="true">
    {#if row.avatar}<img src={row.avatar} alt="" width="28" height="28" decoding="async" />{:else if row.icon}{@const Icon = row.icon}<Icon />{/if}
  </span>
  {#if !last}<span bind:this={segment} class={cn("mc-timeline__segment", "segment")} aria-hidden="true"></span>{/if}
  <div data-content class={cn("mc-timeline__content", "content")}>
    <svelte:element this={row.detail ? "button" : "div"} class={cn("mc-timeline__trigger", "trigger")} type={row.detail ? "button" : undefined} data-timeline-trigger={row.detail ? "" : undefined} aria-expanded={row.detail ? expanded : undefined} aria-controls={row.detail && expanded ? detailId : undefined} onclick={row.detail ? onToggle : undefined}>
      <span class={cn("mc-timeline__text", "text")}>
        <span class={cn("mc-timeline__title", "title")}>{#if row.actor}<span class={cn("mc-timeline__actor", "actor")}>{row.actor}</span>{/if}{row.actor ? " " : ""}{row.title}</span>
        {#if row.meta}<span class={cn("mc-timeline__meta", "meta")}>{row.meta}</span>{/if}
      </span>
      <time class={cn("mc-timeline__time", "time")} datetime={new Date(row.time).toISOString()} title={timeFull}><TimelineRise text={timeLabel} {classNames} /><span class="mc-timeline__srOnly">{timeFull}</span></time>
      {#if row.detail}<span bind:this={chevron} class={cn("mc-timeline__chevron", "chevron")} aria-hidden="true"><ChevronDown size={16} strokeWidth={1.75} /></span>{/if}
    </svelte:element>
    {#if expanded && row.detail}
      <div id={detailId} class={cn("mc-timeline__detail", "detail")} in:detailIn out:detailOut><div class={cn("mc-timeline__detailInner", "detailInner")} in:innerIn>{row.detail}</div></div>
    {/if}
  </div>
</li>
