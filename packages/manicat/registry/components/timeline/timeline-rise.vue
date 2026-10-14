<script setup lang="ts">
// @manicat-dependencies motion

import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Text that changes in place: the new value rises in from a soft blur while the old one lifts away a little faster. */
const props = withDefaults(defineProps<{ text: string; direction?: number; classNames?: Record<string, string | undefined> }>(), { direction: 1 });
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3 * props.direction), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3 * props.direction), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span :class="cn('mc-timeline__rise', 'rise')" aria-hidden="true"><Transition :css="false" @enter="enter" @leave="leave"><span :key="text" :class="cn('mc-timeline__riseLine', 'riseLine')">{{ text }}</span></Transition></span>
</template>
