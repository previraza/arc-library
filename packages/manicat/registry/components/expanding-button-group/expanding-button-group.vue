<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Component } from "vue";
import ExpandingButtonGroupItemView from "@/registry/components/expanding-button-group/expanding-button-group-item.vue";
import { hysteresis, metrics } from "@/lib/expanding-button-group";
import type { ExpandingButtonGroupSize } from "@/lib/expanding-button-group";

export type { ExpandingButtonGroupSize };
export type ExpandingButtonGroupTone = "neutral" | "danger";

export interface ExpandingButtonGroupItem {
  /** Stable key for the action. Also the value passed to `action`. */
  id: string;
  /** Visible label once the button expands, and its accessible name at all times. Use a short verb, such as "Archive". */
  label: string;
  /** Icon shown while collapsed. A 16px lucide icon fits; it is sized by the group. */
  icon: Component;
  /** Runs the action. Return false, or reject, to skip the confirmation. A promise keeps the button busy until it settles. */
  onSelect?: () => void | boolean | Promise<void | boolean>;
  /** Past tense word shown in place after the action, such as "Archived". The icon becomes a check for confirmDuration. Omit for actions that open something. */
  doneLabel?: string;
  /** "danger" colors the expanded state with the danger token, for destructive actions such as Delete. */
  tone?: ExpandingButtonGroupTone;
  /** Dimmed and inert. Stays focusable and still reveals its label, so people can learn what it would do. */
  disabled?: boolean;
}

/**
 * A compact pill of icon buttons for actions. One action always shows its label; the one you point at or focus takes over the
 * label while its neighbours slide aside, and an action can confirm in place: the icon draws a check and the label becomes a past tense word.
 * On touch, the first tap reveals the label and a second tap runs the action.
 */
const props = withDefaults(
  defineProps<{
    items: readonly ExpandingButtonGroupItem[];
    /** Accessible name of the toolbar, such as "Message actions". */
    label: string;
    size?: ExpandingButtonGroupSize;
    /** Id of the action whose label shows at rest, usually the primary one. Defaults to the first enabled action: one action is always
     *  expanded. Pointing at or focusing another moves the expansion there, and it returns here when the pointer and focus leave. */
    defaultExpanded?: string | null;
    /** How long the confirmation stays, in milliseconds. */
    confirmDuration?: number;
    /** Extend the inner, named parts of the expanding button group: group, item, icon, glyph, label, word, sizer, srOnly. */
    classNames?: { group?: string; item?: string; icon?: string; glyph?: string; label?: string; word?: string; sizer?: string; srOnly?: string };
  }>(),
  { size: "md", defaultExpanded: null, confirmDuration: 1400 },
);

/** Emitted with the item id whenever an action runs, before its own `onSelect`. */
const emit = defineEmits<{ action: [id: string] }>();
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

const root = ref<HTMLElement>();
const intent = ref<string | null>(null);
const done = ref<{ id: string; seq: number } | null>(null);
const busy = ref<string | null>(null);
const announcement = ref("");
const focused = ref<string | null>(null);

// Plain values mirror what the pointer and keyboard are doing right now, so leave and blur handlers can fall back correctly.
let pointerOver: string | null = null;
let pointerAt: { x: number; y: number } | null = null;
let keyFocus: string | null = null;
let touchOpen: string | null = null;
let press: { id: string; kind: string; wasExpanded: boolean } | null = null;
let doneRef: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let mounted = true;
let seq = 0;

onMounted(() => { mounted = true; });
onBeforeUnmount(() => { mounted = false; if (timer) clearTimeout(timer); });

const has = (id: string | null) => !!id && props.items.some((item) => item.id === id);
// One action is always expanded: the resting one is defaultExpanded, else the first enabled action.
const firstEnabled = computed(() => props.items.find((item) => !item.disabled)?.id ?? props.items[0]?.id ?? null);
const restId = computed(() => (has(props.defaultExpanded) ? props.defaultExpanded : firstEnabled.value));
const expandedId = computed(() => (has(intent.value) ? intent.value : restId.value));
const tabStop = computed(() => (has(focused.value) ? focused.value : restId.value));

// A tap outside closes a label opened by a first tap.
watch(intent, (value, _before, onCleanup) => {
  if (!value || touchOpen !== value) return;
  const onDown = (event: PointerEvent) => {
    if (root.value?.contains(event.target as Node)) return;
    touchOpen = null;
    intent.value = doneRef ?? keyFocus;
  };
  document.addEventListener("pointerdown", onDown, true);
  onCleanup(() => document.removeEventListener("pointerdown", onDown, true));
});

function confirm(item: ExpandingButtonGroupItem) {
  if (timer) clearTimeout(timer);
  seq += 1;
  doneRef = item.id;
  done.value = { id: item.id, seq };
  // A zero width space alternates so the same word is announced again on a repeat action.
  announcement.value = `${item.doneLabel}${seq % 2 ? "" : "​"}`;
  timer = setTimeout(() => {
    doneRef = null;
    done.value = null;
    // Collapse unless the pointer or the keyboard is still on it.
    if (pointerOver !== item.id && keyFocus !== item.id) {
      if (touchOpen === item.id) touchOpen = null;
      if (intent.value === item.id) intent.value = pointerOver ?? keyFocus;
    }
  }, props.confirmDuration);
}

async function activate(item: ExpandingButtonGroupItem) {
  if (item.disabled || busy.value === item.id || doneRef === item.id) return;
  intent.value = item.id;
  emit("action", item.id);
  let result: void | boolean;
  try {
    const pending = item.onSelect?.();
    if (pending instanceof Promise) {
      busy.value = item.id;
      result = await pending;
    } else result = pending;
  } catch {
    result = false;
  } finally {
    if (mounted && busy.value === item.id) busy.value = null;
  }
  if (!mounted || result === false || !item.doneLabel) return;
  confirm(item);
}

const onItemPointerDown = (item: ExpandingButtonGroupItem, event: PointerEvent) => {
  press = { id: item.id, kind: event.pointerType, wasExpanded: expandedId.value === item.id };
};

const onItemClick = (item: ExpandingButtonGroupItem) => {
  const last = press;
  press = null;
  // Touch has no hover: the first tap opens the label, the second runs it. An item already showing its label runs at once.
  if (last && last.id === item.id && last.kind === "touch" && !last.wasExpanded) {
    touchOpen = item.id;
    intent.value = item.id;
    return;
  }
  if (last?.kind === "touch") touchOpen = item.id;
  void activate(item);
};

const onItemFocus = (item: ExpandingButtonGroupItem, event: FocusEvent) => {
  focused.value = item.id;
  // Only keyboard focus expands; a mouse click or a tap already has its own path, and would otherwise leave the label open.
  let visible = true;
  try { visible = (event.currentTarget as HTMLElement).matches(":focus-visible"); } catch { /* older engines expand on any focus */ }
  if (!visible) return;
  keyFocus = item.id;
  intent.value = item.id;
};

const onBlur = (event: FocusEvent) => {
  if (root.value?.contains(event.relatedTarget as Node | null)) return;
  keyFocus = null;
  touchOpen = null;
  intent.value = pointerOver ?? doneRef;
};

// Hover follows real pointer movement only. Expanding moves the buttons, and a button that slides under a resting pointer
// must not take over, or two neighbours could trade places back and forth.
const onPointerMove = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return;
  const at = pointerAt;
  if (at && Math.abs(at.x - event.clientX) < 1 && Math.abs(at.y - event.clientY) < 1) return;
  pointerAt = { x: event.clientX, y: event.clientY };
  const button = (event.target as HTMLElement).closest<HTMLElement>("[data-ebg-item]");
  const id = button?.dataset.id;
  if (!button || !id || id === pointerOver) return;
  // Hysteresis: moving from one action to the next needs the pointer a few pixels inside the new one, so resting on a
  // boundary never flips between them.
  if (pointerOver) {
    const box = button.getBoundingClientRect();
    if (event.clientX < box.left + hysteresis || event.clientX > box.right - hysteresis) return;
  }
  pointerOver = id;
  intent.value = id;
};

const onPointerLeave = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return;
  pointerAt = null;
  pointerOver = null;
  intent.value = doneRef ?? keyFocus;
};

const onKeydown = (event: KeyboardEvent) => {
  const list = Array.from(root.value?.querySelectorAll<HTMLButtonElement>("[data-ebg-item]") ?? []);
  const index = list.findIndex((button) => button === document.activeElement);
  if (index < 0) return;
  const last = list.length - 1;
  const target = event.key === "ArrowRight" ? (index === last ? 0 : index + 1) : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
  if (target < 0) return;
  event.preventDefault();
  list[target].focus();
};

const vars = computed(() => {
  const m = metrics[props.size];
  return { "--ebg-h": `${m.height}px`, "--ebg-icon": `${m.icon}px`, "--ebg-start": `${m.start}px`, "--ebg-gap": `${m.gap}px`, "--ebg-end": `${m.end}px` };
});
</script>

<template>
  <div ref="root" role="toolbar" :aria-label="label" aria-orientation="horizontal" :class="cn('mc-expanding-button-group__group', `mc-expanding-button-group__${size}`, classNames?.group)" :style="vars" @keydown="onKeydown" @focusout="onBlur" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <ExpandingButtonGroupItemView v-for="item in items" :key="item.id" :item="item" :size="size" :expanded="expandedId === item.id" :done="done?.id === item.id" :busy="busy === item.id" :tab-stop="tabStop === item.id" :class-names="classNames" @pointerdown="onItemPointerDown" @click="onItemClick" @focus="onItemFocus" />
    <span :class="cn('mc-expanding-button-group__srOnly', classNames?.srOnly)" role="status" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* A flat pill on the surface. Geometry comes from the component as --ebg-* variables, so the measured widths and the CSS agree. */
.mc-expanding-button-group__group { --ebg-h: 36px; --ebg-icon: 16px; --ebg-start: 10px; --ebg-gap: 7px; --ebg-end: 14px; --ebg-pad: 3px; position: relative; isolation: isolate; display: inline-flex; max-width: 100%; flex: none; align-items: center; gap: 2px; padding: var(--ebg-pad); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); }

/* The box never scales: its width is the animation, so a press answers with the icon and with color. The label overflows to the
   right of the icon and the clipped width reveals it. min-width keeps the spring's settle from pinching a collapsed button. */
.mc-expanding-button-group__item { position: relative; display: inline-flex; height: var(--ebg-h); min-width: var(--ebg-h); flex: none; align-items: center; justify-content: flex-start; gap: var(--ebg-gap); overflow: clip; border: 0; border-radius: var(--radius-pill); padding: 0 0 0 var(--ebg-start); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: 1; letter-spacing: var(--tracking-body); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-standard) var(--ease-standard); }
.mc-expanding-button-group__sm .mc-expanding-button-group__item { font-size: var(--text-xs); }
.mc-expanding-button-group__item[data-expanded] { color: var(--foreground); background: var(--surface-muted); }
.mc-expanding-button-group__item[data-tone="danger"][data-expanded] { color: var(--danger); background: color-mix(in oklab, var(--danger) 10%, var(--surface)); }
/* The confirmation carries its meaning on the check, with a faint tint behind the whole button. */
.mc-expanding-button-group__item[data-state="done"]:not([data-tone="danger"]) { background: color-mix(in oklab, var(--success) 10%, var(--surface)); }
.mc-expanding-button-group__item[data-state="done"]:not([data-tone="danger"]) .mc-expanding-button-group__icon { color: var(--success); }
.mc-expanding-button-group__item[aria-busy="true"] { cursor: progress; }
.mc-expanding-button-group__item[aria-busy="true"] .mc-expanding-button-group__icon { animation: mc-expanding-button-group-busy 1.1s var(--ease-in-out) infinite; }
.mc-expanding-button-group__item[aria-disabled="true"] { cursor: not-allowed; color: var(--text-muted); opacity: .5; }
.mc-expanding-button-group__item[aria-disabled="true"][data-expanded] { background: var(--surface-muted); color: var(--text-secondary); }
:root[data-theme="dark"] .mc-expanding-button-group__item[data-tone="danger"][data-expanded] { background: color-mix(in oklab, var(--danger) 14%, var(--surface)); }
:root[data-theme="dark"] .mc-expanding-button-group__item[data-state="done"]:not([data-tone="danger"]) { background: color-mix(in oklab, var(--success) 14%, var(--surface)); }

.mc-expanding-button-group__icon { position: relative; display: grid; width: var(--ebg-icon); height: var(--ebg-icon); flex: none; place-items: center; transition: transform 320ms var(--ease-spring); }
.mc-expanding-button-group__item:active:not([aria-disabled="true"]) .mc-expanding-button-group__icon { transform: scale(.86); transition-duration: 90ms; transition-timing-function: var(--ease-standard); }
.mc-expanding-button-group__glyph { display: grid; grid-area: 1 / 1; place-items: center; width: 100%; height: 100%; }
.mc-expanding-button-group__glyph svg { width: 100%; height: 100%; stroke-width: 1.75; }

/* Outgoing and incoming words share one cell, so a confirmation crossfades in place while the width springs between them. */
.mc-expanding-button-group__label { display: inline-grid; flex: none; align-items: center; justify-items: start; }
.mc-expanding-button-group__word { grid-area: 1 / 1; white-space: nowrap; }

/* Invisible copies of both words hold the slot at the longer one; they are also what gets measured for the width target. */
.mc-expanding-button-group__sizer { grid-area: 1 / 1; visibility: hidden; pointer-events: none; white-space: nowrap; }

/* Before the first measurement (the server render), the expanded action takes its natural width, which is exactly the width the
   spring later targets, so hydration never moves anything. */
.mc-expanding-button-group__item[data-unmeasured][data-expanded] { width: auto !important; padding-inline-end: var(--ebg-end); }

.mc-expanding-button-group__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }

@keyframes mc-expanding-button-group-busy { 50% { opacity: .45; } }

@media (prefers-reduced-motion: reduce) {
  .mc-expanding-button-group__item { transition: color var(--duration-instant) linear, background-color var(--duration-instant) linear; }
  .mc-expanding-button-group__icon, .mc-expanding-button-group__item:active:not([aria-disabled="true"]) .mc-expanding-button-group__icon { transform: none; transition: none; }
  .mc-expanding-button-group__item[aria-busy="true"] .mc-expanding-button-group__icon { animation: none; opacity: .6; }
}
</style>
