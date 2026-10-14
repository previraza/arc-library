<script setup lang="ts">
// @manicat-dependencies motion
import { provide, ref, useAttrs, watch } from "vue";
import { rowEnter, rowLeave, swipeGroupKey, watchOutside } from "@/lib/swipe-actions";
import type { SwipeGroup } from "@/lib/swipe-actions";

defineOptions({ inheritAttrs: false });

/**
 * A list whose rows reveal actions on a horizontal swipe, the way a mail inbox does. Use it for short lists where people triage items quickly.
 * Only one row stays open at a time; touching anywhere else or pressing Escape puts it away. Every row also has a More actions menu with the same
 * actions, so keyboard and screen reader users never need the gesture. Put a `SwipeActionsRow` with its own `key` in the default slot for each item.
 */
const props = defineProps<{
  label: string;
  /** Extend the inner, named parts of the swipe actions: surface or list. */
  classNames?: { surface?: string; list?: string };
}>();

const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

const openId = ref<string | null>(null);
const group: SwipeGroup = {
  openId: () => openId.value,
  open: (id) => { openId.value = id; },
  close: (id) => { if (openId.value === id) openId.value = null; },
  rows: new Map(),
};
provide(swipeGroupKey, group);
watch(openId, (_id, _before, onCleanup) => onCleanup(watchOutside(group, () => (openId.value = null))), { immediate: true });

const enter = (el: Element, done: () => void) => void rowEnter(el as HTMLElement, reduced).finished.then(done);
const leave = (el: Element, done: () => void) => void rowLeave(el as HTMLElement, reduced).finished.then(done);
</script>

<template>
  <div v-bind="{ ...attrs, class: undefined }" :class="cn('mc-swipe-actions__surface', attrs.class as string | undefined, classNames?.surface)">
    <TransitionGroup tag="ul" :css="false" role="list" :aria-label="label" tabindex="-1" :class="cn('mc-swipe-actions__list', classNames?.list)" @enter="enter" @leave="leave">
      <slot />
    </TransitionGroup>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The surface clips every row, so revealed actions never spill past its rounded corners. It hides once the last row has left. */
.mc-swipe-actions__surface { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); transition: border-color var(--duration-standard) var(--ease-standard), background-color var(--duration-standard) var(--ease-standard); }
/* When the last row is on its way out, the frame fades with it instead of leaving a hairline behind. */
.mc-swipe-actions__surface:not(:has(> .mc-swipe-actions__list > .mc-swipe-actions__row:not([data-removing]))) { border-color: transparent; background-color: transparent; }
.mc-swipe-actions__surface:has(> .mc-swipe-actions__list:empty) { display: none; }
/* Pulled down one pixel so the last separator tucks under the frame, instead of toggling with :last-child while rows leave. */
.mc-swipe-actions__list { margin: 0 0 -1px; padding: 0; list-style: none; }
.mc-swipe-actions__list:focus-visible { outline: none; }
.mc-swipe-actions__row { position: relative; isolation: isolate; overflow: hidden; }
/* The content follows the finger by transform only; vertical pans stay with the page. */
.mc-swipe-actions__content { position: relative; z-index: 10; display: flex; min-height: 64px; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4); background: var(--surface); touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.mc-swipe-actions__content::after { position: absolute; right: 0; bottom: 0; left: var(--swipe-actions-inset, var(--space-4)); height: 1px; background: var(--border); content: ""; pointer-events: none; }
.mc-swipe-actions__content img { -webkit-user-drag: none; }
.mc-swipe-actions__body { min-width: 0; flex: 1 1 auto; }
.mc-swipe-actions__more { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border: 0; border-radius: calc(var(--radius-control) - 6px); background: transparent; color: var(--text-muted); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
/* The button anchors a menu, so a press answers with colour, never scale. */
.mc-swipe-actions__more:active, .mc-swipe-actions__more[data-state="open"] { background: var(--surface-muted); color: var(--foreground); }
.mc-swipe-actions__more:focus-visible { outline: none; }
@media (hover: hover) and (pointer: fine) {
  .mc-swipe-actions__content { cursor: grab; }
  .mc-swipe-actions__more:hover { background: var(--surface-muted); color: var(--foreground); }
}
.mc-swipe-actions__row[data-dragging] .mc-swipe-actions__content { cursor: grabbing; }
.mc-swipe-actions__row[data-dragging] .mc-swipe-actions__more { background: transparent; color: var(--text-muted); }

/* Each action spans the full row from the edge it hides behind and slides in by transform. Outer actions stack above inner ones. */
.mc-swipe-actions__layer { position: absolute; top: 0; bottom: 0; width: 100%; padding: 0; border: 0; background: color-mix(in oklab, var(--foreground) 20%, var(--surface)); color: var(--foreground); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-swipe-actions__layer[data-side="trailing"] { left: 100%; }
.mc-swipe-actions__layer[data-side="leading"] { right: 100%; }
.mc-swipe-actions__layer[data-tone="accent"] { background: var(--accent); color: var(--accent-foreground); }
.mc-swipe-actions__layer[data-tone="danger"] { background: var(--danger); color: var(--background); }
.mc-swipe-actions__layer:focus { outline: none; }
.mc-swipe-actions__anchor { position: absolute; top: 0; bottom: 0; width: 0; }
.mc-swipe-actions__layer[data-side="trailing"] .mc-swipe-actions__anchor { left: 0; }
.mc-swipe-actions__layer[data-side="leading"] .mc-swipe-actions__anchor { right: 0; }
.mc-swipe-actions__glyph { position: absolute; top: 0; bottom: 0; left: calc(var(--swipe-action-width) / -2); display: flex; width: var(--swipe-action-width); flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.mc-swipe-actions__icon { display: grid; place-items: center; }
.mc-swipe-actions__icon svg { width: 20px; height: 20px; }
.mc-swipe-actions__label { font-size: var(--text-xs); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); white-space: nowrap; }

/* The menu grows from its trigger, matching the library dropdown. */
.mc-swipe-actions__menu { --menu-x: 0px; --menu-y: -5px; position: relative; z-index: 60; min-width: 11rem; padding: 5px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: var(--reka-dropdown-menu-content-transform-origin); }
.mc-swipe-actions__menu[data-side="top"] { --menu-y: 5px; }
.mc-swipe-actions__menu[data-state="open"] { animation: mc-swipe-actions-menu-fade-in var(--duration-fast) var(--ease-enter) both, mc-swipe-actions-menu-rise-in var(--duration-spring) var(--ease-spring) both; }
.mc-swipe-actions__menu[data-state="closed"] { animation: mc-swipe-actions-menu-out var(--duration-instant) var(--ease-standard) both; }
.mc-swipe-actions__menu[data-state="open"] .mc-swipe-actions__item { animation: mc-swipe-actions-menu-item-in var(--duration-standard) var(--ease-enter) both; animation-delay: calc(min(var(--i, 0), 4) * 35ms); }
.mc-swipe-actions__item { position: relative; display: flex; min-height: 36px; align-items: center; gap: 10px; padding: 0 11px; border-radius: calc(var(--radius-panel) - 6px); color: var(--foreground); font-size: var(--text-sm); cursor: pointer; outline: none; transition: background-color var(--duration-instant) var(--ease-standard); }
.mc-swipe-actions__item[data-highlighted] { background: var(--surface-muted); }
.mc-swipe-actions__item[data-tone="danger"] { color: var(--danger); }
.mc-swipe-actions__item[data-tone="danger"][data-highlighted] { background: color-mix(in oklab, var(--danger) 8%, var(--surface-raised)); }
.mc-swipe-actions__itemIcon { display: inline-flex; width: 17px; color: var(--text-secondary); }
.mc-swipe-actions__itemIcon svg { width: 16px; height: 16px; }
.mc-swipe-actions__item[data-tone="danger"] .mc-swipe-actions__itemIcon { color: var(--danger); }
@keyframes mc-swipe-actions-menu-fade-in { from { opacity: 0; } }
@keyframes mc-swipe-actions-menu-rise-in { from { transform: translate(var(--menu-x), var(--menu-y)) scale(.97); } }
@keyframes mc-swipe-actions-menu-out { to { opacity: 0; transform: translate(calc(var(--menu-x) * .5), calc(var(--menu-y) * .5)) scale(.985); } }
@keyframes mc-swipe-actions-menu-item-in { from { opacity: 0; transform: translate(calc(var(--menu-x) * .4), calc(var(--menu-y) * .4)); } }
@keyframes mc-swipe-actions-menu-fade-out { to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .mc-swipe-actions__surface, .mc-swipe-actions__more, .mc-swipe-actions__item { transition: none; }
  .mc-swipe-actions__menu[data-state="open"] { animation: mc-swipe-actions-menu-fade-in var(--duration-instant) linear both; }
  .mc-swipe-actions__menu[data-state="closed"] { animation: mc-swipe-actions-menu-fade-out var(--duration-instant) linear both; }
  .mc-swipe-actions__menu[data-state="open"] .mc-swipe-actions__item { animation: none; }
}
</style>
