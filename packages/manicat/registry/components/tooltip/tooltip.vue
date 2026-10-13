<script setup lang="ts">
// @manicat-dependencies motion reka-ui
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from "reka-ui";
import { createTooltipText, warmth } from "@/lib/tooltip-motion";

const props = withDefaults(
  defineProps<{
    /** The text of the tooltip. For anything richer, fill the `content` slot. */
    content?: string;
    side?: "top" | "bottom";
    /** Extend the inner, named parts of the tooltip: text or line. */
    classNames?: { text?: string; line?: string };
  }>(),
  { side: "top" },
);

const DELAY = 250;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWarm = ref(warmth.get());
const open = ref(false);
const instant = ref(false);
const host = ref<HTMLElement>();
let text: ReturnType<typeof createTooltipText> | undefined;
let release: (() => void) | undefined;
let unsubscribe: (() => void) | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  unsubscribe = warmth.subscribe(() => (isWarm.value = warmth.get()));
});
onBeforeUnmount(() => {
  unsubscribe?.();
  release?.();
  text?.destroy();
});

// Controlled so the instant flag lands in the same render that mounts the content.
function change(next: boolean) {
  if (next) instant.value = warmth.get();
  open.value = next;
}
watch(open, (value) => {
  release?.();
  release = undefined;
  if (!value) return;
  warmth.opened();
  release = () => warmth.closed();
});

// String content crossfades when it changes while open, and the bubble springs to the new text size.
watch(host, (node) => {
  text?.destroy();
  text = node && props.content !== undefined ? createTooltipText(node, { text: props.content, reduced, classes: { text: cn("mc-tooltip__text", props.classNames?.text), measure: "mc-tooltip__measure", line: cn("mc-tooltip__line", props.classNames?.line) } }) : undefined;
});
watch(() => props.content, (next) => {
  if (next !== undefined) text?.set(next);
});
</script>

<template>
  <TooltipProvider :delay-duration="DELAY" :skip-delay-duration="0">
    <TooltipRoot :open="open" :delay-duration="isWarm ? 0 : DELAY" @update:open="change">
      <TooltipTrigger as-child><slot /></TooltipTrigger>
      <TooltipPortal>
        <TooltipContent class="mc-tooltip__tooltip" :data-instant="instant || undefined" :side="side" :side-offset="8" :collision-padding="12">
          <span v-if="content !== undefined" ref="host" style="display: contents" />
          <slot v-else name="content" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tooltip__tooltip { --tooltip-y: 3px; z-index: 90; max-width: 15rem; padding: var(--space-3) var(--space-4); border: 1px solid color-mix(in oklab, var(--background) 14%, var(--foreground)); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); box-shadow: var(--shadow-raised); font-size: var(--text-sm); font-weight: 400; line-height: var(--leading-body); transform-origin: var(--reka-tooltip-content-transform-origin); transition: opacity var(--duration-fast) var(--ease-enter), transform var(--duration-fast) var(--ease-enter); }
.mc-tooltip__tooltip[data-side="bottom"] { --tooltip-y: -3px; }
/* The first tooltip waits, then rises a few pixels from its trigger. Within the skip window the next one only fades.
   Transitions instead of keyframes, so returning to the trigger while it fades out reverses the fade instead of restarting it. */
@starting-style {
  .mc-tooltip__tooltip[data-state$="-open"] { opacity: 0; transform: translateY(var(--tooltip-y)) scale(.97); }
  .mc-tooltip__tooltip[data-instant][data-state$="-open"] { transform: none; }
}
.mc-tooltip__tooltip[data-instant][data-state$="-open"] { transition: opacity var(--duration-instant) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
/* Radix unmounts when the exit animation ends, so a no-op keyframe times the exit while the transition does the visual work. */
.mc-tooltip__tooltip[data-state="closed"] { opacity: 0; transform: scale(.98); transition: opacity var(--duration-instant) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); animation: mc-tooltip-tooltip-exit var(--duration-instant) linear both; }
.mc-tooltip__text { position: relative; display: block; overflow: clip; overflow-clip-margin: var(--space-2); }
.mc-tooltip__measure { position: absolute; top: 0; left: 0; width: max-content; max-width: calc(15rem - 2 * var(--space-4) - 2px); visibility: hidden; pointer-events: none; }
.mc-tooltip__line { display: block; width: max-content; max-width: calc(15rem - 2 * var(--space-4) - 2px); }
@keyframes mc-tooltip-tooltip-exit { to { --tooltip-exit: 1; } }
@media (prefers-reduced-motion: reduce) {
  .mc-tooltip__tooltip, .mc-tooltip__tooltip[data-state="closed"], .mc-tooltip__tooltip[data-instant][data-state$="-open"] { transform: none; transition: opacity var(--duration-instant) var(--ease-standard); }
}
</style>
