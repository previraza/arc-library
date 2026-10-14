<script setup lang="ts">
// @manicat-dependencies motion reka-ui
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import type { Component } from "vue";
import { TooltipProvider } from "reka-ui";
import FloatingButtonGroupItem from "@/registry/components/floating-button-group/floating-button-group-item.vue";
import { createGroupHighlight, groupKey } from "@/lib/floating-button-group";
import type { GroupContext } from "@/lib/floating-button-group";

export type FloatingButtonGroupVariant = "muted" | "floating";
export type FloatingButtonGroupSize = "sm" | "md";
export type FloatingButtonGroupOrientation = "horizontal" | "vertical";

export interface FloatingButtonGroupAction {
  type?: "action";
  /** Stable key, also passed to onAction. */
  id: string;
  /** Visible label, and the accessible name when the item shows only its icon. */
  label: string;
  icon?: Component;
  /** Shows only the icon. The label moves into a tooltip and the accessible name. Overrides the group's iconOnly. */
  iconOnly?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /** Marks an action that switches a mode on, such as Present. Sets aria-pressed and keeps a quiet tint while on. */
  pressed?: boolean;
  /** A shortcut hint shown in the tooltip, such as "⌘Z". The component does not bind the key. */
  shortcut?: string;
  /** Other labels this item can switch to, such as ["Copied"] for Share. The button keeps the width of the widest, so a label change never moves anything. */
  reserveLabels?: readonly string[];
}
export interface FloatingButtonGroupSeparator {
  type: "separator";
  id?: string;
}
export type FloatingButtonGroupItem = FloatingButtonGroupAction | FloatingButtonGroupSeparator;

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: readonly FloatingButtonGroupItem[];
    /** Accessible name of the toolbar, such as "Board actions". */
    label: string;
    /** muted sits quietly on a page; floating raises the tray with the floating shadow for overlays such as a selection toolbar. */
    variant?: FloatingButtonGroupVariant;
    size?: FloatingButtonGroupSize;
    orientation?: FloatingButtonGroupOrientation;
    /** Shows every item as an icon only, with its label in a tooltip. Items with their own iconOnly win. */
    iconOnly?: boolean;
    /** Side of the item tooltips. Defaults to top for a row and right for a column. */
    tooltipSide?: "top" | "bottom" | "left" | "right";
    /** Extend the inner, named parts of the floating button group: item, slot, ghost, text, icon, separator. */
    classNames?: { item?: string; slot?: string; ghost?: string; text?: string; icon?: string; separator?: string };
  }>(),
  { variant: "muted", size: "md", orientation: "horizontal", iconOnly: false },
);

/** Called with the item id after the item's own onSelect. */
const emit = defineEmits<{ action: [id: string] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const tray = ref<HTMLElement>();
const highlight = ref<HTMLElement>();
const hoverId = ref<string | null>(null);
const focusId = ref<string | null>(null);
const pressing = ref(false);
const tabStop = ref<string | null>(null);
let controller: ReturnType<typeof createGroupHighlight> | undefined;

const cn = (base: string, ...extra: (string | undefined | false)[]) => [base, ...extra].filter(Boolean).join(" ");
const isAction = (item: FloatingButtonGroupItem): item is FloatingButtonGroupAction => item.type !== "separator";
const actions = computed(() => props.items.filter(isAction));
const byId = computed(() => new Map(actions.value.map((action) => [action.id, action])));
const enabled = (id: string | null) => !!id && !!byId.value.get(id) && !byId.value.get(id)?.disabled;
// Pointer wins over keyboard focus while it is in the tray; a disabled item under the pointer hands back to focus.
const activeId = computed(() => (enabled(hoverId.value) ? hoverId.value : focusId.value && byId.value.has(focusId.value) ? focusId.value : null));
const stop = computed(() => (enabled(tabStop.value) ? tabStop.value : (actions.value.find((action) => !action.disabled)?.id ?? null)));
const vertical = computed(() => props.orientation === "vertical");
const side = computed(() => props.tooltipSide ?? (vertical.value ? "right" : "top"));
const idsKey = computed(() => actions.value.map((action) => action.id).join("\u0000"));

const context: GroupContext = {
  activeId: () => activeId.value,
  tabStop: () => stop.value,
  side: () => side.value,
  iconOnly: () => props.iconOnly,
  classNames: () => props.classNames,
  hover: (id) => (hoverId.value = id),
  press: (id, disabled) => { if (disabled) return; hoverId.value = id; pressing.value = true; },
  release: () => (pressing.value = false),
  focus: (event, id) => {
    tabStop.value = id;
    let keyboard = false;
    try { keyboard = (event.currentTarget as HTMLElement).matches(":focus-visible"); } catch { keyboard = false; }
    focusId.value = keyboard ? id : null;
  },
  select: (id) => {
    const action = byId.value.get(id);
    if (!action || action.disabled) return;
    action.onSelect?.();
    emit("action", id);
  },
};
provide(groupKey, context);

function leave() {
  hoverId.value = null;
  pressing.value = false;
}
onMounted(() => {
  controller = createGroupHighlight(tray.value!, highlight.value!, reduced);
  controller.watchItems();
  controller.place(activeId.value, "move");
  // A native listener, because bubbling pointer events through portals would keep the highlight behind on the tooltip.
  tray.value!.addEventListener("pointerleave", leave);
});
onBeforeUnmount(() => {
  controller?.destroy();
  tray.value?.removeEventListener("pointerleave", leave);
});
watch(activeId, async (id) => { await nextTick(); controller?.place(id, "move"); }, { flush: "post" });
watch(idsKey, async () => { await nextTick(); controller?.watchItems(); }, { flush: "post" });
watch([pressing, activeId], () => controller?.press(pressing.value, activeId.value));

const buttons = () => Array.from(tray.value?.querySelectorAll<HTMLButtonElement>("[data-fbg-item]") ?? []);
function onKeydown(event: KeyboardEvent) {
  const all = buttons();
  const index = all.findIndex((node) => node === document.activeElement);
  if (index < 0) return;
  const next = vertical.value ? "ArrowDown" : "ArrowRight";
  const previous = vertical.value ? "ArrowUp" : "ArrowLeft";
  const usable = (node: HTMLButtonElement) => node.getAttribute("aria-disabled") !== "true";
  let target: HTMLButtonElement | undefined;
  if (event.key === "Home") target = all.find(usable);
  else if (event.key === "End") target = [...all].reverse().find(usable);
  else if (event.key === next || event.key === previous) {
    const step = event.key === next ? 1 : -1;
    for (let offset = 1; offset <= all.length; offset += 1) {
      const candidate = all[(index + step * offset + all.length * offset) % all.length];
      if (usable(candidate)) { target = candidate; break; }
    }
  } else return;
  event.preventDefault();
  if (!target) return;
  // The keyboard takes the highlight back until the pointer moves again.
  hoverId.value = null;
  target.focus();
}
function onBlur(event: FocusEvent) {
  if (tray.value?.contains(event.relatedTarget as Node | null)) return;
  focusId.value = null;
  pressing.value = false;
}
</script>

<template>
  <component :is="side === 'left' || side === 'right' ? TooltipProvider : 'div'" v-bind="side === 'left' || side === 'right' ? { delayDuration: 250, skipDelayDuration: 300, disableHoverableContent: true } : { style: 'display: contents' }">
    <div ref="tray" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-floating-button-group__group', `mc-floating-button-group__${variant}`, `mc-floating-button-group__${size}`, vertical && 'mc-floating-button-group__vertical', $attrs.class as string | undefined)" role="toolbar" :aria-label="label" :aria-orientation="orientation" :data-variant="variant" @keydown="onKeydown" @focusout="onBlur">
      <span ref="highlight" class="mc-floating-button-group__highlight" :data-pressing="pressing && activeId ? '' : undefined" aria-hidden="true" />
      <template v-for="(item, position) in items" :key="isAction(item) ? item.id : ((item as FloatingButtonGroupSeparator).id ?? `separator-${position}`)">
        <span v-if="!isAction(item)" :class="cn('mc-floating-button-group__separator', classNames?.separator)" role="separator" :aria-orientation="vertical ? 'horizontal' : 'vertical'" />
        <FloatingButtonGroupItem v-else :action="item" />
      </template>
    </div>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Separate soft buttons in a quiet tray, with real gaps between them. The tray always keeps its natural size and never wraps or clips its buttons. The buttons stay transparent: one shared highlight
   moves underneath their content, so there is only ever one moving surface. Corners are concentric with the tray. */
.mc-floating-button-group__group {
  --fbg-h: 36px; --fbg-pad: 4px; --fbg-gap: 4px; --fbg-pad-x: 12px;
  --fbg-outer: var(--radius-control);
  --fbg-radius: calc(var(--fbg-outer) - var(--fbg-pad) - 1px);
  --fbg-highlight: color-mix(in oklab, var(--foreground) 7%, transparent);
  --fbg-highlight-press: color-mix(in oklab, var(--foreground) 12%, transparent);
  --fbg-on: color-mix(in oklab, var(--control-on) 12%, transparent);
  --fbg-rule: color-mix(in oklab, var(--foreground) 12%, transparent);
  /* The muted tray is a translucent tint, not --surface-muted, so it still reads when it sits on a muted surface. */
  --fbg-tray: color-mix(in oklab, var(--foreground) 4.5%, transparent);
  --fbg-tray-edge: color-mix(in oklab, var(--foreground) 3%, transparent);
  position: relative; isolation: isolate; display: inline-flex; flex: none; flex-wrap: nowrap; align-items: center; gap: var(--fbg-gap); padding: var(--fbg-pad); border: 1px solid var(--fbg-tray-edge); border-radius: var(--fbg-outer); background: var(--fbg-tray); color: var(--text-secondary); font-family: var(--font-body); letter-spacing: var(--tracking-body); -webkit-tap-highlight-color: transparent;
}
.mc-floating-button-group__sm { --fbg-h: 30px; --fbg-pad: 3px; --fbg-gap: 3px; --fbg-pad-x: 10px; --fbg-outer: calc(var(--radius-control) - 3px); }
.mc-floating-button-group__md { --fbg-h: 36px; }
/* Raised for overlays such as a selection toolbar: the floating layer shadow and a hairline edge. */
.mc-floating-button-group__floating { border-color: var(--border); background: var(--surface-raised); box-shadow: var(--shadow-floating); }
.mc-floating-button-group__vertical { flex-direction: column; align-items: stretch; }
:root[data-theme="dark"] .mc-floating-button-group__group {
  --fbg-highlight: color-mix(in oklab, var(--foreground) 9%, transparent);
  --fbg-highlight-press: color-mix(in oklab, var(--foreground) 15%, transparent);
  --fbg-on: color-mix(in oklab, var(--control-on) 16%, transparent);
  --fbg-tray: color-mix(in oklab, var(--foreground) 6%, transparent);
  --fbg-tray-edge: color-mix(in oklab, var(--foreground) 5%, transparent);
}

/* The highlight paints above the buttons' own backgrounds (a pressed tint) and below their content. */
.mc-floating-button-group__highlight { position: absolute; z-index: 1; top: 0; left: 0; border-radius: var(--fbg-radius); background: var(--fbg-highlight); pointer-events: none; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-floating-button-group__highlight[data-pressing] { background: var(--fbg-highlight-press); transition-duration: var(--duration-instant); }

/* Buttons are not positioned, so the highlight measures them against the tray and stacks above their background. */
.mc-floating-button-group__item { display: inline-flex; min-width: var(--fbg-h); height: var(--fbg-h); flex: none; align-items: center; justify-content: center; margin: 0; padding: 0 var(--fbg-pad-x); border: 0; border-radius: var(--fbg-radius); background: transparent; color: inherit; font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: 1; white-space: nowrap; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
.mc-floating-button-group__sm .mc-floating-button-group__item { font-size: var(--text-xs); }
.mc-floating-button-group__item[data-icon]:not([data-icon-only]) { padding-left: calc(var(--fbg-pad-x) - 2px); }
.mc-floating-button-group__item[data-icon-only] { width: var(--fbg-h); padding: 0; }
.mc-floating-button-group__item[data-active], .mc-floating-button-group__item[aria-pressed="true"] { color: var(--foreground); }
.mc-floating-button-group__item[aria-pressed="true"] { background: var(--fbg-on); }
.mc-floating-button-group__item[aria-disabled="true"] { color: var(--text-muted); cursor: not-allowed; opacity: .5; }
.mc-floating-button-group__vertical .mc-floating-button-group__item:not([data-icon-only]) { justify-content: flex-start; }
.mc-floating-button-group__vertical .mc-floating-button-group__item[data-icon-only] { align-self: center; }

/* Ghosts of every label share one grid cell with the visible one, so the slot always has the widest label's width. */
.mc-floating-button-group__slot { position: relative; z-index: 2; display: inline-grid; align-items: center; justify-items: center; }
.mc-floating-button-group__slot > * { grid-area: 1 / 1; }
.mc-floating-button-group__vertical .mc-floating-button-group__slot { justify-items: start; }
.mc-floating-button-group__ghost { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; visibility: hidden; pointer-events: none; }
.mc-floating-button-group__iconSpace { display: block; width: 16px; height: 16px; flex: none; }
.mc-floating-button-group__phase { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.mc-floating-button-group__icon { display: inline-flex; flex: none; }
.mc-floating-button-group__icon svg { width: 16px; height: 16px; stroke-width: 1.75; }
.mc-floating-button-group__text { display: block; }

.mc-floating-button-group__separator { flex: none; align-self: center; width: 1px; height: calc(var(--fbg-h) * .5); margin-inline: 2px; border-radius: 1px; background: var(--fbg-rule); }
.mc-floating-button-group__vertical .mc-floating-button-group__separator { width: calc(var(--fbg-h) * .5); height: 1px; margin: 2px 0; }

.mc-floating-button-group__tip { display: inline-flex; align-items: baseline; gap: var(--space-3); white-space: nowrap; }
.mc-floating-button-group__kbd { font: inherit; color: color-mix(in oklab, var(--background) 58%, var(--foreground)); font-variant-numeric: tabular-nums; }

/* Side tooltips for a column match the library tooltip, rising a few pixels away from the rail instead of up. */
.mc-floating-button-group__sideTip { --tip-x: -3px; z-index: 90; max-width: 15rem; padding: var(--space-3) var(--space-4); border: 1px solid color-mix(in oklab, var(--background) 14%, var(--foreground)); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); box-shadow: var(--shadow-raised); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 400; letter-spacing: var(--tracking-body); line-height: var(--leading-body); transform-origin: var(--radix-tooltip-content-transform-origin); transition: opacity var(--duration-fast) var(--ease-enter), transform var(--duration-fast) var(--ease-enter); }
.mc-floating-button-group__sideTip[data-side="left"] { --tip-x: 3px; }
@starting-style {
  .mc-floating-button-group__sideTip[data-state$="-open"] { opacity: 0; transform: translateX(var(--tip-x)) scale(.97); }
}
/* Radix unmounts when the exit animation ends, so a no-op keyframe times the exit while the transition does the visual work. */
.mc-floating-button-group__sideTip[data-state="closed"] { opacity: 0; transform: scale(.98); transition: opacity 110ms var(--ease-standard), transform 110ms var(--ease-standard); animation: mc-floating-button-group-side-tip-exit 110ms linear both; }
@keyframes mc-floating-button-group-side-tip-exit { to { --side-tip-exit: 1; } }

@media (prefers-reduced-motion: reduce) {
  .mc-floating-button-group__item, .mc-floating-button-group__highlight { transition: color var(--duration-instant) linear, background-color var(--duration-instant) linear, opacity var(--duration-instant) linear; }
  .mc-floating-button-group__sideTip, .mc-floating-button-group__sideTip[data-state="closed"] { transform: none; transition: opacity 90ms linear; }
}
</style>
