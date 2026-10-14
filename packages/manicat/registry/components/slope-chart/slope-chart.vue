<script setup lang="ts">
// @manicat-dependencies motion
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, watch } from "vue";
import SlopeChartRank from "@/registry/components/slope-chart/slope-chart-rank.vue";
import { HEAD, clamp, createSlopeMotion, createTooltipFollow, grouped, layoutSlope } from "@/lib/slope-chart";
import type { SlopeItem, SlopeRow } from "@/lib/slope-chart";

export type { SlopeItem };

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    data: SlopeItem[];
    /** What is measured, such as "Conversion rate by channel". Names the chart for assistive technology. */
    label: string;
    /** Heading of the first column, such as "Q1". */
    startLabel: string;
    /** Heading of the second column, such as "Q2". */
    endLabel: string;
    formatValue?: (value: number) => string;
    /** Formats the change in the tooltip. Defaults to the difference in formatValue's terms. */
    formatChange?: (change: number, item: SlopeItem) => string;
    /** Plot height in pixels. Defaults to 44 pixels per item. */
    height?: number;
    /** The item drawn in the accent, such as the one the story is about. */
    highlightKey?: string | null;
    /** Rank movement beside each end value. */
    ranks?: boolean;
    emptyLabel?: string;
    /** Extend the inner, named parts of the slope chart: stage, columns, column, plot, svg, axis, item, leader, line, dot, labels, start, name, value, end, tooltip, tipTitle, tipRow, tipName, tipValue, tipMeta, message, rank or rankSwap. */
    classNames?: Record<string, string | undefined>;
  }>(),
  { highlightKey: null, ranks: true, emptyLabel: "No data" },
);

/** `v-model:active-key` binds the item in focus. The others fade while one is in focus. */
const activeModel = defineModel<string | null>("activeKey", { default: undefined });
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const figure = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const tip = ref<HTMLElement>();
const width = ref(0);
const seen = ref(reduced);
const ownActive = ref<string | null>(null);
const shownKey = ref<string | null>(null);
let motion: ReturnType<typeof createSlopeMotion> | undefined;
let follow: ReturnType<typeof createTooltipFollow> | undefined;
let resize: ResizeObserver | undefined;
let observer: IntersectionObserver | undefined;

const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const empty = computed(() => props.data.length === 0);
const plotHeight = computed(() => props.height ?? Math.max(200, props.data.length * 44));
const narrow = computed(() => width.value < 440);
const leftRoom = computed(() => (narrow.value ? (width.value < 300 ? 116 : 132) : 168));
const rightRoom = computed(() => (props.ranks ? (narrow.value ? 76 : 96) : narrow.value ? 52 : 64));
const x0 = computed(() => leftRoom.value);
const x1 = computed(() => Math.max(x0.value + 40, width.value - rightRoom.value));
const layout = computed(() => layoutSlope(props.data, plotHeight.value));
const rows = computed(() => layout.value.rows);
const byEnd = computed(() => layout.value.byEnd);
const wanted = computed(() => (activeModel.value !== undefined ? activeModel.value : ownActive.value));
const active = computed(() => (wanted.value && props.data.some((item) => item.key === wanted.value) ? wanted.value : null));
const activeRow = computed(() => rows.value.find((row) => row.item.key === active.value) ?? null);
// The tooltip keeps the last item's content while it fades out, so it never collapses to an empty box mid-fade.
watch(active, (key) => { if (key) shownKey.value = key; }, { immediate: true, flush: "sync" });
const tipRow = computed(() => activeRow.value ?? rows.value.find((row) => row.item.key === shownKey.value) ?? null);

function setActive(key: string | null) {
  ownActive.value = key;
  if (key !== active.value) activeModel.value = key;
}

const format = (value: number) => (props.formatValue ? props.formatValue(value) : grouped.format(value));
const change = (item: SlopeItem) => (props.formatChange ? props.formatChange(item.end - item.start, item) : `${item.end >= item.start ? "+" : "−"}${format(Math.abs(item.end - item.start))}`);
const rankText = (row: SlopeRow) => (row.rank0 === row.rank1 ? "same rank" : row.rank1 < row.rank0 ? `up ${row.rank0 - row.rank1} to rank ${row.rank1}` : `down ${row.rank1 - row.rank0} to rank ${row.rank1}`);
const announce = computed(() => (activeRow.value ? `${activeRow.value.item.label}, ${props.startLabel} ${format(activeRow.value.item.start)}, ${props.endLabel} ${format(activeRow.value.item.end)}, ${change(activeRow.value.item)}, ${rankText(activeRow.value)}` : ""));
const summary = computed(() => (empty.value ? `${props.label}. ${props.emptyLabel}.` : `${props.label}, ${props.startLabel} to ${props.endLabel}. ${byEnd.value.map((row) => `${row.item.label} ${format(row.item.start)} to ${format(row.item.end)}`).join(", ")}.`));

// The line nearest the pointer, measured at the pointer's position along the plot.
function nearest(clientX: number, clientY: number) {
  const rect = stage.value?.getBoundingClientRect();
  if (!rect || empty.value) return null;
  const x = clamp(clientX - rect.left, x0.value, x1.value);
  const y = clientY - rect.top - HEAD;
  const t = (x - x0.value) / Math.max(1, x1.value - x0.value);
  let best: SlopeRow | null = null;
  let distance = Infinity;
  for (const row of rows.value) {
    const inLine = Math.abs(row.y0 + (row.y1 - row.y0) * t - y);
    const onLabel = clientX - rect.left < x0.value ? Math.abs(row.l0 - y) : clientX - rect.left > x1.value ? Math.abs(row.l1 - y) : Infinity;
    const d = Math.min(inLine, onLabel);
    if (d < distance) {
      distance = d;
      best = row;
    }
  }
  return distance <= 22 ? (best?.item.key ?? null) : null;
}
function onKeydown(event: KeyboardEvent) {
  if (empty.value) return;
  if (event.key === "Escape" && active.value) {
    event.preventDefault();
    setActive(null);
    return;
  }
  const at = activeRow.value ? activeRow.value.order : -1;
  const moves: Record<string, number> = { ArrowDown: at + 1, ArrowRight: at + 1, ArrowUp: at < 0 ? 0 : at - 1, ArrowLeft: at < 0 ? 0 : at - 1, Home: 0, End: byEnd.value.length - 1 };
  if (!(event.key in moves)) return;
  event.preventDefault();
  setActive(byEnd.value[clamp(moves[event.key], 0, byEnd.value.length - 1)].item.key);
}

onMounted(() => {
  const node = stage.value!;
  const read = () => (width.value = node.clientWidth);
  read();
  resize = new ResizeObserver(read);
  resize.observe(node);
  motion = createSlopeMotion(node, { reduced });
  follow = createTooltipFollow(tip.value!, reduced);
  if (!reduced) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer?.disconnect();
      seen.value = true;
    }, { threshold: 0.3 });
    observer.observe(figure.value!);
  }
});
onBeforeUnmount(() => {
  resize?.disconnect();
  observer?.disconnect();
});

// Lines, dots and labels move to their new places on a spring; the tooltip rides the middle of the line in focus.
function sync() {
  motion?.update(rows.value, { x0: x0.value, x1: x1.value, visible: seen.value && width.value > 0 });
  const bubble = tip.value;
  const row = activeRow.value;
  if (!row || !bubble || !width.value) return follow?.hide();
  const tw = bubble.offsetWidth;
  const th = bubble.offsetHeight;
  const mid = (row.y0 + row.y1) / 2;
  const cx = (x0.value + x1.value) / 2;
  const above = mid - th - 16 >= 0;
  const left = clamp(cx - tw / 2, 0, Math.max(0, width.value - tw));
  const top = clamp(HEAD + (above ? mid - th - 16 : mid + 16), 0, Math.max(0, plotHeight.value + HEAD - th));
  follow?.to(left, top);
}
onUpdated(sync);
watch([seen, width], async () => { await nextTick(); sync(); }, { flush: "post" });
</script>

<template>
  <figure ref="figure" v-bind="{ ...attrs, class: undefined }" :class="['mc-slope-chart__figure', attrs.class as string | undefined]" :aria-label="label">
    <div ref="stage" :class="cn('mc-slope-chart__stage', 'stage')" :data-narrow="narrow || undefined" :data-active="active ? true : undefined" role="group" :tabindex="empty ? -1 : 0" aria-roledescription="slope chart" :aria-label="`${label}. Use up and down arrows to move between items in ${endLabel} order.`" @pointermove="(event) => { if (event.pointerType === 'mouse' || event.buttons) setActive(nearest(event.clientX, event.clientY)); }" @pointerdown="(event) => { if (event.pointerType !== 'mouse') { (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId); setActive(nearest(event.clientX, event.clientY)); } }" @pointerup="(event) => { if (event.pointerType !== 'mouse') setActive(null); }" @pointercancel="setActive(null)" @pointerleave="(event) => { if (event.pointerType === 'mouse') setActive(null); }" @keydown="onKeydown" @blur="setActive(null)" @focus="(event) => { if ((event.currentTarget as HTMLElement).matches(':focus-visible') && !empty && !active) setActive(byEnd[0].item.key); }">
      <template v-if="width > 0">
        <div :class="cn('mc-slope-chart__columns', 'columns')" aria-hidden="true">
          <span :class="cn('mc-slope-chart__column', 'column')" :style="{ left: `${x0}px`, translate: '-50% 0' }">{{ startLabel }}</span>
          <span :class="cn('mc-slope-chart__column', 'column')" :style="{ left: `${x1}px`, translate: '-50% 0' }">{{ endLabel }}</span>
        </div>
        <div :class="cn('mc-slope-chart__plot', 'plot')" :style="{ height: `${plotHeight}px` }">
          <svg :class="cn('mc-slope-chart__svg', 'svg')" :width="width" :height="plotHeight" aria-hidden="true" focusable="false">
            <line :class="cn('mc-slope-chart__axis', 'axis')" :x1="x0" :x2="x0" :y1="0" :y2="plotHeight" />
            <line :class="cn('mc-slope-chart__axis', 'axis')" :x1="x1" :x2="x1" :y1="0" :y2="plotHeight" />
            <g v-for="row in rows" :key="row.item.key" :class="cn('mc-slope-chart__item', 'item')" :data-on="active === row.item.key || undefined" :data-accent="highlightKey === row.item.key || undefined" :data-dim="(active !== null && active !== row.item.key) || undefined">
              <path :class="cn('mc-slope-chart__leader', 'leader')" data-leader="0" :data-key="row.item.key" :d="`M${x0 - 6},${row.l0}L${x0 - 1},${row.y0}`" />
              <path :class="cn('mc-slope-chart__leader', 'leader')" data-leader="1" :data-key="row.item.key" :d="`M${x1 + 6},${row.l1}L${x1 + 1},${row.y1}`" />
              <line :class="cn('mc-slope-chart__line', 'line')" data-line :data-key="row.item.key" :x1="x0" :x2="x1" :y1="row.y0" :y2="row.y1" />
              <circle :class="cn('mc-slope-chart__dot', 'dot')" data-dot="0" :data-key="row.item.key" :cx="x0" :cy="row.y0" r="4" />
              <circle :class="cn('mc-slope-chart__dot', 'dot')" data-dot="1" :data-key="row.item.key" :cx="x1" :cy="row.y1" r="4" />
            </g>
          </svg>
          <div v-for="row in rows" :key="row.item.key" :class="cn('mc-slope-chart__labels', 'labels')" :data-on="active === row.item.key || undefined" :data-accent="highlightKey === row.item.key || undefined" :data-dim="(active !== null && active !== row.item.key) || undefined" aria-hidden="true">
            <span :class="cn('mc-slope-chart__start', 'start')" data-label="0" :data-key="row.item.key" :style="{ right: `${width - x0 + 10}px`, maxWidth: `${x0 - 10}px`, transform: `translateY(${row.l0}px)` }">
              <span :class="cn('mc-slope-chart__name', 'name')">{{ row.item.label }}</span>
              <span :class="cn('mc-slope-chart__value', 'value')">{{ format(row.item.start) }}</span>
            </span>
            <span :class="cn('mc-slope-chart__end', 'end')" data-label="1" :data-key="row.item.key" :style="{ left: `${x1 + 10}px`, transform: `translateY(${row.l1}px)` }">
              <span :class="cn('mc-slope-chart__value', 'value')">{{ format(row.item.end) }}</span>
              <SlopeChartRank v-if="ranks" :move="row.rank0 - row.rank1" :class-names="classNames" />
            </span>
          </div>
        </div>
      </template>
      <div ref="tip" :class="cn('mc-slope-chart__tooltip', 'tooltip')" aria-hidden="true">
        <p :class="cn('mc-slope-chart__tipTitle', 'tipTitle')">{{ tipRow?.item.label ?? "" }}</p>
        <p :class="cn('mc-slope-chart__tipRow', 'tipRow')"><span :class="cn('mc-slope-chart__tipName', 'tipName')">{{ startLabel }}</span><span :class="cn('mc-slope-chart__tipValue', 'tipValue')">{{ tipRow ? format(tipRow.item.start) : "" }}</span></p>
        <p :class="cn('mc-slope-chart__tipRow', 'tipRow')"><span :class="cn('mc-slope-chart__tipName', 'tipName')">{{ endLabel }}</span><span :class="cn('mc-slope-chart__tipValue', 'tipValue')">{{ tipRow ? format(tipRow.item.end) : "" }}</span></p>
        <p :class="cn('mc-slope-chart__tipMeta', 'tipMeta')">{{ tipRow ? `${change(tipRow.item)}, ${rankText(tipRow)}` : "" }}</p>
      </div>
      <p v-if="empty" :class="cn('mc-slope-chart__message', 'message')">{{ emptyLabel }}</p>
    </div>
    <p class="mc-slope-chart__srOnly" aria-live="polite" aria-atomic="true">{{ announce }}</p>
    <p class="mc-slope-chart__srOnly">{{ summary }}</p>
    <div v-if="!empty" class="mc-slope-chart__srOnly"><table>
      <caption>{{ label }}</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">{{ startLabel }}</th><th scope="col">{{ endLabel }}</th><th scope="col">Change</th><th scope="col">Rank</th></tr></thead>
      <tbody><tr v-for="row in byEnd" :key="row.item.key"><th scope="row">{{ row.item.label }}</th><td>{{ format(row.item.start) }}</td><td>{{ format(row.item.end) }}</td><td>{{ change(row.item) }}</td><td>{{ row.rank0 }} to {{ row.rank1 }}</td></tr></tbody>
    </table></div>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slope-chart__figure { position: relative; display: grid; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-slope-chart__css. */

.mc-slope-chart__stage { position: relative; min-width: 0; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-slope-chart__columns { position: relative; height: 28px; }
.mc-slope-chart__column { position: absolute; top: 0; color: var(--text-muted); font-size: var(--text-sm); line-height: 20px; white-space: nowrap; }

.mc-slope-chart__plot { position: relative; }
.mc-slope-chart__svg { display: block; overflow: visible; }
.mc-slope-chart__axis { stroke: var(--border); stroke-width: 1; shape-rendering: crispEdges; }

/* Every line is one neutral ink; the story item takes the first series (derived from the accent) and the item in focus comes forward. */
.mc-slope-chart__item { --ink: color-mix(in oklab, var(--foreground) 36%, var(--surface)); transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-slope-chart__item[data-accent] { --ink: var(--series-1); }
.mc-slope-chart__item[data-on]:not([data-accent]) { --ink: var(--foreground); }
.mc-slope-chart__item[data-dim] { opacity: .14; }
.mc-slope-chart__line { stroke: var(--ink); stroke-width: 2; stroke-linecap: round; fill: none; transition: stroke var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__dot { fill: var(--ink); stroke: var(--surface); stroke-width: 2; transform-box: fill-box; transform-origin: center; transition: fill var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__leader { fill: none; stroke: var(--border-strong); stroke-width: 1; }

.mc-slope-chart__labels { transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-slope-chart__labels[data-dim] { opacity: .3; }
.mc-slope-chart__start, .mc-slope-chart__end { position: absolute; top: 0; display: flex; height: 20px; align-items: center; gap: 8px; margin-top: -10px; font-size: var(--text-sm); line-height: 20px; white-space: nowrap; pointer-events: none; }
.mc-slope-chart__start { justify-content: flex-end; max-width: 100%; }
/* On a phone the labels step down a size so the longest names fit beside the first column instead of running off the edge. */
.mc-slope-chart__stage[data-narrow] .mc-slope-chart__start, .mc-slope-chart__stage[data-narrow] .mc-slope-chart__end { gap: 6px; font-size: var(--text-xs); }
.mc-slope-chart__name { min-width: 0; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; }
.mc-slope-chart__value { color: var(--foreground); font-variant-numeric: tabular-nums; }
.mc-slope-chart__labels[data-on] .mc-slope-chart__name, .mc-slope-chart__labels[data-accent] .mc-slope-chart__name { color: var(--foreground); }
/* Only the story item is medium; the item in focus changes color, not weight, so its label never shifts sideways. */
.mc-slope-chart__labels[data-accent] .mc-slope-chart__value { font-weight: 500; }

.mc-slope-chart__rank { display: inline-flex; min-width: 30px; align-items: center; gap: 2px; color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-slope-chart__rank[data-move="up"] { color: var(--text-secondary); }
.mc-slope-chart__rankSwap { position: relative; display: inline-flex; overflow: hidden; }

.mc-slope-chart__tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 168px; max-width: min(240px, 100%); gap: 3px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-slope-chart__stage[data-active] .mc-slope-chart__tooltip { opacity: 1; scale: 1; }
.mc-slope-chart__tipTitle { margin: 0 0 2px; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; }
.mc-slope-chart__tipRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; font-size: var(--text-sm); line-height: 1.3; }
.mc-slope-chart__tipName { color: var(--text-secondary); }
.mc-slope-chart__tipValue { color: var(--foreground); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-slope-chart__tipMeta { margin: 2px 0 0; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }

.mc-slope-chart__message { display: grid; min-height: 160px; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-slope-chart__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-slope-chart__item, .mc-slope-chart__line, .mc-slope-chart__dot, .mc-slope-chart__labels, .mc-slope-chart__tooltip { transition: none; }
}
</style>
