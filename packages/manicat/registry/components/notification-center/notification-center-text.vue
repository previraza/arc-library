<script setup lang="ts">
// @manicat-dependencies motion
import { computed, useSlots } from "vue";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Text that changes in place: the new words rise in with a soft blur while the old ones leave upward, faster. */
const slots = useSlots();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const text = computed(() => (slots.default?.() ?? []).map((node) => (typeof node.children === "string" ? node.children : "")).join(""));
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  (el as HTMLElement).setAttribute("aria-hidden", "true");
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span class="mc-notification-center__swap"><Transition :css="false" @enter="enter" @leave="leave"><span :key="text" class="mc-notification-center__swapLine">{{ text }}</span></Transition></span>
</template>
