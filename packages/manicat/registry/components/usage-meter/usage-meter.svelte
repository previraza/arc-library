<script lang="ts" module>
  import type { MeterSegment } from "@/lib/usage-meter";

  export type UsageMeterSegment = MeterSegment;
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import { CircleAlert, TriangleAlert } from "@lucide/svelte";
  import UsageMeterSwap from "@/registry/components/usage-meter/usage-meter-swap.svelte";
  import UsageMeterTicker from "@/registry/components/usage-meter/usage-meter-ticker.svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { createBadgeWidth, createUsageBar, popPoses } from "@/lib/usage-meter";
  

  type Status = "ok" | "near" | "over";

  /** Use a usage meter for a fixed allowance, such as storage or seats, when people need to see what takes the space and how close they are to the limit. */
  interface Props {
    /** What is measured, such as "Workspace storage". */
    label: string;
    /** Used amounts in display order. Up to four read clearly. */
    segments: UsageMeterSegment[];
    /** The plan limit, in the same unit as the segments. */
    limit: number;
    unit?: string;
    /** Digits after the decimal point. */
    decimals?: number;
    freeLabel?: string;
    overLabel?: string;
    /** Share of the limit at which the meter warns that it is almost full. */
    warnAt?: number;
    /** Extend the inner, named parts of the usage meter: top, title, badge, badgeInner, badgeIcon, total, amount, ticker, column, glyph, symbol, caption, swap, swapText, bar, track, segment, overflow, hatch, overTint, limit, legend, item, itemHead, key, keyIcon, swatch, itemLabel, itemValue or itemUnit. */
    classNames?: Record<string, string | undefined>;
    class?: string;
    [key: string]: unknown;
  }

  let { label, segments, limit, unit = "", decimals = 1, freeLabel = "Free", overLabel = "Over limit", warnAt = 0.9, classNames, class: className, ...rest }: Props = $props();

  const titleId = $props.id();
  const hatchId = `hatch${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);

  let root = $state<HTMLElement>();
  let track = $state<HTMLElement>();
  let overflow = $state<SVGElement>();
  let marker = $state<HTMLElement>();
  let badge = $state<HTMLElement>();
  let badgeInner = $state<HTMLElement>();
  let legend = $state<HTMLElement>();
  let seen = $state(false);
  let bar = $state.raw<ReturnType<typeof createUsageBar>>();

  const ready = $derived(seen || reduced);
  const round = (value: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;
  const total = $derived(round(segments.reduce((sum, segment) => sum + segment.value, 0)));
  const free = $derived(round(Math.max(0, limit - total)));
  const over = $derived(round(Math.max(0, total - limit)));
  const status = $derived<Status>(total > limit ? "over" : total >= limit * warnAt ? "near" : "ok");
  const format = (value: number) => `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
  const limitText = $derived(format(limit).replace(/\.0+(?= |$)/, ""));

  onMount(() => {
    const made = createUsageBar({ track: track!, overflow: overflow as unknown as HTMLElement, marker: marker! }, { reduced, limit });
    bar = made;
    const stopBadge = createBadgeWidth(badge!, badgeInner!, reduced);
    let observer: IntersectionObserver | undefined;
    if (!reduced) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer?.disconnect();
        seen = true;
      }, { threshold: 0.4 });
      observer.observe(root!);
    }
    return () => { made.destroy(); stopBadge(); observer?.disconnect(); };
  });
  $effect(() => {
    const next = { segments: segments.map((segment) => ({ ...segment })), limit, ready };
    queueMicrotask(() => bar?.update(next));
  });

  // Hover previews a category, focus previews it too, and a press pins it until pressed again or Escape.
  let hovered = $state<string | null>(null);
  let focused = $state<string | null>(null);
  let pinned = $state<string | null>(null);
  let roving = $state(0);
  const items = $derived([...segments.map((segment) => ({ id: segment.id, label: segment.label, value: segment.value })), { id: "free", label: status === "over" ? overLabel : freeLabel, value: status === "over" ? over : free }]);
  const active = $derived(hovered ?? focused ?? pinned);
  const activeItem = $derived(items.find((item) => item.id === active) ?? null);
  const highlight = (id: string) => (active ? (active === id ? "on" : "off") : undefined);

  const idAt = (clientX: number) => {
    const rect = track?.getBoundingClientRect();
    if (!rect?.width) return null;
    const at = ((clientX - rect.left) / rect.width) * Math.max(limit, total);
    // Past the limit the hatch stands for the overage, so pointing there highlights it rather than the category beneath.
    if (at > limit) return "free";
    let end = 0;
    for (const segment of segments) {
      end += segment.value;
      if (at <= end) return segment.id;
    }
    return "free";
  };
  const onTrackMove = (event: PointerEvent) => { if (event.pointerType === "mouse") hovered = idAt(event.clientX); };
  const onTrackTap = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const id = idAt(event.clientX);
    pinned = pinned === id ? null : id;
  };
  const onLegendKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (pinned || focused) { event.preventDefault(); pinned = null; }
      return;
    }
    const next = ({ ArrowRight: roving + 1, ArrowDown: roving + 1, ArrowLeft: roving - 1, ArrowUp: roving - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = (next + items.length) % items.length;
    roving = index;
    legend?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
  };

  const headline = $derived(ready ? (activeItem ? activeItem.value : total) : 0);
  const share = $derived(activeItem ? Math.round((activeItem.value / limit) * 100) : 0);
  const caption = $derived(!activeItem ? `${unit} of ${limitText} used` : activeItem.id === "free" ? `${unit} ${status === "over" ? "over the limit" : "free"}` : `${unit} in ${activeItem.label} · ${share}% of plan`);
  const badgeText = $derived(status === "over" ? `${format(over)} over` : status === "near" ? "Almost full" : `${format(free)} free`);
  const summary = $derived(`${label}: ${format(total)} of ${limitText} used. ${segments.map((segment) => `${segment.label} ${format(segment.value)}`).join(", ")}. ${status === "over" ? `Over the limit by ${format(over)}.` : `${format(free)} free${status === "near" ? ", almost full" : ""}.`}`);
  // Status changes are announced, and so is a growing overage; routine changes inside a status stay quiet.
  const notice = $derived(status === "over" ? `over:${over}` : status);
  let announcedNotice = notice;
  let announced = $state("");
  $effect.pre(() => {
    const next = notice;
    if (next === announcedNotice) return;
    announcedNotice = next;
    announced = status === "over" ? `Over the plan limit by ${format(over)}.` : status === "near" ? `Almost full. ${format(free)} free.` : `Under the limit. ${format(free)} free.`;
  });

  // The icons scale and blur in on a spring, and leave a little faster while they pop out of the flow.
  const popIn = (node: HTMLElement) => { const poses = popPoses(reduced); return poseTransition(poses.from, poses.rest, poses.enterTiming)(node); };
  const popOut = (node: HTMLElement) => { const poses = popPoses(reduced); return poseTransition(poses.from, poses.rest, poses.leaveTiming, { pop: true })(node); };
</script>

<div bind:this={root} {...rest} class={["mc-usage-meter__meter", className]} role="group" aria-labelledby={titleId} data-status={status}>
  <div class={cn("mc-usage-meter__top", "top")}>
    <span id={titleId} class={cn("mc-usage-meter__title", "title")}>{label}</span>
    <span bind:this={badge} class={cn("mc-usage-meter__badge", "badge")} data-status={status}>
      <span bind:this={badgeInner} class={cn("mc-usage-meter__badgeInner", "badgeInner")}>
        {#if status !== "ok"}
          {#key status}
            <span class={cn("mc-usage-meter__badgeIcon", "badgeIcon")} in:popIn out:popOut>{#if status === "over"}<TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />{:else}<CircleAlert size={14} strokeWidth={2} aria-hidden="true" />{/if}</span>
          {/key}
        {/if}
        <UsageMeterSwap text={badgeText} {classNames} />
      </span>
    </span>
  </div>
  <p class={cn("mc-usage-meter__total", "total")}>
    <span class="mc-usage-meter__srOnly">{format(total)} of {limitText} used</span>
    <span class={cn("mc-usage-meter__amount", "amount")} aria-hidden="true"><UsageMeterTicker value={headline} {decimals} {classNames} /></span>
    <span class={cn("mc-usage-meter__caption", "caption")} aria-hidden="true"><UsageMeterSwap text={caption} {classNames} /></span>
  </p>
  <div class={cn("mc-usage-meter__bar", "bar")}>
    <div bind:this={track} class={cn("mc-usage-meter__track", "track")} role="img" aria-label={summary} data-active={active ?? undefined} onpointermove={onTrackMove} onpointerleave={() => (hovered = null)} onpointerup={onTrackTap}>
      {#each segments as segment, index (segment.id)}
        <span data-seg class={cn("mc-usage-meter__segment", "segment")} data-index={index} data-highlight={highlight(segment.id)}></span>
      {/each}
      <!-- Past the limit the bar is struck through: the overflow keeps its colours, hatched so it reads as over without colour. -->
      <svg bind:this={overflow} class={cn("mc-usage-meter__overflow", "overflow")} data-highlight={highlight("free")} aria-hidden="true" focusable="false">
        <defs><pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={2.5} height={6} class={cn("mc-usage-meter__hatch", "hatch")} /></pattern></defs>
        <rect class={cn("mc-usage-meter__overTint", "overTint")} width="100%" height="100%" />
        <rect width="100%" height="100%" fill={`url(#${hatchId})`} />
      </svg>
    </div>
    <span bind:this={marker} class={cn("mc-usage-meter__limit", "limit")} aria-hidden="true"></span>
  </div>
  <div bind:this={legend} class={cn("mc-usage-meter__legend", "legend")} role="group" aria-label={`${label} by category`} onkeydown={onLegendKey}>
    {#each items as item, index (item.id)}
      <button
        type="button"
        class={cn("mc-usage-meter__item", "item")}
        data-highlight={highlight(item.id)}
        aria-pressed={pinned === item.id}
        aria-label={`${item.label}, ${format(item.value)}`}
        tabindex={index === roving ? 0 : -1}
        onclick={() => { roving = index; pinned = pinned === item.id ? null : item.id; }}
        onfocus={() => { roving = index; focused = item.id; }}
        onblur={() => (focused = null)}
        onpointerenter={(event) => { if (event.pointerType === "mouse") hovered = item.id; }}
        onpointerleave={(event) => { if (event.pointerType === "mouse") hovered = null; }}
      >
        <span class={cn("mc-usage-meter__itemHead", "itemHead")}>
          <span class={cn("mc-usage-meter__key", "key")} aria-hidden="true">
            {#if item.id === "free" && status === "over"}
              <span class={cn("mc-usage-meter__keyIcon", "keyIcon")} in:popIn out:popOut><TriangleAlert size={12} strokeWidth={2} /></span>
            {:else}
              <span class={cn("mc-usage-meter__swatch", "swatch")} data-index={item.id === "free" ? "free" : index} in:popIn out:popOut></span>
            {/if}
          </span>
          <span class={cn("mc-usage-meter__itemLabel", "itemLabel")}><UsageMeterSwap text={item.label} {classNames} /></span>
        </span>
        <span class={cn("mc-usage-meter__itemValue", "itemValue")}><UsageMeterTicker value={item.value} {decimals} {classNames} />{#if unit}<span class={cn("mc-usage-meter__itemUnit", "itemUnit")}>{unit}</span>{/if}</span>
      </button>
    {/each}
  </div>
  <p class="mc-usage-meter__srOnly" aria-live="polite" aria-atomic="true">{announced}</p>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Categories are steps of the accent, strongest first, so the meter reads as one allowance rather than a rainbow. Free space is the track itself. */
.mc-usage-meter__meter { --segment-0: var(--accent); --segment-1: color-mix(in oklab, var(--accent) 62%, var(--surface)); --segment-2: color-mix(in oklab, var(--accent) 36%, var(--surface)); --segment-3: color-mix(in oklab, var(--accent) 22%, var(--surface)); display: grid; min-width: 0; gap: var(--space-4); color: var(--foreground); }
.mc-usage-meter__top { display: flex; min-width: 0; min-height: 28px; align-items: center; justify-content: space-between; gap: var(--space-3); }
/* A long label wraps beside the status mark instead of hiding its end. */
.mc-usage-meter__title { min-width: 0; color: var(--foreground); font-size: var(--text-base); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); text-wrap: balance; }

/* The status mark hugs its words: its width springs to each message and grows from the right edge, so the text never slides. */
.mc-usage-meter__badge { display: inline-flex; flex: none; height: 28px; justify-content: flex-end; overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 500; line-height: 1; transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard); }
.mc-usage-meter__badgeInner { display: inline-flex; flex: none; align-items: center; gap: 6px; padding: 0 var(--space-3); white-space: nowrap; }
.mc-usage-meter__badgeIcon { display: grid; place-items: center; }
.mc-usage-meter__badge[data-status="near"] { background: color-mix(in oklab, var(--warning) 14%, var(--surface)); color: var(--foreground); }
.mc-usage-meter__badge[data-status="near"] .mc-usage-meter__badgeIcon { color: var(--warning); }
.mc-usage-meter__badge[data-status="over"] { background: color-mix(in oklab, var(--danger) 12%, var(--surface)); color: var(--foreground); }
.mc-usage-meter__badge[data-status="over"] .mc-usage-meter__badgeIcon { color: var(--danger); }

.mc-usage-meter__total { display: flex; min-width: 0; align-items: baseline; gap: var(--space-2); margin: 0; }
.mc-usage-meter__amount { flex: none; font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 500; letter-spacing: var(--tracking-display); line-height: var(--leading-display); }
.mc-usage-meter__caption { min-width: 0; flex: 1; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-usage-meter__swap { position: relative; display: block; min-width: 0; }
.mc-usage-meter__swapText { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* The bar leaves room above and below the track for the limit marker. */
.mc-usage-meter__bar { position: relative; padding-block: 5px; }
.mc-usage-meter__track { position: relative; height: 14px; overflow: hidden; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--foreground) 7%, var(--surface)); isolation: isolate; -webkit-tap-highlight-color: transparent; }
.mc-usage-meter__segment { position: absolute; inset: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-usage-meter__segment[data-index="0"], .mc-usage-meter__swatch[data-index="0"] { background: var(--segment-0); }
.mc-usage-meter__segment[data-index="1"], .mc-usage-meter__swatch[data-index="1"] { background: var(--segment-1); }
.mc-usage-meter__segment[data-index="2"], .mc-usage-meter__swatch[data-index="2"] { background: var(--segment-2); }
.mc-usage-meter__segment[data-index="3"], .mc-usage-meter__swatch[data-index="3"] { background: var(--segment-3); }
.mc-usage-meter__segment[data-highlight="off"] { opacity: .28; }
/* Past the limit the used colours stay, struck through by a hatch; highlighting the overage floods it with the danger colour. */
.mc-usage-meter__overflow { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.mc-usage-meter__hatch { fill: var(--surface); }
.mc-usage-meter__overTint { fill: var(--danger); opacity: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-usage-meter__overflow[data-highlight="on"] .mc-usage-meter__overTint { opacity: 1; }
.mc-usage-meter__limit { position: absolute; top: 0; bottom: 0; left: -1px; width: 2px; border-radius: 1px; background: var(--foreground); pointer-events: none; }

/* The legend doubles as the keyboard path: arrow keys move between categories, focus previews one, a press pins it. */
.mc-usage-meter__legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(108px, 1fr)); gap: 2px; margin: 0 calc(var(--space-2) * -1); }
.mc-usage-meter__item { display: grid; min-width: 0; justify-items: start; gap: 2px; padding: var(--space-2); border: 0; border-radius: calc(var(--radius-control) - 6px); background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-usage-meter__item:hover { background: var(--surface-muted); } }
.mc-usage-meter__item[aria-pressed="true"] { background: var(--surface-muted); }
.mc-usage-meter__item[data-highlight="off"] { opacity: .45; }
.mc-usage-meter__itemHead { display: flex; min-width: 0; max-width: 100%; align-items: center; gap: var(--space-2); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-usage-meter__itemLabel { min-width: 0; flex: 1; }
.mc-usage-meter__key { display: grid; width: 12px; height: 12px; flex: none; place-items: center; }
.mc-usage-meter__swatch { grid-area: 1 / 1; width: 10px; height: 10px; border-radius: 3px; }
.mc-usage-meter__swatch[data-index="free"] { background: color-mix(in oklab, var(--foreground) 7%, var(--surface)); box-shadow: inset 0 0 0 1px var(--border-strong); }
.mc-usage-meter__keyIcon { grid-area: 1 / 1; display: grid; place-items: center; color: var(--danger); }
.mc-usage-meter__itemValue { display: flex; align-items: baseline; gap: 4px; padding-left: 20px; color: var(--foreground); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); }
.mc-usage-meter__itemUnit { color: var(--text-secondary); font-size: var(--text-sm); font-weight: 400; }

/* A rolling number: each digit is a clipped wheel that feathers at its edges, and new columns open from zero width. */
.mc-usage-meter__ticker { position: relative; display: inline-flex; align-items: flex-start; white-space: nowrap; font-variant-numeric: tabular-nums; user-select: none; }
.mc-usage-meter__column { --feather: .16em; position: relative; display: inline-block; overflow: hidden; margin-block: calc(var(--feather) * -1); padding-block: var(--feather); mask-image: linear-gradient(to bottom, transparent, #000 calc(var(--feather) * 1.5), #000 calc(100% - var(--feather) * 1.5), transparent); }
.mc-usage-meter__sizer { visibility: hidden; }
.mc-usage-meter__glyph { position: absolute; inset: var(--feather) 0; text-align: center; }
.mc-usage-meter__symbol { display: inline-block; overflow-x: clip; }

.mc-usage-meter__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-usage-meter__badge, .mc-usage-meter__segment, .mc-usage-meter__item, .mc-usage-meter__overTint { transition: none; } }
}
</style>
