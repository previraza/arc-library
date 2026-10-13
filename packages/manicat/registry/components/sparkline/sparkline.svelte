<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import SparklineRoll from "@/registry/components/sparkline/sparkline-roll.svelte";
  import { createSparkline, grouped } from "@/lib/sparkline";

  interface Props {
    data: number[];
    label: string;
    value?: string;
    change?: string;
    tone?: "accent" | "success" | "warning" | "danger";
    width?: number;
    height?: number;
    /** One label per point, such as a date. It replaces the change while that point is scrubbed. */
    labels?: string[];
    /** Formats a scrubbed point for the headline. Defaults to a grouped number. */
    formatValue?: (value: number, index: number) => string;
    /** A quiet neutral fill under the line. */
    area?: boolean;
    /** Pointer and keyboard scrubbing through the points. */
    interactive?: boolean;
    class?: string;
    /** Extend the inner, named parts of the sparkline: figure, caption, label, plot, chart, baseline, trail, cursor, end. */
    classNames?: { figure?: string; caption?: string; label?: string; plot?: string; chart?: string; baseline?: string; trail?: string; cursor?: string; end?: string };
  }

  let { data, label, value, change, tone = "accent", width = 160, height = 52, labels, formatValue, area = true, interactive = true, class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const generated = $props.id();
  const uid = `sparkline${generated.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  let figure: HTMLElement;
  let plot: HTMLElement;
  let svg: SVGSVGElement;
  let lit: SVGRectElement;
  let dim: SVGRectElement;
  let reveal: SVGRectElement;
  let areaPath = $state<SVGPathElement>();
  let baseline: SVGLineElement;
  let trail: SVGPathElement;
  let line: SVGPolylineElement;
  let cursorLine: SVGLineElement;
  let end: SVGPolylineElement;
  let chart: ReturnType<typeof createSparkline> | undefined;
  let active = $state<number | null>(null);

  const safeData = $derived(data.length > 1 ? data : [data[0] ?? 0, data[0] ?? 0]);
  const last = $derived(safeData.length - 1);
  const description = $derived(`${label}: ${value ?? safeData[last]}. ${change ?? ""}`.trim());
  const index = $derived(active === null ? null : Math.min(active, last));
  let direction = 1;
  let previousIndex: number | null = null;
  $effect.pre(() => {
    const next = index;
    direction = next === null || previousIndex === null ? 1 : Math.sign(next - previousIndex) || 1;
    previousIndex = next;
  });
  const scrubbing = $derived(index !== null);
  const format = (at: number) => (formatValue ? formatValue(safeData[at], at) : grouped.format(safeData[at]));
  const point = $derived(format(index ?? last));
  const when = $derived(labels?.[index ?? last]);
  const headline = $derived(value === undefined ? undefined : scrubbing ? point : value);
  const aside = $derived(index === null ? (change ?? "") : value === undefined ? [point, when].filter(Boolean).join(" · ") : (when ?? `${index + 1} of ${last + 1}`));
  const directionNow = $derived(scrubbing ? direction : undefined);

  onMount(() => {
    chart = createSparkline({ figure, plot, svg, lit, dim, reveal, area: areaPath, baseline, trail, line, cursor: cursorLine, end }, { data: safeData, width, height, reduced });
    return () => chart?.destroy();
  });
  let seenData = safeData.join(",");
  $effect(() => {
    const key = safeData.join(",");
    if (key === seenData) return;
    seenData = key;
    chart?.setData(safeData);
  });
  let firstIndex = true;
  $effect(() => {
    const next = index;
    if (firstIndex) {
      firstIndex = false;
      return;
    }
    chart?.setIndex(next, last);
  });

  const pointAt = (clientX: number) => {
    const rect = plot?.getBoundingClientRect();
    return rect?.width ? Math.max(0, Math.min(last, Math.round(((clientX - rect.left) / rect.width) * last))) : last;
  };
  function onkeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && scrubbing) {
      event.preventDefault();
      active = null;
      return;
    }
    const from = index ?? last;
    const page = Math.max(1, Math.round((last + 1) / 6));
    const next = ({ ArrowLeft: from - 1, ArrowDown: from - 1, ArrowRight: from + 1, ArrowUp: from + 1, PageDown: from - page, PageUp: from + page, Home: 0, End: last } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    active = Math.max(0, Math.min(last, next));
  }
</script>

<figure bind:this={figure} class={["mc-sparkline__figure", className]} aria-label={description}>
  <figcaption class={["mc-sparkline__caption", classNames?.caption]}>
    <span class={["mc-sparkline__label", classNames?.label]}><SparklineRoll text={label} whole /></span>
    {#if headline !== undefined}<strong><SparklineRoll text={headline} morph /></strong>{/if}
    <small class={`mc-sparkline__${tone}`}><SparklineRoll text={aside} direction={directionNow} tone={scrubbing ? "mc-sparkline__point" : undefined} morph /></small>
  </figcaption>
  {#if interactive}
    <div bind:this={plot} class={["mc-sparkline__plot", classNames?.plot]} data-interactive role="slider" tabindex="0" aria-label={`${label}, explore values`} aria-valuemin={1} aria-valuemax={last + 1} aria-valuenow={(index ?? last) + 1} aria-valuetext={`${when ?? (index === null ? "Latest" : `Point ${index + 1} of ${last + 1}`)}: ${point}`}
      onpointerdown={(event) => (active = pointAt(event.clientX))} onpointermove={(event) => { if (event.pointerType === "mouse" || event.buttons) active = pointAt(event.clientX); }} onpointerup={(event) => { if (event.pointerType !== "mouse") active = null; }} onpointerleave={() => (active = null)} onpointercancel={() => (active = null)} onblur={() => (active = null)} {onkeydown}>
      {@render chartSvg()}
    </div>
  {:else}
    <div bind:this={plot} class={["mc-sparkline__plot", classNames?.plot]}>
      {@render chartSvg()}
    </div>
  {/if}
</figure>

{#snippet chartSvg()}
  <svg bind:this={svg} class={["mc-sparkline__chart", classNames?.chart]} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={`${uid}-lit`} clipPathUnits="userSpaceOnUse"><rect bind:this={lit} x="-16" y="-16" {width} height={height + 32} /></clipPath>
      <clipPath id={`${uid}-dim`} clipPathUnits="userSpaceOnUse"><rect bind:this={dim} x={width} y="-16" width={width + 32} height={height + 32} /></clipPath>
      <clipPath id={`${uid}-fill`} clipPathUnits="userSpaceOnUse"><rect bind:this={reveal} x="-16" y="-16" width="0" height={height + 32} /></clipPath>
    </defs>
    {#if area}<path bind:this={areaPath} class={`mc-sparkline__area mc-sparkline__${tone}`} clip-path={`url(#${uid}-fill)`} />{/if}
    <line bind:this={baseline} class={["mc-sparkline__baseline", classNames?.baseline]} x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} />
    <!-- While scrubbing, the stretch after the cursor dims, as if the later points have not happened yet. -->
    <path bind:this={trail} class={["mc-sparkline__trail", classNames?.trail]} clip-path={`url(#${uid}-dim)`} />
    <polyline bind:this={line} class={["mc-sparkline__line", `mc-sparkline__${tone}`]} clip-path={`url(#${uid}-lit)`} />
    <line bind:this={cursorLine} class={["mc-sparkline__cursor", classNames?.cursor]} y1="0" y2={height} />
    <!-- A zero-length round-capped stroke is a true circle, and it takes the line's colour. It rests on the latest point and becomes the scrub handle. -->
    <polyline bind:this={end} class={["mc-sparkline__end", classNames?.end]} fill="none" stroke-linecap="round" />
  </svg>
{/snippet}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-sparkline__figure { display: grid; min-width: 0; gap: var(--space-3); margin: 0; color: var(--foreground); }.mc-sparkline__caption { display: flex; align-items: baseline; gap: var(--space-2); min-width: 0; color: var(--text-secondary); font-size: var(--text-sm); }.mc-sparkline__label { min-width: 0; overflow: hidden; white-space: nowrap; }.mc-sparkline__caption strong { margin-left: auto; color: var(--foreground); font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); font-variant-numeric: tabular-nums; }.mc-sparkline__caption small { flex: none; font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; transition: color var(--duration-standard) var(--ease-standard); }
.mc-sparkline__accent { color: var(--accent-strong); stroke: var(--accent); }.mc-sparkline__success { color: var(--success); stroke: var(--success); }.mc-sparkline__warning { color: var(--warning); stroke: var(--warning); }.mc-sparkline__danger { color: var(--danger); stroke: var(--danger); }
/* The scrubbed date is context, not a change, so it stays neutral whatever the tone. */
.mc-sparkline__point { color: var(--text-secondary); }

/* Changing text rolls in place. Outgoing pieces are popped out of flow, so the wrapper never holds both widths; numbers stay anchored to their right edge. */
.mc-sparkline__roll { position: relative; display: inline-flex; max-width: 100%; overflow-x: clip; white-space: pre; vertical-align: top; }
.mc-sparkline__roll[data-end] { justify-content: flex-end; }
.mc-sparkline__track, .mc-sparkline__slot, .mc-sparkline__glyph { position: relative; display: inline-block; white-space: pre; }
.mc-sparkline__roll[data-whole] .mc-sparkline__track, .mc-sparkline__roll[data-whole] .mc-sparkline__slot, .mc-sparkline__roll[data-whole] .mc-sparkline__glyph { max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: top; }
.mc-sparkline__sizer { position: absolute; top: 0; left: 0; visibility: hidden; white-space: pre; pointer-events: none; }

/* The plot is the scrubber: hover or drag across it, or focus it and use the arrow keys. Vertical swipes still scroll the page. */
.mc-sparkline__plot { position: relative; min-width: 0; border-radius: calc(var(--radius-control) / 2); outline: none; -webkit-tap-highlight-color: transparent; }
.mc-sparkline__plot[data-interactive] { touch-action: pan-y; cursor: default; user-select: none; }
.mc-sparkline__plot:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 8px; }
.mc-sparkline__chart { display: block; width: 100%; height: auto; overflow: visible; }
.mc-sparkline__baseline { stroke: var(--border); stroke-width: 1; }
/* The area under the line carries a faint wash of the line tone. */
.mc-sparkline__area.mc-sparkline__area { fill: color-mix(in oklab, currentColor 9%, transparent); stroke: none; }
.mc-sparkline__line, .mc-sparkline__trail { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.mc-sparkline__line { transition: stroke var(--duration-standard) var(--ease-standard); }
.mc-sparkline__trail { stroke: var(--border-strong); }
.mc-sparkline__cursor { stroke: var(--border-strong); stroke-width: 1; }
.mc-sparkline__end { transition: stroke var(--duration-standard) var(--ease-standard); }
@media (prefers-reduced-motion: reduce) { .mc-sparkline__line, .mc-sparkline__end, .mc-sparkline__caption small { transition: none; } }
}
</style>
