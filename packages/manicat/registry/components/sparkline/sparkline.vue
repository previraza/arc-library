<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import SparklineRoll from "@/registry/components/sparkline/sparkline-roll.vue";
import { createSparkline, grouped } from "@/lib/sparkline";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
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
    /** Extend the inner, named parts of the sparkline: figure, caption, label, plot, chart, baseline, trail, cursor, end. */
    classNames?: { figure?: string; caption?: string; label?: string; plot?: string; chart?: string; baseline?: string; trail?: string; cursor?: string; end?: string };
  }>(),
  { tone: "accent", width: 160, height: 52, area: true, interactive: true },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const uid = `sparkline${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const figure = ref<HTMLElement>();
const plot = ref<HTMLElement>();
const svg = ref<SVGSVGElement>();
const lit = ref<SVGRectElement>();
const dim = ref<SVGRectElement>();
const reveal = ref<SVGRectElement>();
const area = ref<SVGPathElement>();
const baseline = ref<SVGLineElement>();
const trail = ref<SVGPathElement>();
const line = ref<SVGPolylineElement>();
const cursorLine = ref<SVGLineElement>();
const end = ref<SVGPolylineElement>();
let chart: ReturnType<typeof createSparkline> | undefined;
const active = ref<number | null>(null);

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const safeData = computed(() => (props.data.length > 1 ? props.data : [props.data[0] ?? 0, props.data[0] ?? 0]));
const last = computed(() => safeData.value.length - 1);
const description = computed(() => `${props.label}: ${props.value ?? safeData.value[last.value]}. ${props.change ?? ""}`.trim());
const index = computed(() => (active.value === null ? null : Math.min(active.value, last.value)));
const direction = ref(1);
watch(index, (next, previous) => (direction.value = next === null || previous === null ? 1 : Math.sign(next - previous) || 1), { flush: "sync" });
const scrubbing = computed(() => index.value !== null);
const format = (at: number) => (props.formatValue ? props.formatValue(safeData.value[at], at) : grouped.format(safeData.value[at]));
const point = computed(() => format(index.value ?? last.value));
const when = computed(() => props.labels?.[index.value ?? last.value]);
const headline = computed(() => (props.value === undefined ? undefined : scrubbing.value ? point.value : props.value));
const aside = computed(() => (index.value === null ? (props.change ?? "") : props.value === undefined ? [point.value, when.value].filter(Boolean).join(" · ") : (when.value ?? `${index.value + 1} of ${last.value + 1}`)));

onMounted(() => {
  chart = createSparkline({ figure: figure.value!, plot: plot.value!, svg: svg.value!, lit: lit.value!, dim: dim.value!, reveal: reveal.value!, area: area.value, baseline: baseline.value!, trail: trail.value!, line: line.value!, cursor: cursorLine.value!, end: end.value! }, { data: safeData.value, width: props.width, height: props.height, reduced });
});
onBeforeUnmount(() => chart?.destroy());
watch(() => safeData.value.join(","), () => chart?.setData(safeData.value));
watch(index, (next) => chart?.setIndex(next, last.value));

const pointAt = (clientX: number) => {
  const rect = plot.value?.getBoundingClientRect();
  return rect?.width ? Math.max(0, Math.min(last.value, Math.round(((clientX - rect.left) / rect.width) * last.value))) : last.value;
};
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && scrubbing.value) {
    event.preventDefault();
    active.value = null;
    return;
  }
  const from = index.value ?? last.value;
  const page = Math.max(1, Math.round((last.value + 1) / 6));
  const next = ({ ArrowLeft: from - 1, ArrowDown: from - 1, ArrowRight: from + 1, ArrowUp: from + 1, PageDown: from - page, PageUp: from + page, Home: 0, End: last.value } as Record<string, number>)[event.key];
  if (next === undefined) return;
  event.preventDefault();
  active.value = Math.max(0, Math.min(last.value, next));
}
const scrub = computed(() =>
  props.interactive
    ? {
        role: "slider",
        tabindex: 0,
        "aria-label": `${props.label}, explore values`,
        "aria-valuemin": 1,
        "aria-valuemax": last.value + 1,
        "aria-valuenow": (index.value ?? last.value) + 1,
        "aria-valuetext": `${when.value ?? (index.value === null ? "Latest" : `Point ${index.value + 1} of ${last.value + 1}`)}: ${point.value}`,
        onPointerdown: (event: PointerEvent) => (active.value = pointAt(event.clientX)),
        onPointermove: (event: PointerEvent) => { if (event.pointerType === "mouse" || event.buttons) active.value = pointAt(event.clientX); },
        onPointerup: (event: PointerEvent) => { if (event.pointerType !== "mouse") active.value = null; },
        onPointerleave: () => (active.value = null),
        onPointercancel: () => (active.value = null),
        onBlur: () => (active.value = null),
        onKeydown,
      }
    : {},
);
</script>

<template>
  <figure ref="figure" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-sparkline__figure', $attrs.class as string | undefined)" :aria-label="description">
    <figcaption :class="cn('mc-sparkline__caption', classNames?.caption)">
      <span :class="cn('mc-sparkline__label', classNames?.label)"><SparklineRoll :text="label" whole /></span>
      <strong v-if="headline !== undefined"><SparklineRoll :text="headline" morph /></strong>
      <small :class="`mc-sparkline__${tone}`"><SparklineRoll :text="aside" :direction="scrubbing ? direction : undefined" :tone="scrubbing ? 'mc-sparkline__point' : undefined" morph /></small>
    </figcaption>
    <div ref="plot" :class="cn('mc-sparkline__plot', classNames?.plot)" :data-interactive="interactive || undefined" v-bind="scrub">
      <svg ref="svg" :class="cn('mc-sparkline__chart', classNames?.chart)" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true" focusable="false">
        <defs>
          <clipPath :id="`${uid}-lit`" clipPathUnits="userSpaceOnUse"><rect ref="lit" x="-16" y="-16" :width="width" :height="height + 32" /></clipPath>
          <clipPath :id="`${uid}-dim`" clipPathUnits="userSpaceOnUse"><rect ref="dim" :x="width" y="-16" :width="width + 32" :height="height + 32" /></clipPath>
          <clipPath :id="`${uid}-fill`" clipPathUnits="userSpaceOnUse"><rect ref="reveal" x="-16" y="-16" width="0" :height="height + 32" /></clipPath>
        </defs>
        <path v-if="area" ref="area" :class="`mc-sparkline__area mc-sparkline__${tone}`" :clip-path="`url(#${uid}-fill)`" />
        <line ref="baseline" :class="cn('mc-sparkline__baseline', classNames?.baseline)" x1="0" :y1="height - 0.5" :x2="width" :y2="height - 0.5" />
        <!-- While scrubbing, the stretch after the cursor dims, as if the later points have not happened yet. -->
        <path ref="trail" :class="cn('mc-sparkline__trail', classNames?.trail)" :clip-path="`url(#${uid}-dim)`" />
        <polyline ref="line" :class="['mc-sparkline__line', `mc-sparkline__${tone}`]" :clip-path="`url(#${uid}-lit)`" />
        <line ref="cursorLine" :class="cn('mc-sparkline__cursor', classNames?.cursor)" y1="0" :y2="height" />
        <!-- A zero-length round-capped stroke is a true circle, and it takes the line's colour. It rests on the latest point and becomes the scrub handle. -->
        <polyline ref="end" :class="cn('mc-sparkline__end', classNames?.end)" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  </figure>
</template>

<style>
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
</style>
