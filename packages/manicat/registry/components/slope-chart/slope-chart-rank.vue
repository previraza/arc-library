<script setup lang="ts">
// @manicat-dependencies motion
import { computed } from "vue";
import { playPose, popOut } from "@/lib/motion-dom";

/** Rank change arrow: up, down, or level. The number rolls in when it changes. */
const props = defineProps<{ move: number; classNames?: Record<string, string | undefined> }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const text = computed(() => (props.move === 0 ? "=" : `${Math.abs(props.move)}`));
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 0, y: props.move >= 0 ? 6 : -6 }, { opacity: 1, y: 0 }, { spring: "snappy" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0 }, { opacity: 0, y: props.move >= 0 ? -6 : 6 }, { spring: "snappy" }).finished.then(done);
}
</script>

<template>
  <span :class="cn('mc-slope-chart__rank', 'rank')" :data-move="move > 0 ? 'up' : move < 0 ? 'down' : 'level'" aria-hidden="true">
    <svg v-if="move !== 0" width="8" height="8" viewBox="0 0 8 8"><path :d="move > 0 ? 'M4 7V1M1.5 3.5 4 1l2.5 2.5' : 'M4 1v6M1.5 4.5 4 7l2.5-2.5'" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" /></svg>
    <span :class="cn('mc-slope-chart__rankSwap', 'rankSwap')"><Transition :css="false" @enter="enter" @leave="leave"><span :key="text">{{ text }}</span></Transition></span>
  </span>
</template>
