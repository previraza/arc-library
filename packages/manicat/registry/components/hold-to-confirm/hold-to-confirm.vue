<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import type { Component } from "vue";
import { Trash2 } from "lucide-vue-next";
import HoldFace from "@/registry/components/hold-to-confirm/hold-to-confirm-face.vue";
import { createHold, createLabelWidth } from "@/lib/hold-to-confirm";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** The instruction and the action, for example “Hold to delete project”. */
    label: string;
    /** Shown once the hold completes, for example “Deleted”. */
    confirmedLabel?: string;
    /** Hold length in milliseconds. */
    duration?: number;
    icon?: Component;
    /** `accent` (default) fills with the selected accent; `danger` is for an irreversible action; `neutral` fills with the foreground. */
    tone?: "accent" | "danger" | "neutral";
    /** Controls the done state. Set it back to false to reset the button; leave it undefined to let the button keep its own state. */
    confirmed?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the button: face, iconSlot, iconPhase, labelFrame, label or fill. */
    classNames?: { face?: string; iconSlot?: string; iconPhase?: string; labelFrame?: string; label?: string; fill?: string };
  }>(),
  { confirmedLabel: "Done", duration: 1200, icon: () => Trash2, tone: "accent" },
);

/** Called once when the hold completes. */
const emit = defineEmits<{ confirm: []; holdChange: [holding: boolean] }>();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const hintId = useId();
const ownDone = ref(false);
const completions = ref(0);
const holding = ref(false);
const done = () => props.confirmed ?? ownDone.value;
const button = ref<HTMLElement>();
const fill = ref<HTMLElement>();
let source: "pointer" | "key" | null = null;
let pointerType = "mouse";
let hold: ReturnType<typeof createHold> | undefined;
let width: ReturnType<typeof createLabelWidth> | undefined;
const text = () => (done() ? props.confirmedLabel : props.label);
const seconds = () => (props.duration / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

function stopHolding() {
  source = null;
  holding.value = false;
  emit("holdChange", false);
  hold?.press(false);
}
function complete() {
  if (!source) return;
  stopHolding();
  if (pointerType === "touch") navigator.vibrate?.(12);
  ownDone.value = true;
  completions.value += 1;
  emit("confirm");
}
/** Starts or resumes the fill from wherever it is, so a quick re-press after letting go carries on instead of starting over. */
function begin(from: "pointer" | "key") {
  if (done() || props.disabled || source) return;
  source = from;
  holding.value = true;
  emit("holdChange", true);
  hold?.press(true);
  hold?.start(props.duration);
}
function release() {
  if (!source) return;
  stopHolding();
  hold?.rewind();
}

onMounted(() => {
  hold = createHold(button.value!, fill.value!, { duration: props.duration, reduced, onComplete: complete });
  width = createLabelWidth(button.value!.querySelector<HTMLElement>("[data-measure]")!, () => [...button.value!.querySelectorAll<HTMLElement>("[data-label-frame]")], reduced);
  if (done()) hold.progress.jump(1);
});
onBeforeUnmount(() => {
  hold?.destroy();
  width?.destroy();
});
// A reset rewinds the fill as the label morphs back; a confirmation the parent declined rewinds too.
watch([done, completions], () => {
  if (!hold) return;
  if (done() && hold.progress.get() < 1 && !source) hold.fillTo(1);
  if (!done() && hold.progress.get() > 0 && !source) hold.rewind();
}, { flush: "post" });

function onPointerdown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  pointerType = event.pointerType;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  begin("pointer");
}
function onPointermove(event: PointerEvent) {
  if (source !== "pointer") return;
  // Sliding well off the button cancels, the way a native press does.
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const slack = 24;
  if (event.clientX < box.left - slack || event.clientX > box.right + slack || event.clientY < box.top - slack || event.clientY > box.bottom + slack) release();
}
function onKeydown(event: KeyboardEvent) {
  if (event.key !== " " && event.key !== "Enter") return;
  event.preventDefault();
  if (!event.repeat) begin("key");
}
function onKeyup(event: KeyboardEvent) {
  if (event.key !== " " && event.key !== "Enter") return;
  event.preventDefault();
  if (source === "key") release();
}
</script>

<template>
  <button v-bind="{ ...attrs, class: undefined }" ref="button" type="button" :class="cn('mc-hold-to-confirm__button', attrs.class as string | undefined)" :data-tone="tone" :data-state="done() ? 'done' : holding ? 'holding' : 'idle'" :disabled="disabled" :aria-disabled="done() || undefined" :aria-label="text()" :aria-describedby="done() ? undefined : hintId" @pointerdown="onPointerdown" @pointermove="onPointermove" @pointerup="release" @pointercancel="release" @lostpointercapture="release" @keydown="onKeydown" @keyup="onKeyup" @blur="release" @contextmenu.prevent>
    <HoldFace :icon="icon" :text="text()" :done="done()" measure :class-names="classNames" />
    <span ref="fill" :class="cn('mc-hold-to-confirm__fill', classNames?.fill)" aria-hidden="true"><HoldFace :icon="icon" :text="text()" :done="done()" :class-names="classNames" /></span>
  </button>
  <span :id="hintId" class="mc-hold-to-confirm__srOnly">{{ `Press and hold for ${seconds()} seconds to confirm. With a keyboard, hold Space or Enter.` }}</span>
  <span class="mc-hold-to-confirm__srOnly" role="status">{{ done() ? confirmedLabel : "" }}</span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The button hugs its label; the fill is a second, inverted copy of the face revealed by clip-path, so the text flips colour exactly at the edge. */
/* The default tone follows the selected accent; danger stays available for a truly irreversible action. */
.mc-hold-to-confirm__button { --hold-ink: var(--foreground); --hold-fill: var(--accent); --hold-on-fill: var(--accent-foreground); --hold-border: var(--border-strong); position: relative; display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; padding: 0 var(--space-5); border: 1px solid var(--hold-border); border-radius: var(--radius-control); background: var(--surface); color: var(--hold-ink); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); cursor: pointer; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
.mc-hold-to-confirm__button[data-tone="danger"] { --hold-ink: var(--danger); --hold-fill: var(--danger); --hold-on-fill: var(--background); --hold-border: color-mix(in oklab, var(--danger) 32%, var(--border)); }
.mc-hold-to-confirm__button[data-tone="neutral"] { --hold-ink: var(--foreground); --hold-fill: var(--foreground); --hold-on-fill: var(--background); --hold-border: var(--border-strong); }
@media (hover: hover) and (pointer: fine) { .mc-hold-to-confirm__button:not(:disabled):not([aria-disabled="true"]):hover { background: color-mix(in oklab, var(--hold-fill) 6%, var(--surface)); } }
.mc-hold-to-confirm__button[aria-disabled="true"] { cursor: default; }
.mc-hold-to-confirm__button:disabled { cursor: not-allowed; opacity: .5; }
.mc-hold-to-confirm__face { display: inline-flex; align-items: center; gap: var(--space-2); white-space: nowrap; }
/* Covers the border too, and keeps its own rounded corners; the clip only ever cuts a straight leading edge. */
.mc-hold-to-confirm__fill { position: absolute; inset: -1px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-control); background: var(--hold-fill); color: var(--hold-on-fill); pointer-events: none; }
.mc-hold-to-confirm__iconSlot { display: grid; width: 18px; height: 18px; flex: none; place-items: center; }
.mc-hold-to-confirm__iconPhase { display: grid; grid-area: 1 / 1; place-items: center; }
.mc-hold-to-confirm__iconPhase svg { width: 18px; height: 18px; }
/* Clips the outgoing label while the frame narrows, with room for the rise and the soft blur. */
.mc-hold-to-confirm__labelFrame { position: relative; display: inline-flex; min-width: 0; clip-path: inset(-.6em -3px); }
.mc-hold-to-confirm__label { display: block; white-space: nowrap; }
.mc-hold-to-confirm__measure { position: absolute; top: 0; left: 0; visibility: hidden; white-space: nowrap; pointer-events: none; }
.mc-hold-to-confirm__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-hold-to-confirm__button { transition: none; } }
</style>
