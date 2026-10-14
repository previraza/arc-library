<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AnimatedCounter from "@/registry/components/animated-counter/animated-counter.vue";
import { animateSize, playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** A price that rolls to its new amount. The old price and the period ease their width, so nothing beside them jumps. */
const props = withDefaults(
  defineProps<{
    amount: number;
    currency?: string;
    /** Period after the price, e.g. "per month". Swaps in place when it changes. */
    period?: string;
    /** Previous price, shown struck through when it is higher than `amount`. */
    was?: number;
    decimals?: number;
  }>(),
  { currency: "$", decimals: 0 },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const clip = { type: "spring", visualDuration: 0.36, bounce: 0 } as const;
const showWas = computed(() => props.was !== undefined && props.was > props.amount);
const periodBox = ref<HTMLElement>();
const periodSizer = ref<HTMLElement>();
let placed = false;

// The period box follows the width of its text on a spring; the first measure lands without motion.
function fit() {
  const box = periodBox.value;
  const sizer = periodSizer.value;
  if (!box || !sizer) return;
  const width = sizer.offsetWidth;
  if (!placed || reduced) {
    placed = true;
    box.style.width = `${width}px`;
    return;
  }
  moving = true;
  animate(box, { width: [`${box.offsetWidth}px`, `${width}px`] }, (reduced ? { duration: 0 } : clip) as never).finished.then(() => (moving = false), () => (moving = false));
}
// A font that arrives after the first measure changes the width of the text: the box follows it at once.
let moving = false;
let watcher: ResizeObserver | undefined;
onMounted(() => {
  fit();
  if (periodSizer.value) {
    watcher = new ResizeObserver(() => { if (!moving && periodBox.value && periodSizer.value) periodBox.value.style.width = `${periodSizer.value.offsetWidth}px`; });
    watcher.observe(periodSizer.value);
  }
});
onBeforeUnmount(() => watcher?.disconnect());
watch(() => props.period, () => fit(), { flush: "post" });

const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterWas(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (reduced) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  node.style.width = "0px";
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.standard, ease: "enter" });
  animateSize(node, "width", "open", clip as never).finished.then(done);
}
function leaveWas(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.fast });
  animateSize(el as HTMLElement, "width", "close", clip as never).finished.then(done);
}
function enterPeriod(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.45), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leavePeriod(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.45), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span class="mc-billing-toggle__price">
    <span class="mc-billing-toggle__amount">
      <span class="mc-billing-toggle__currency">{{ currency }}</span>
      <span class="mc-billing-toggle__counter"><AnimatedCounter :value="amount" :decimals="decimals" /></span>
    </span>
    <span class="mc-billing-toggle__aside">
      <Transition :css="false" @enter="enterWas" @leave="leaveWas">
        <span v-if="showWas" key="was" class="mc-billing-toggle__wasSlot"><del class="mc-billing-toggle__was">{{ currency }}{{ was!.toFixed(decimals) }}</del></span>
      </Transition>
      <span v-if="period" ref="periodBox" class="mc-billing-toggle__period">
        <span ref="periodSizer" class="mc-billing-toggle__periodSizer" aria-hidden="true">{{ period }}</span>
        <Transition :css="false" @enter="enterPeriod" @leave="leavePeriod"><span :key="period" class="mc-billing-toggle__periodText">{{ period }}</span></Transition>
      </span>
    </span>
  </span>
</template>
