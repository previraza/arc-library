<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { followTextHeight } from "@/lib/stepper";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Text that rises in with a small blur when it changes. Its slot springs to the new height, so a message that wraps eases what is below it down instead of pushing it. */
const props = defineProps<{ text?: string; className: string }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const slot = ref<HTMLElement>();
const inner = ref<HTMLElement>();
let follower: ReturnType<typeof followTextHeight> | undefined;

onMounted(() => (follower = followTextHeight(slot.value!, inner.value!, reduced)));
onBeforeUnmount(() => follower?.destroy());
watch(() => props.text, () => follower?.arm(), { flush: "sync" });

const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enter(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return done();
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span ref="slot" class="mc-stepper__slot">
    <span ref="inner" class="mc-stepper__slotInner">
      <Transition :css="false" @enter="enter" @leave="leave"><span v-if="text" :key="`${className}:${text}`" :class="className">{{ text }}</span></Transition>
    </span>
  </span>
</template>
