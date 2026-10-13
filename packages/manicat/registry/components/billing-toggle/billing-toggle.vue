<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from "vue";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface BillingToggleOption {
  value: string;
  label: string;
  /** Short savings note, e.g. "Save 20%". */
  badge?: string;
  /** Badge text once this option is selected, e.g. "You save $48". Defaults to `badge`. */
  activeBadge?: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options?: BillingToggleOption[];
    /** Accessible name of the group. */
    label?: string;
    size?: "md" | "lg";
    /** Extend the inner, named parts of the toggle: thumb, thumbStatic, option, content, label, badge, swap or swapText. */
    classNames?: { thumb?: string; thumbStatic?: string; option?: string; content?: string; label?: string; badge?: string; swap?: string; swapText?: string };
  }>(),
  { options: () => [{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly", badge: "Save 20%" }], label: "Billing period", size: "md" },
);

/** `v-model` binds the value of the chosen option. */
const value = defineModel<string>({ required: true });
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const root = ref<HTMLElement>();
const thumbEl = ref<HTMLElement>();
const buttons = ref<HTMLElement[]>([]);
const thumb = ref<{ x: number; width: number } | null>(null);
let observer: ResizeObserver | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const selectedIndex = computed(() => Math.max(0, props.options.findIndex((option) => option.value === value.value)));

function measure() {
  const node = buttons.value[selectedIndex.value];
  if (!node) return;
  const current = thumb.value;
  if (!(current && current.x === node.offsetLeft && current.width === node.offsetWidth)) thumb.value = { x: node.offsetLeft, width: node.offsetWidth };
}
onMounted(() => {
  measure();
  if (root.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(measure);
    observer.observe(root.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());
onUpdated(measure);
watch(selectedIndex, () => measure(), { flush: "post" });

// One thumb for the whole track, critically damped: it glides and lands without overshoot.
let placed = false;
watch(thumb, async (next) => {
  if (!next) return;
  await Promise.resolve();
  const el = thumbEl.value;
  if (!el) return;
  if (!placed || reduced) {
    placed = true;
    el.style.transform = `translateX(${next.x}px)`;
    el.style.width = `${next.width}px`;
    return;
  }
  animate(el, { x: next.x, width: next.width } as never, { type: "spring", visualDuration: 0.34, bounce: 0 } as never);
}, { flush: "post" });

function onKeydown(event: KeyboardEvent, index: number) {
  const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
  const target = event.key === "Home" ? 0 : event.key === "End" ? props.options.length - 1 : step ? (index + step + props.options.length) % props.options.length : -1;
  if (target < 0) return;
  event.preventDefault();
  value.value = props.options[target].value;
  buttons.value[target]?.focus();
}

const candidatesOf = (option: BillingToggleOption) => [...new Set([option.badge, option.activeBadge].filter((text): text is string => !!text))];
const badgeOf = (option: BillingToggleOption, selected: boolean) => (selected ? (option.activeBadge ?? option.badge) : option.badge);

// The savings note rewrites itself in place: the new text rises in while the old one lifts away.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterSwap(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.45), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveSwap(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.45), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div ref="root" v-bind="{ ...$attrs, class: undefined }" role="radiogroup" :aria-label="label" :class="cn('mc-billing-toggle__root', $attrs.class as string | undefined)" :data-size="size">
    <span v-if="thumb" ref="thumbEl" :class="cn('mc-billing-toggle__thumb', classNames?.thumb)" aria-hidden="true" />
    <button v-for="(option, index) in options" :key="option.value" :ref="(el) => { if (el) buttons[index] = el as HTMLElement; }" type="button" role="radio" :aria-checked="index === selectedIndex" :tabindex="index === selectedIndex ? 0 : -1" :class="cn('mc-billing-toggle__option', classNames?.option)" :data-selected="index === selectedIndex || undefined" @click="value = option.value" @keydown="onKeydown($event, index)">
      <span v-if="index === selectedIndex && !thumb" :class="cn('mc-billing-toggle__thumbStatic', classNames?.thumbStatic)" aria-hidden="true" />
      <span :class="cn('mc-billing-toggle__content', classNames?.content)">
        <span :class="cn('mc-billing-toggle__label', classNames?.label)">{{ option.label }}</span>
        <span v-if="badgeOf(option, index === selectedIndex)" :class="cn('mc-billing-toggle__badge', classNames?.badge)" :data-active="index === selectedIndex || undefined">
          <!-- Every candidate sits in the same grid cell, so the box always has the width of the longest one. -->
          <span :class="cn('mc-billing-toggle__swap', classNames?.swap)">
            <span v-for="candidate in candidatesOf(option)" :key="candidate" class="mc-billing-toggle__swapSizer" aria-hidden="true">{{ candidate }}</span>
            <Transition :css="false" @enter="enterSwap" @leave="leaveSwap"><span :key="badgeOf(option, index === selectedIndex)" :class="cn('mc-billing-toggle__swapText', classNames?.swapText)">{{ badgeOf(option, index === selectedIndex) }}</span></Transition>
          </span>
        </span>
      </span>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Override --billing-accent on any ancestor to recolor the savings note. */
.mc-billing-toggle__root {
  --_accent: var(--billing-accent, var(--success));
  --_h: 34px;
  --_pad: 3px;
  position: relative;
  isolation: isolate;
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  padding: var(--_pad);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: var(--surface-muted);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-body);
  line-height: 1;
}
.mc-billing-toggle__root[data-size="lg"] { --_h: 42px; --_pad: 4px; font-size: var(--text-base); }

/* One thumb for the whole track. Its position and width are measured from the selected option. */
.mc-billing-toggle__thumb,
.mc-billing-toggle__thumbStatic {
  position: absolute;
  z-index: -1;
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  box-shadow: 0 0 0 1px var(--border-subtle), 0 1px 2px oklch(0% 0 0 / .06), 0 2px 6px oklch(0% 0 0 / .04);
  pointer-events: none;
}
.mc-billing-toggle__thumb { top: var(--_pad); bottom: var(--_pad); left: 0; will-change: transform, width; }
.mc-billing-toggle__thumbStatic { inset: 0; }
:root[data-theme="dark"] .mc-billing-toggle__thumb,
:root[data-theme="dark"] .mc-billing-toggle__thumbStatic {
  box-shadow: 0 0 0 1px var(--border), inset 0 1px 0 oklch(100% 0 0 / .05), 0 1px 2px oklch(0% 0 0 / .3);
}

.mc-billing-toggle__option {
  position: relative;
  display: inline-flex;
  min-width: 0;
  height: var(--_h);
  align-items: center;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard);
  -webkit-tap-highlight-color: transparent;
}
.mc-billing-toggle__option[data-selected] { color: var(--foreground); cursor: default; }
.mc-billing-toggle__option:has(.mc-billing-toggle__badge) { padding-right: 5px; }
.mc-billing-toggle__root[data-size="lg"] .mc-billing-toggle__option { padding-inline: 18px; }
.mc-billing-toggle__root[data-size="lg"] .mc-billing-toggle__option:has(.mc-billing-toggle__badge) { padding-right: 6px; }

@media (hover: hover) and (pointer: fine) {
  .mc-billing-toggle__option:not([data-selected]):hover { color: var(--text-secondary); }
}

.mc-billing-toggle__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform var(--duration-fast) var(--ease-standard);
}
.mc-billing-toggle__option:not([data-selected]):active .mc-billing-toggle__content { transform: scale(.97); }

.mc-billing-toggle__label { font-weight: 500; }

/* The savings note: quiet until its option is chosen, then it takes the accent tint. */
.mc-billing-toggle__badge {
  display: inline-flex;
  height: calc(var(--_h) - 10px);
  align-items: center;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--foreground) 6%, transparent);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard);
}
.mc-billing-toggle__badge[data-active] {
  background: color-mix(in oklab, var(--_accent) 13%, transparent);
  color: color-mix(in oklab, var(--_accent) 88%, var(--foreground));
}
:root[data-theme="dark"] .mc-billing-toggle__badge[data-active] {
  background: color-mix(in oklab, var(--_accent) 18%, transparent);
  color: var(--_accent);
}

/* Stacked swap: every candidate reserves the cell, the visible one crossfades on top. */
.mc-billing-toggle__swap { position: relative; display: inline-grid; justify-items: center; overflow-y: clip; overflow-clip-margin: 2px; }
.mc-billing-toggle__swapSizer { grid-area: 1 / 1; visibility: hidden; }
.mc-billing-toggle__swapText { grid-area: 1 / 1; display: inline-block; }

@media (prefers-reduced-motion: reduce) {
  .mc-billing-toggle__content, .mc-billing-toggle__badge { transition: none; }
}

/* ------------------------------------------------------------------------ Price */

.mc-billing-toggle__price { display: inline-flex; min-width: 0; flex-wrap: wrap; align-items: flex-end; gap: 4px 10px; }
.mc-billing-toggle__amount {
  display: inline-flex;
  align-items: flex-start;
  color: var(--foreground);
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 400;
  letter-spacing: var(--tracking-display);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.mc-billing-toggle__currency { margin-top: .12em; margin-right: .04em; color: var(--text-secondary); font-size: .55em; }
.mc-billing-toggle__counter { display: inline-flex; }
.mc-billing-toggle__counter > span { font: inherit !important; letter-spacing: inherit !important; }
.mc-billing-toggle__aside {
  display: inline-flex;
  align-items: baseline;
  padding-bottom: .3em;
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  white-space: nowrap;
}
.mc-billing-toggle__wasSlot { display: inline-block; overflow-x: clip; }
.mc-billing-toggle__was { display: inline-block; padding-right: 6px; color: var(--text-muted); font-variant-numeric: tabular-nums; text-decoration-thickness: 1px; }
.mc-billing-toggle__period { position: relative; display: inline-block; overflow-x: clip; overflow-clip-margin: 2px; }
.mc-billing-toggle__periodSizer { display: inline-block; visibility: hidden; }
.mc-billing-toggle__periodText { position: absolute; top: 0; left: 0; display: inline-block; }
</style>
