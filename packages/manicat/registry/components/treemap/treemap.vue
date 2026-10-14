<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, watch } from "vue";
import { popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";
import { createTooltipFollow } from "@/lib/slope-chart";
import { STEPS, TIP, branchIndex, clamp, colorScale, createTreemapMotion, flatten, follow, grouped, hueOf, keyAction, layoutFrom, percent, topOf } from "@/lib/treemap";
import type { Flat, Rect, TreemapNode } from "@/lib/treemap";

export type { TreemapNode };

defineOptions({ inheritAttrs: false });

/** Use a treemap for a hierarchy of parts, such as revenue by region, country, and plan, when sizes matter more than exact comparisons. */
const props = withDefaults(
  defineProps<{
    /** The root. Its label names the whole in the first breadcrumb. */
    data: TreemapNode;
    /** What the whole is, such as "Revenue". Names the chart for assistive technology. */
    label: string;
    formatValue?: (value: number) => string;
    /** Names the shading measure in the tooltip and scale, such as "Growth". Tiles take the hue of their top level branch and grow deeper with the measure. Leave it out to draw every tile at one depth. */
    colorLabel?: string;
    formatColor?: (value: number) => string;
    /** Range of the color measure. Defaults to the range of the leaves. */
    colorDomain?: [number, number];
    defaultFocus?: string;
    /** Height of the tiles in pixels. */
    height?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the treemap: bar, crumbs, crumbList, crumb, crumbSep, crumbButton, crumbCurrent, total, totalValue, stage, tile, tileLabel, tileValue, message, tooltip, tipTitle, tipValue, tipName, tipAmount, tipNote, scale, scaleLabel, scaleEnd, steps or step. */
    classNames?: Record<string, string | undefined>;
  }>(),
  { formatValue: (value: number) => grouped.format(value), formatColor: (value: number) => grouped.format(value), height: 420, emptyLabel: "No data yet" },
);

/** `v-model:focus` binds the id of the node that fills the view. */
const focusModel = defineModel<string | undefined>("focus", { default: undefined });
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);

const figure = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const tip = ref<HTMLElement>();
const inView = ref(false);
const width = ref(0);
let motion: ReturnType<typeof createTreemapMotion> | undefined;
let tooltip: ReturnType<typeof createTooltipFollow> | undefined;
let resize: ResizeObserver | undefined;
let observer: IntersectionObserver | undefined;

const flat = computed(() => flatten(props.data));
const root = computed(() => flat.value.get(props.data.id)!);
const nodes = computed(() => [...flat.value.values()].filter((node) => node.depth > 0));
const ownFocus = ref(props.defaultFocus ?? props.data.id);
const wanted = computed(() => flat.value.get(focusModel.value ?? ownFocus.value));
const center = computed(() => (wanted.value && wanted.value.children.length ? wanted.value : root.value));
const zoomTo = (id: string) => { ownFocus.value = id; focusModel.value = id; };
const active = ref<string | null>(null);
const pointer = ref<{ x: number; y: number } | null>(null);

const view = computed<Rect>(() => ({ x: 0, y: 0, w: width.value, h: props.height }));
const target = computed(() => layoutFrom(flat.value, center.value.id, view.value));
const scale = computed(() => colorScale(nodes.value, props.colorLabel, props.colorDomain));
const branchOf = computed(() => branchIndex(flat.value, root.value));
const hue = (id: string) => hueOf(branchOf.value.get(id) ?? -1);

const activeNode = computed(() => (active.value ? (flat.value.get(active.value) ?? null) : null));
const parentOf = (node: Flat) => (node.parent ? flat.value.get(node.parent)! : node);
const share = (node: Flat, of: Flat) => (of.value ? node.value / of.value : 0);
const top = (node: Flat | null) => topOf(flat.value, center.value, node);
const focusTop = computed(() => top(activeNode.value));

const trail = computed(() => {
  const list: Flat[] = [];
  for (let at: Flat | undefined = center.value; at; at = at.parent ? flat.value.get(at.parent) : undefined) list.unshift(at);
  return list;
});
const empty = computed(() => !root.value.value);
const describe = (node: Flat) => `${node.path.join(", ")}, ${props.formatValue(node.value)}, ${percent.format(share(node, parentOf(node)))} of ${parentOf(node).label}${scale.value.colored && node.color !== null ? `, ${props.colorLabel} ${props.formatColor(node.color)}` : ""}`;

const shown = computed(() => (inView.value || reduced) && width.value > 0);

function runMotion() {
  if (shown.value) motion?.run({ nodes: nodes.value, flat: flat.value, center: center.value, target: target.value, view: view.value });
}

// Tooltip: trails the pointer, or sits by the tile in focus, and stays inside the chart.
function placeTip() {
  const bubble = tip.value;
  const node = activeNode.value;
  if (!bubble || !node || !width.value) return tooltip?.hide();
  const r = target.value.get(node.id);
  const ax = pointer.value?.x ?? (r ? r.x + r.w / 2 : 0);
  const ay = pointer.value?.y ?? (r ? r.y + Math.min(r.h / 2, 28) : 0);
  const tw = bubble.offsetWidth;
  const th = bubble.offsetHeight;
  let left = ax + TIP;
  if (left + tw > width.value) left = ax - TIP - tw;
  let at = ay + TIP;
  if (at + th > props.height) at = ay - TIP - th;
  tooltip?.to(clamp(left, 0, Math.max(0, width.value - tw)), clamp(at, 0, Math.max(0, props.height - th)));
}

onMounted(() => {
  const node = stage.value!;
  const read = () => (width.value = node.clientWidth);
  resize = new ResizeObserver(read);
  resize.observe(node);
  read();
  motion = createTreemapMotion(node, reduced);
  tooltip = createTooltipFollow(tip.value!, reduced, follow);
  if (!reduced) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer?.disconnect();
      inView.value = true;
    }, { threshold: 0.25 });
    observer.observe(figure.value!);
  }
  motion.paint(nodes.value);
  runMotion();
});
onBeforeUnmount(() => { resize?.disconnect(); observer?.disconnect(); motion?.stop(); });
watch([shown, target], runMotion, { flush: "post" });
onUpdated(() => { motion?.paint(nodes.value); placeTip(); });

function onKeydown(event: KeyboardEvent) {
  const action = keyAction(event.key, { flat: flat.value, center: center.value, active: activeNode.value, target: target.value });
  if (!action) return;
  event.preventDefault();
  if (action.clearPointer) pointer.value = null;
  if (action.zoom) zoomTo(action.zoom);
  if (action.active !== undefined) active.value = action.active;
}
function onTilePointerMove(event: PointerEvent, id: string) {
  event.stopPropagation();
  if (event.pointerType !== "mouse") return;
  const rect = stage.value?.getBoundingClientRect();
  if (rect) pointer.value = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  active.value = id;
}
function onTileClick(event: MouseEvent, node: Flat) {
  event.stopPropagation();
  const hit = top(node);
  if (hit?.children.length) zoomTo(hit.id);
  else if (!activeNode.value || activeNode.value.id !== node.id) active.value = node.id;
}

// Crumbs slide in from the left and leave a little faster; the value in the total rises in and lifts away.
const { duration, ease, blur } = motionTokens;
const enterCrumb = (el: Element, done: () => void) => void animate(el, { opacity: [0, 1], x: [reduced ? 0 : -6, 0], filter: [reduced ? "blur(0px)" : `blur(${blur.subtle}px)`, "blur(0px)"] } as never, motionTokens.spring.smooth as never).finished.then(done);
const leaveCrumb = (el: Element, done: () => void) => {
  popOut(el as HTMLElement);
  void animate(el, { opacity: [1, 0], x: [0, reduced ? 0 : -6] } as never, { duration: duration.instant, ease: [...ease.exit] } as never).finished.then(done);
};
const enterTotal = (el: Element, done: () => void) => void animate(el, { opacity: [0, 1], y: [reduced ? 0 : 6, 0] } as never, { duration: duration.standard, ease: [...ease.enter] } as never).finished.then(done);
const leaveTotal = (el: Element, done: () => void) => {
  popOut(el as HTMLElement);
  void animate(el, { opacity: [1, 0], y: [0, reduced ? 0 : -6] } as never, { duration: duration.standard, ease: [...ease.enter] } as never).finished.then(done);
};
defineExpose({ figure });
</script>

<template>
  <figure ref="figure" v-bind="{ ...attrs, class: undefined }" :class="['mc-treemap__figure', attrs.class as string | undefined]" :aria-label="label">
    <div :class="cn('mc-treemap__bar', 'bar')">
      <nav :class="cn('mc-treemap__crumbs', 'crumbs')" :aria-label="`${label} path`">
        <TransitionGroup tag="ol" :css="false" :class="cn('mc-treemap__crumbList', 'crumbList')" @enter="enterCrumb" @leave="leaveCrumb">
          <li v-for="(node, index) in trail" :key="node.id" :class="cn('mc-treemap__crumb', 'crumb')">
            <span v-if="index > 0" :class="cn('mc-treemap__crumbSep', 'crumbSep')" aria-hidden="true">/</span>
            <button v-if="index < trail.length - 1" type="button" :class="cn('mc-treemap__crumbButton', 'crumbButton')" @click="zoomTo(node.id); active = null">{{ node.label }}</button>
            <span v-else :class="cn('mc-treemap__crumbCurrent', 'crumbCurrent')" aria-current="location">{{ node.label }}</span>
          </li>
        </TransitionGroup>
      </nav>
      <p :class="cn('mc-treemap__total', 'total')">
        <Transition :css="false" @enter="enterTotal" @leave="leaveTotal">
          <span :key="formatValue(center.value)" :class="cn('mc-treemap__totalValue', 'totalValue')">{{ formatValue(center.value) }}</span>
        </Transition>
      </p>
    </div>
    <div ref="stage" :class="cn('mc-treemap__stage', 'stage')" :style="{ height: `${height}px` }" :data-active="activeNode ? true : undefined" role="group" :tabindex="empty ? -1 : 0" aria-roledescription="treemap" :aria-label="`${label}, ${center.label}. Arrow keys move between tiles, Enter zooms in, Escape zooms out.`" @keydown="onKeydown" @blur="active = null" @pointerleave="active = null; pointer = null">
      <div v-for="node in nodes" :key="node.id" :data-tile="node.id" :class="cn('mc-treemap__tile', 'tile')" :data-branch="node.children.length > 0 || undefined" :data-active="active === node.id || undefined" :data-lineage="(focusTop?.id === node.id && active !== node.id) || undefined" :data-dim="(focusTop !== null && top(node) !== null && focusTop.id !== top(node)!.id) || undefined" :style="{ '--hue': hue(node.id), '--fill': `color-mix(in oklab, ${hue(node.id)} ${scale.shade(node.color)}%, var(--surface))`, zIndex: node.depth }" @pointermove="onTilePointerMove($event, node.id)" @click="onTileClick($event, node)">
        <span :class="cn('mc-treemap__tileLabel', 'tileLabel')">{{ node.label }}</span>
        <span :class="cn('mc-treemap__tileValue', 'tileValue')">{{ formatValue(node.value) }}</span>
      </div>
      <p v-if="empty" :class="cn('mc-treemap__message', 'message')">{{ emptyLabel }}</p>
      <div ref="tip" :class="cn('mc-treemap__tooltip', 'tooltip')" aria-hidden="true">
        <template v-if="activeNode">
          <p :class="cn('mc-treemap__tipTitle', 'tipTitle')">{{ activeNode.path.slice(0, -1).join(" / ") || root.label }}</p>
          <p :class="cn('mc-treemap__tipValue', 'tipValue')"><span :class="cn('mc-treemap__tipName', 'tipName')">{{ activeNode.label }}</span><span :class="cn('mc-treemap__tipAmount', 'tipAmount')">{{ formatValue(activeNode.value) }}</span></p>
          <p :class="cn('mc-treemap__tipNote', 'tipNote')">{{ percent.format(share(activeNode, parentOf(activeNode))) }} of {{ parentOf(activeNode).label }}</p>
          <p v-if="scale.colored && activeNode.color !== null" :class="cn('mc-treemap__tipNote', 'tipNote')">{{ colorLabel }} {{ formatColor(activeNode.color) }}</p>
        </template>
      </div>
    </div>
    <div v-if="scale.colored" :class="cn('mc-treemap__scale', 'scale')" aria-hidden="true">
      <span :class="cn('mc-treemap__scaleLabel', 'scaleLabel')">{{ colorLabel }}</span>
      <span :class="cn('mc-treemap__scaleEnd', 'scaleEnd')">{{ formatColor(scale.lo) }}</span>
      <span :class="cn('mc-treemap__steps', 'steps')"><span v-for="i in STEPS" :key="i" :class="cn('mc-treemap__step', 'step')" :style="{ '--fill': `color-mix(in oklab, ${center.depth === 0 ? 'var(--foreground)' : hue(center.id)} ${Math.round(14 + ((i - 1) / (STEPS - 1)) * 44)}%, var(--surface))` }" /></span>
      <span :class="cn('mc-treemap__scaleEnd', 'scaleEnd')">{{ formatColor(scale.hi) }}</span>
    </div>
    <p class="mc-treemap__srOnly" aria-live="polite" aria-atomic="true">{{ activeNode ? describe(activeNode) : `${center.label}, ${formatValue(center.value)}` }}</p>
    <div v-if="!empty" class="mc-treemap__srOnly"><table>
      <caption>{{ label }}</caption>
      <thead><tr><th scope="col">Path</th><th scope="col">Value</th><th scope="col">Share of parent</th><th v-if="scale.colored" scope="col">{{ colorLabel }}</th></tr></thead>
      <tbody><tr v-for="node in nodes" :key="node.id"><th scope="row">{{ node.path.join(" / ") }}</th><td>{{ formatValue(node.value) }}</td><td>{{ percent.format(share(node, parentOf(node))) }}</td><td v-if="scale.colored">{{ node.color === null ? "" : formatColor(node.color) }}</td></tr></tbody>
    </table></div>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-treemap__figure { display: grid; min-width: 0; gap: var(--space-3); margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-treemap__css. */

/* Breadcrumb on the left, the total of what fills the view on the right. */
.mc-treemap__bar { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: var(--space-3); }
/* Pull the trail back by the crumb padding, so the first label lines up with the tiles and the title. */
.mc-treemap__crumbs { min-width: 0; margin-left: -4px; }
.mc-treemap__crumbList { position: relative; display: flex; min-width: 0; min-height: 32px; flex-wrap: wrap; align-items: center; margin: 0; padding: 0; list-style: none; }
.mc-treemap__crumb { display: inline-flex; align-items: center; min-width: 0; }
.mc-treemap__crumbSep { padding: 0 4px; color: var(--border-strong); font-size: var(--text-sm); }
.mc-treemap__crumbButton { min-height: 32px; padding: 0 6px; margin: 0 -2px; border: 0; border-radius: 10px; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-treemap__crumbButton:active { transform: scale(.97); }
.mc-treemap__crumbCurrent { padding: 0 4px; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; }
@media (hover: hover) and (pointer: fine) { .mc-treemap__crumbButton:hover { background: color-mix(in oklab, var(--foreground) 5%, transparent); color: var(--foreground); } }
.mc-treemap__total { position: relative; display: inline-grid; flex: none; justify-items: end; overflow: hidden; margin: 0; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); font-variant-numeric: tabular-nums; }
.mc-treemap__totalValue { display: block; }

/* Tiles are absolutely placed and sized each frame, so text never scales while a tile grows or shrinks. */
.mc-treemap__stage { position: relative; min-width: 0; overflow: hidden; border-radius: 12px; outline: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-treemap__tile { position: absolute; top: 0; left: 0; display: flex; flex-direction: column; gap: 1px; overflow: hidden; padding: 6px 8px; border-radius: 6px; background: var(--fill); color: var(--foreground); cursor: pointer; visibility: hidden; will-change: transform, width, height; transition: background-color var(--duration-considered) var(--ease-standard), color var(--duration-considered) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-treemap__tile[data-branch][data-level="1"] { padding: 3px 8px; border-radius: 8px; background: color-mix(in oklab, var(--hue) 9%, var(--surface)); color: var(--foreground); cursor: zoom-in; }
.mc-treemap__tileLabel, .mc-treemap__tileValue { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-xs); line-height: 16px; opacity: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-treemap__tileLabel { font-weight: 500; }
.mc-treemap__tileValue { opacity: 0; font-variant-numeric: tabular-nums; }
.mc-treemap__tile[data-room="name"] .mc-treemap__tileLabel, .mc-treemap__tile[data-room="full"] .mc-treemap__tileLabel, .mc-treemap__tile[data-room="full"] .mc-treemap__tileValue { opacity: 1; }
.mc-treemap__tile[data-room="full"] .mc-treemap__tileValue { opacity: .72; }
/* A branch on the top level prints its name and total on one header line. */
.mc-treemap__tile[data-branch][data-level="1"] { flex-direction: row; align-items: baseline; justify-content: space-between; gap: 8px; }
.mc-treemap__tile[data-branch][data-level="1"] .mc-treemap__tileValue { flex: none; opacity: .6; }
.mc-treemap__tile[data-branch][data-level="1"][data-room="none"] .mc-treemap__tileLabel, .mc-treemap__tile[data-branch][data-level="1"][data-room="none"] .mc-treemap__tileValue { opacity: 0; }
.mc-treemap__tile[data-branch][data-level="1"][data-room="name"] .mc-treemap__tileValue { opacity: .6; }
.mc-treemap__tile[data-level="2"] { padding: 5px 7px; }

.mc-treemap__tile[data-active] { box-shadow: inset 0 0 0 2px var(--foreground); }
.mc-treemap__tile[data-lineage] { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--hue) 70%, transparent); }
.mc-treemap__stage[data-active] .mc-treemap__tile[data-dim] { filter: opacity(.5); }

.mc-treemap__message { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); pointer-events: none; }

.mc-treemap__tooltip { position: absolute; top: 0; left: 0; z-index: 50; display: grid; min-width: 160px; max-width: min(240px, 100%); grid-template-columns: minmax(0, 1fr); gap: 2px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-treemap__stage[data-active] .mc-treemap__tooltip { opacity: 1; scale: 1; }
.mc-treemap__tipTitle { margin: 0; overflow: hidden; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); text-overflow: ellipsis; white-space: nowrap; }
.mc-treemap__tipValue { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0; font-size: var(--text-sm); line-height: 1.35; }
.mc-treemap__tipName { min-width: 0; overflow: hidden; color: var(--foreground); text-overflow: ellipsis; white-space: nowrap; }
.mc-treemap__tipAmount { flex: none; color: var(--foreground); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-treemap__tipNote { margin: 0; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }

/* The color scale: stepped swatches from light to dark, never a gradient. */
.mc-treemap__scale { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; }
.mc-treemap__scaleLabel { margin-right: 4px; color: var(--text-secondary); }
.mc-treemap__steps { display: inline-flex; gap: 2px; }
.mc-treemap__step { width: 18px; height: 10px; border-radius: 3px; background: var(--fill); }

.mc-treemap__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-treemap__tile, .mc-treemap__tileLabel, .mc-treemap__tileValue, .mc-treemap__tooltip, .mc-treemap__crumbButton { transition: none; }
}
</style>
