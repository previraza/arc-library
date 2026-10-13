<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { watch } from "vue";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Counts roll like an odometer: a higher number rises from below, a lower one drops from above. */
const props = defineProps<{ value: number; display?: string }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
let direction = 0;
watch(() => props.value, (next, previous) => (direction = next > previous ? 1 : -1), { flush: "sync" });
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, direction >= 0 ? 0.7 : -0.7), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  (el as HTMLElement).setAttribute("aria-hidden", "true");
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, direction >= 0 ? -0.7 : 0.7), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span class="mc-notification-center__roll"><Transition :css="false" @enter="enter" @leave="leave"><span :key="display ?? String(value)" class="mc-notification-center__rollValue">{{ display ?? value }}</span></Transition></span>
</template>
