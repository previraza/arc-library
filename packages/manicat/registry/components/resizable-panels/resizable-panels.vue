<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { Comment, Fragment, camelize, computed, onBeforeUnmount, onMounted, shallowRef, useAttrs, useSlots } from "vue";
import type { VNode } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { createResizablePanels, initialPanels, paneVars } from "@/lib/resizable-panels";
import type { PanelConfig, PanelsState, ResizablePanelsController } from "@/lib/resizable-panels";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export type { PanelConfig };

defineOptions({ inheritAttrs: false });

/**
 * A horizontal split view whose panes people resize by dragging the dividers between them, the way a mail or code editor window works.
 * Use it when people need to trade space between side-by-side content for the task at hand. Dividers follow the pointer 1:1, resist past
 * a pane's limits, and snap collapsible panes closed. Each divider is a focusable separator: arrows resize, Home and End jump to the limits,
 * Enter hides or restores a collapsible pane, and a double-click resets the layout. The group needs a definite height.
 * Put a `ResizablePanel` in the default slot for each pane.
 */
const props = defineProps<{
  /** Names the group for assistive technology. */
  label?: string;
  /** Extend the inner, named parts of the resizable panels: panel, content, handle, grip or restore. */
  classNames?: { panel?: string; content?: string; handle?: string; grip?: string; restore?: string };
}>();
/** Emitted with each pane's share in percent after a resize settles. */
const emit = defineEmits<{ layoutChange: [sizes: number[]] }>();
const attrs = useAttrs();
const slots = useSlots();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

const flatten = (nodes: VNode[]): VNode[] => nodes.flatMap((node) => (node.type === Fragment && Array.isArray(node.children) ? flatten(node.children as VNode[]) : node.type === Comment ? [] : [node]));
/** Each pane's configuration is read from the props of its `ResizablePanel`. */
const panels = computed(() =>
  flatten(slots.default?.() ?? []).map((node) => {
    const raw = Object.fromEntries(Object.entries(node.props ?? {}).map(([key, value]) => [camelize(key), value])) as Record<string, unknown>;
    return { config: { id: String(raw.id), label: String(raw.label), defaultSize: Number(raw.defaultSize), minSize: raw.minSize === undefined ? undefined : Number(raw.minSize), maxSize: raw.maxSize === undefined ? undefined : Number(raw.maxSize), collapsible: raw.collapsible !== undefined && raw.collapsible !== false, defaultCollapsed: raw.defaultCollapsed !== undefined && raw.defaultCollapsed !== false } as PanelConfig, className: raw.class as string | undefined, node };
  }),
);
const configs = computed(() => panels.value.map((panel) => panel.config));

const group = shallowRef<HTMLElement>();
const state = shallowRef<PanelsState>(initialPanels(configs.value));
let controller: ResizablePanelsController | undefined;
onMounted(() => {
  controller = createResizablePanels(group.value!, { configs: () => configs.value, reduced, onChange: (next) => (state.value = next), onLayoutChange: (sizes) => emit("layoutChange", sizes) });
});
onBeforeUnmount(() => controller?.destroy());

const modeOf = (index: number) => (state.value.collapsed[index - 1] ? "before" : state.value.collapsed[index] ? "after" : "open");
// The state is read so the dividers update on every change.
const aria = (index: number) => (void state.value, controller?.aria(index - 1) ?? { now: Math.round(state.value.shares[index - 1]), min: 0, max: 100 });
const hiddenLabel = (index: number) => (modeOf(index) === "before" ? configs.value[index - 1].label : modeOf(index) === "after" ? configs.value[index].label : null);

// The restore tab scales and blurs in on a spring, and leaves a little faster.
const { blur, duration } = motionTokens;
const tabIn = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle };
const enterTab = (el: Element, done: () => void) => void playPose(el, tabIn, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast }).finished.then(done);
const leaveTab = (el: Element, done: () => void) => { popOut(el as HTMLElement); void playPose(el, { opacity: 1, scale: 1, blur: 0 }, tabIn, { duration: reduced ? duration.instant : duration.fast, ease: "standard" }).finished.then(done); };
</script>

<template>
  <div ref="group" v-bind="{ ...attrs, class: undefined }" :class="cn('mc-resizable-panels__group', attrs.class as string | undefined)" role="group" :aria-label="label" :data-resizing="state.resizing !== null || undefined">
    <template v-for="(panel, index) in panels" :key="panel.config.id">
      <div v-if="index > 0" role="separator" tabindex="0" aria-orientation="vertical" :aria-controls="panels[index - 1].config.id" :aria-label="panels[index - 1].config.label" :aria-valuenow="aria(index).now" :aria-valuemin="aria(index).min" :aria-valuemax="aria(index).max" :aria-valuetext="hiddenLabel(index) ? `${hiddenLabel(index)} hidden, press Enter to show` : `${aria(index).now}%`" :class="cn('mc-resizable-panels__handle', classNames?.handle)" :data-collapsed="modeOf(index) === 'open' ? undefined : modeOf(index)" :data-active="state.resizing === index - 1 || undefined" @pointerdown="controller?.pointerDown(index - 1, $event)" @pointermove="controller?.pointerMove($event)" @pointerup="controller?.pointerEnd($event, false)" @pointercancel="controller?.pointerEnd($event, true)" @keydown="controller?.keyDown(index - 1, $event)" @dblclick="controller?.reset()">
        <span :class="cn('mc-resizable-panels__grip', classNames?.grip)" aria-hidden="true" />
        <Transition :css="false" @enter="enterTab" @leave="leaveTab">
          <span v-if="modeOf(index) !== 'open'" :key="modeOf(index)" :class="cn('mc-resizable-panels__restore', classNames?.restore)" :data-side="modeOf(index)" aria-hidden="true">
            <ChevronRight v-if="modeOf(index) === 'before'" :size="14" :stroke-width="1.75" />
            <ChevronLeft v-else :size="14" :stroke-width="1.75" />
          </span>
        </Transition>
      </div>
      <div :id="panel.config.id" data-pane :class="cn('mc-resizable-panels__panel', panel.className, classNames?.panel)" :style="paneVars(panel.config, configs)" :data-collapsed="state.collapsed[index] || undefined" :data-free="state.free[index] || undefined" :data-anchor="index === 0 && panels.length > 1 ? 'end' : 'start'">
        <div :class="cn('mc-resizable-panels__content', classNames?.content)" :inert="(state.collapsed[index] ? '' : undefined) as unknown as boolean"><component :is="() => (panel.node.children as Record<string, () => VNode[]>)?.default?.()" /></div>
      </div>
    </template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Panes share the width through flex-grow factors, so the layout is right on the server and stays proportional as the group resizes. */
/* A size container, so each pane's floor can scale with the group when it is too narrow for every minimum (see --panel-min). */
.mc-resizable-panels__group { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; container-type: inline-size; }
.mc-resizable-panels__group[data-resizing] { cursor: col-resize; user-select: none; -webkit-user-select: none; }
/* Content ignores the pointer while a divider moves, so hover states never flicker underneath it. */
.mc-resizable-panels__group[data-resizing] .mc-resizable-panels__content { pointer-events: none; }

/* CSS enforces each pane's limits until an interaction frees it; JS hands them back once the pane settles inside them. */
.mc-resizable-panels__panel { position: relative; display: flex; min-width: var(--panel-min); max-width: var(--panel-max); min-height: 0; flex: 0 1 0px; overflow: hidden; }
.mc-resizable-panels__panel[data-anchor="end"] { justify-content: flex-end; }
.mc-resizable-panels__panel[data-free], .mc-resizable-panels__panel[data-collapsed] { min-width: 0; max-width: none; }
.mc-resizable-panels__content { display: flex; width: 100%; flex: none; flex-direction: column; min-height: 0; }
.mc-resizable-panels__panel[data-free] .mc-resizable-panels__content, .mc-resizable-panels__panel[data-collapsed] .mc-resizable-panels__content { min-width: var(--panel-min); }

/* The divider is a one pixel line with a 13px grab area, and a grip that forms while it is hovered, focused, or dragged. */
.mc-resizable-panels__handle { position: relative; z-index: 2; flex: 0 0 1px; background: var(--border); cursor: col-resize; touch-action: none; outline: none; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-resizable-panels__handle::before { position: absolute; inset: 0 -6px; content: ""; }
.mc-resizable-panels__handle[data-collapsed] { background: transparent; cursor: pointer; }
.mc-resizable-panels__grip { position: absolute; top: 50%; left: 50%; width: 4px; height: 32px; border-radius: var(--radius-pill); background: var(--border-strong); opacity: 0; pointer-events: none; transform: translate(-50%, -50%) scaleY(.6); transition: opacity var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) {
  .mc-resizable-panels__handle:not([data-collapsed]):hover { background: var(--border-strong); }
  .mc-resizable-panels__handle:not([data-collapsed]):hover .mc-resizable-panels__grip { opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
  .mc-resizable-panels__handle[data-collapsed]:hover .mc-resizable-panels__restore { border-color: var(--border-strong); color: var(--foreground); }
}
.mc-resizable-panels__handle[data-active] { background: var(--border-strong); }
.mc-resizable-panels__handle[data-active] .mc-resizable-panels__grip { background: var(--foreground); opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
.mc-resizable-panels__handle:focus-visible:not([data-collapsed]) .mc-resizable-panels__grip { opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
.mc-resizable-panels__handle[data-collapsed]:focus-visible .mc-resizable-panels__restore { border-color: var(--border-strong); color: var(--foreground); }

/* Once a neighbour is hidden, a tab on the divider points the way it will come back. */
.mc-resizable-panels__restore { position: absolute; top: 50%; display: grid; width: 18px; height: 40px; margin-top: -20px; place-items: center; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-resting); color: var(--text-secondary); pointer-events: none; transition: border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-resizable-panels__restore[data-side="before"] { left: 5px; transform-origin: 0 50%; }
.mc-resizable-panels__restore[data-side="after"] { right: 5px; transform-origin: 100% 50%; }
.mc-resizable-panels__handle[data-collapsed]::before { inset: 0 -30px; }
.mc-resizable-panels__handle[data-collapsed="before"]::before { left: 0; }
.mc-resizable-panels__handle[data-collapsed="after"]::before { right: 0; }

@media (prefers-reduced-motion: reduce) {
  .mc-resizable-panels__handle, .mc-resizable-panels__grip, .mc-resizable-panels__restore { transition: none; }
}
</style>
