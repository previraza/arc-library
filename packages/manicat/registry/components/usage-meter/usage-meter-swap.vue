<script setup lang="ts">
// @manicat-dependencies motion
import { playPose, popOut } from "@/lib/motion-dom";
import { risePoses } from "@/lib/usage-meter";

/** Changed text rises from a soft blur and leaves a little faster than it arrives. */
const props = defineProps<{ text: string; direction?: number; classNames?: Record<string, string | undefined> }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const enter = (el: Element, done: () => void) => { const poses = risePoses(el as HTMLElement, props.direction ?? 1, reduced); void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done); };
const leave = (el: Element, done: () => void) => { const poses = risePoses(el as HTMLElement, props.direction ?? 1, reduced); popOut(el as HTMLElement); void playPose(el, poses.rest, poses.out, poses.leaveTiming).finished.then(done); };
</script>

<template>
  <span :class="cn('mc-usage-meter__swap', 'swap')">
    <Transition :css="false" @enter="enter" @leave="leave">
      <span :key="text" :class="cn('mc-usage-meter__swapText', 'swapText')">{{ text }}</span>
    </Transition>
  </span>
</template>
