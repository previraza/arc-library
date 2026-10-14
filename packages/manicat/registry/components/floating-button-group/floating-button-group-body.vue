<script setup lang="ts">
// @manicat-dependencies motion
import { computed } from "vue";
import { animate } from "motion";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/**
 * Icon and label. Every label the item can show is laid out invisibly in the same grid cell, so the button always has the width
 * of the widest one: a label change crossfades in place and never resizes the button, its neighbours or the tray.
 */
const props = defineProps<{ label: string; icon?: unknown; iconOnly: boolean; reserve: readonly string[]; classNames?: Record<string, string | undefined> }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const ghosts = computed(() => (props.iconOnly ? [] : Array.from(new Set([props.label, ...props.reserve]))));
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: 4, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  el.setAttribute("aria-hidden", "true");
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: -3, blur: blur.soft }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span :class="cn('mc-floating-button-group__slot', 'slot')">
    <span v-for="text in ghosts" :key="text" :class="cn('mc-floating-button-group__ghost', 'ghost')" aria-hidden="true">
      <span v-if="icon" class="mc-floating-button-group__iconSpace" />
      <span :class="cn('mc-floating-button-group__text', 'text')">{{ text }}</span>
    </span>
    <Transition :css="false" @enter="enter" @leave="leave">
      <span :key="label" class="mc-floating-button-group__phase">
        <span v-if="icon" :class="cn('mc-floating-button-group__icon', 'icon')" aria-hidden="true"><component :is="icon as never" /></span>
        <span v-if="!iconOnly" :class="cn('mc-floating-button-group__text', 'text')">{{ label }}</span>
      </span>
    </Transition>
  </span>
</template>
