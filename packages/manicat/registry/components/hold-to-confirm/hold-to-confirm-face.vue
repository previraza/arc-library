<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import type { Component } from "vue";
import { drawPath, playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Icon and label. The button renders it twice: once on the surface and once inside the fill, so the text changes colour exactly at the fill edge. */
defineProps<{ icon: Component; text: string; done: boolean; /** Marks the copy that measures the label. */ measure?: boolean; classNames?: { face?: string; iconSlot?: string; iconPhase?: string; labelFrame?: string; label?: string } }>();

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);

// Scale rides the spring; opacity and blur tween so the blur never overshoots below zero.
function enterIcon(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  playPose(el, { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
  // The tick draws itself from its short stroke, the way a hand would write it.
  const path = el.querySelector("path");
  if (path && el.querySelector("svg[data-check]")) drawPath(path, { reduced, duration: 0.32, ease: "enter", delay: 0.08 });
}
function leaveIcon(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.6, blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
function enterText(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveText(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span :class="cn('mc-hold-to-confirm__face', classNames?.face)">
    <span :class="cn('mc-hold-to-confirm__iconSlot', classNames?.iconSlot)">
      <Transition :css="false" @enter="enterIcon" @leave="leaveIcon">
        <span :key="done ? 'done' : 'idle'" :class="cn('mc-hold-to-confirm__iconPhase', classNames?.iconPhase)">
          <svg v-if="done" data-check width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg>
          <component :is="icon" v-else :stroke-width="1.75" />
        </span>
      </Transition>
    </span>
    <span data-label-frame :class="cn('mc-hold-to-confirm__labelFrame', classNames?.labelFrame)">
      <span v-if="measure" data-measure class="mc-hold-to-confirm__measure">{{ text }}</span>
      <Transition :css="false" @enter="enterText" @leave="leaveText"><span :key="text" :class="cn('mc-hold-to-confirm__label', classNames?.label)">{{ text }}</span></Transition>
    </span>
  </span>
</template>
