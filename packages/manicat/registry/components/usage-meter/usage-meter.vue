<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { CircleAlert, TriangleAlert } from "lucide-vue-next";
import UsageMeterSwap from "@/registry/components/usage-meter/usage-meter-swap.vue";
import UsageMeterTicker from "@/registry/components/usage-meter/usage-meter-ticker.vue";
import { playPose, popOut } from "@/lib/motion-dom";
import { createBadgeWidth, createUsageBar, popPoses } from "@/lib/usage-meter";
import type { MeterSegment } from "@/lib/usage-meter";

export type UsageMeterSegment = MeterSegment;
type Status = "ok" | "near" | "over";

defineOptions({ inheritAttrs: false });

/** Use a usage meter for a fixed allowance, such as storage or seats, when people need to see what takes the space and how close they are to the limit. */
const props = withDefaults(
  defineProps<{
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
  }>(),
  { unit: "", decimals: 1, freeLabel: "Free", overLabel: "Over limit", warnAt: 0.9 },
);

const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const titleId = useId();
const hatchId = `hatch${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

const root = ref<HTMLElement>();
const track = ref<HTMLElement>();
const overflow = ref<SVGElement>();
const marker = ref<HTMLElement>();
const badge = ref<HTMLElement>();
const badgeInner = ref<HTMLElement>();
const legend = ref<HTMLElement>();
const seen = ref(false);
let bar: ReturnType<typeof createUsageBar> | undefined;
let stopBadge: (() => void) | undefined;
let observer: IntersectionObserver | undefined;

const ready = computed(() => seen.value || reduced);
const round = (value: number) => Math.round(value * 10 ** props.decimals) / 10 ** props.decimals;
const total = computed(() => round(props.segments.reduce((sum, segment) => sum + segment.value, 0)));
const free = computed(() => round(Math.max(0, props.limit - total.value)));
const over = computed(() => round(Math.max(0, total.value - props.limit)));
const status = computed<Status>(() => (total.value > props.limit ? "over" : total.value >= props.limit * props.warnAt ? "near" : "ok"));
const format = (value: number) => `${value.toFixed(props.decimals)}${props.unit ? ` ${props.unit}` : ""}`;
const limitText = computed(() => format(props.limit).replace(/\.0+(?= |$)/, ""));

onMounted(() => {
  bar = createUsageBar({ track: track.value!, overflow: overflow.value as unknown as HTMLElement, marker: marker.value! }, { reduced, limit: props.limit });
  stopBadge = createBadgeWidth(badge.value!, badgeInner.value!, reduced);
  if (!reduced) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer?.disconnect();
      seen.value = true;
    }, { threshold: 0.4 });
    observer.observe(root.value!);
  }
  bar.update({ segments: props.segments, limit: props.limit, ready: ready.value });
});
onBeforeUnmount(() => { bar?.destroy(); stopBadge?.(); observer?.disconnect(); });
watch(() => [props.segments.map((segment) => `${segment.id}:${segment.value}`).join("|"), props.limit, ready.value], () => bar?.update({ segments: props.segments, limit: props.limit, ready: ready.value }), { flush: "post" });

// Hover previews a category, focus previews it too, and a press pins it until pressed again or Escape.
const hovered = ref<string | null>(null);
const focused = ref<string | null>(null);
const pinned = ref<string | null>(null);
const roving = ref(0);
const items = computed(() => [...props.segments.map((segment) => ({ id: segment.id, label: segment.label, value: segment.value })), { id: "free", label: status.value === "over" ? props.overLabel : props.freeLabel, value: status.value === "over" ? over.value : free.value }]);
const active = computed(() => hovered.value ?? focused.value ?? pinned.value);
const activeItem = computed(() => items.value.find((item) => item.id === active.value) ?? null);
const highlight = (id: string) => (active.value ? (active.value === id ? "on" : "off") : undefined);

const idAt = (clientX: number) => {
  const rect = track.value?.getBoundingClientRect();
  if (!rect?.width) return null;
  const at = ((clientX - rect.left) / rect.width) * Math.max(props.limit, total.value);
  // Past the limit the hatch stands for the overage, so pointing there highlights it rather than the category beneath.
  if (at > props.limit) return "free";
  let end = 0;
  for (const segment of props.segments) {
    end += segment.value;
    if (at <= end) return segment.id;
  }
  return "free";
};
const onTrackMove = (event: PointerEvent) => { if (event.pointerType === "mouse") hovered.value = idAt(event.clientX); };
const onTrackTap = (event: PointerEvent) => {
  if (event.pointerType === "mouse") return;
  const id = idAt(event.clientX);
  pinned.value = pinned.value === id ? null : id;
};
const onLegendKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    if (pinned.value || focused.value) { event.preventDefault(); pinned.value = null; }
    return;
  }
  const next = ({ ArrowRight: roving.value + 1, ArrowDown: roving.value + 1, ArrowLeft: roving.value - 1, ArrowUp: roving.value - 1, Home: 0, End: items.value.length - 1 } as Record<string, number>)[event.key];
  if (next === undefined) return;
  event.preventDefault();
  const index = (next + items.value.length) % items.value.length;
  roving.value = index;
  legend.value?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
};

const headline = computed(() => (ready.value ? (activeItem.value ? activeItem.value.value : total.value) : 0));
const share = computed(() => (activeItem.value ? Math.round((activeItem.value.value / props.limit) * 100) : 0));
const caption = computed(() => (!activeItem.value ? `${props.unit} of ${limitText.value} used` : activeItem.value.id === "free" ? `${props.unit} ${status.value === "over" ? "over the limit" : "free"}` : `${props.unit} in ${activeItem.value.label} · ${share.value}% of plan`));
const badgeText = computed(() => (status.value === "over" ? `${format(over.value)} over` : status.value === "near" ? "Almost full" : `${format(free.value)} free`));
const summary = computed(() => `${props.label}: ${format(total.value)} of ${limitText.value} used. ${props.segments.map((segment) => `${segment.label} ${format(segment.value)}`).join(", ")}. ${status.value === "over" ? `Over the limit by ${format(over.value)}.` : `${format(free.value)} free${status.value === "near" ? ", almost full" : ""}.`}`);
// Status changes are announced, and so is a growing overage; routine changes inside a status stay quiet.
const notice = computed(() => (status.value === "over" ? `over:${over.value}` : status.value));
const announced = ref({ notice: notice.value, message: "" });
watch(notice, (next) => {
  announced.value = { notice: next, message: status.value === "over" ? `Over the plan limit by ${format(over.value)}.` : status.value === "near" ? `Almost full. ${format(free.value)} free.` : `Under the limit. ${format(free.value)} free.` };
}, { flush: "sync" });

// The icons scale and blur in on a spring, and leave a little faster while they pop out of the flow.
const enterPop = (el: Element, done: () => void) => { const poses = popPoses(reduced); void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done); };
const leavePop = (el: Element, done: () => void) => { const poses = popPoses(reduced); popOut(el as HTMLElement); void playPose(el, poses.rest, poses.from, poses.leaveTiming).finished.then(done); };
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, class: undefined }" :class="['mc-usage-meter__meter', attrs.class as string | undefined]" role="group" :aria-labelledby="titleId" :data-status="status">
    <div :class="cn('mc-usage-meter__top', 'top')">
      <span :id="titleId" :class="cn('mc-usage-meter__title', 'title')">{{ label }}</span>
      <span ref="badge" :class="cn('mc-usage-meter__badge', 'badge')" :data-status="status">
        <span ref="badgeInner" :class="cn('mc-usage-meter__badgeInner', 'badgeInner')">
          <Transition :css="false" @enter="enterPop" @leave="leavePop">
            <span v-if="status !== 'ok'" :key="status" :class="cn('mc-usage-meter__badgeIcon', 'badgeIcon')"><component :is="status === 'over' ? TriangleAlert : CircleAlert" :size="14" :stroke-width="2" aria-hidden="true" /></span>
          </Transition>
          <UsageMeterSwap :text="badgeText" :class-names="classNames" />
        </span>
      </span>
    </div>
    <p :class="cn('mc-usage-meter__total', 'total')">
      <span class="mc-usage-meter__srOnly">{{ format(total) }} of {{ limitText }} used</span>
      <span :class="cn('mc-usage-meter__amount', 'amount')" aria-hidden="true"><UsageMeterTicker :value="headline" :decimals="decimals" :class-names="classNames" /></span>
      <span :class="cn('mc-usage-meter__caption', 'caption')" aria-hidden="true"><UsageMeterSwap :text="caption" :class-names="classNames" /></span>
    </p>
    <div :class="cn('mc-usage-meter__bar', 'bar')">
      <div ref="track" :class="cn('mc-usage-meter__track', 'track')" role="img" :aria-label="summary" :data-active="active ?? undefined" @pointermove="onTrackMove" @pointerleave="hovered = null" @pointerup="onTrackTap">
        <span v-for="(segment, index) in segments" :key="segment.id" data-seg :class="cn('mc-usage-meter__segment', 'segment')" :data-index="index" :data-highlight="highlight(segment.id)" />
        <!-- Past the limit the bar is struck through: the overflow keeps its colours, hatched so it reads as over without colour. -->
        <svg ref="overflow" :class="cn('mc-usage-meter__overflow', 'overflow')" :data-highlight="highlight('free')" aria-hidden="true" focusable="false">
          <defs><pattern :id="hatchId" :width="6" :height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect :width="2.5" :height="6" :class="cn('mc-usage-meter__hatch', 'hatch')" /></pattern></defs>
          <rect :class="cn('mc-usage-meter__overTint', 'overTint')" width="100%" height="100%" />
          <rect width="100%" height="100%" :fill="`url(#${hatchId})`" />
        </svg>
      </div>
      <span ref="marker" :class="cn('mc-usage-meter__limit', 'limit')" aria-hidden="true" />
    </div>
    <div ref="legend" :class="cn('mc-usage-meter__legend', 'legend')" role="group" :aria-label="`${label} by category`" @keydown="onLegendKey">
      <button v-for="(item, index) in items" :key="item.id" type="button" :class="cn('mc-usage-meter__item', 'item')" :data-highlight="highlight(item.id)" :aria-pressed="pinned === item.id" :aria-label="`${item.label}, ${format(item.value)}`" :tabindex="index === roving ? 0 : -1" @click="roving = index; pinned = pinned === item.id ? null : item.id" @focus="roving = index; focused = item.id" @blur="focused = null" @pointerenter="(event) => { if (event.pointerType === 'mouse') hovered = item.id; }" @pointerleave="(event) => { if (event.pointerType === 'mouse') hovered = null; }">
        <span :class="cn('mc-usage-meter__itemHead', 'itemHead')">
          <span :class="cn('mc-usage-meter__key', 'key')" aria-hidden="true">
            <Transition :css="false" @enter="enterPop" @leave="leavePop">
              <span v-if="item.id === 'free' && status === 'over'" key="alert" :class="cn('mc-usage-meter__keyIcon', 'keyIcon')"><TriangleAlert :size="12" :stroke-width="2" /></span>
              <span v-else key="swatch" :class="cn('mc-usage-meter__swatch', 'swatch')" :data-index="item.id === 'free' ? 'free' : index" />
            </Transition>
          </span>
          <span :class="cn('mc-usage-meter__itemLabel', 'itemLabel')"><UsageMeterSwap :text="item.label" :class-names="classNames" /></span>
        </span>
        <span :class="cn('mc-usage-meter__itemValue', 'itemValue')"><UsageMeterTicker :value="item.value" :decimals="decimals" :class-names="classNames" /><span v-if="unit" :class="cn('mc-usage-meter__itemUnit', 'itemUnit')">{{ unit }}</span></span>
      </button>
    </div>
    <p class="mc-usage-meter__srOnly" aria-live="polite" aria-atomic="true">{{ announced.message }}</p>
  </div>
</template>

<style>
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
</style>
