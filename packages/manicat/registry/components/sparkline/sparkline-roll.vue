<script setup lang="ts">
// @manicat-dependencies motion
import { animate, motionValue } from "motion";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { amountIn, chunksOf } from "@/lib/sparkline";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

/** Text that changes rolls in place, like a numeric content transition; `morph` springs the wrapper to the new width so nothing beside it jumps. */
const props = defineProps<{ text: string; direction?: number; whole?: boolean; morph?: boolean; tone?: string }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const root = ref<HTMLElement>();
const sizer = ref<HTMLElement>();
let observer: ResizeObserver | undefined;
let shownDirection = 1;
watch(() => props.text, (next, previous) => (shownDirection = props.direction ?? (amountIn(next) < amountIn(previous) ? -1 : 1)), { flush: "sync" });
const numeric = computed(() => !props.whole && !/\p{L}/u.test(props.text));
const chunks = computed(() => chunksOf(props.text, Boolean(props.whole)));

// Layout size, not the transformed rect, so a scaling parent never leaves the text clipped. Only a new text springs; font loads jump.
const width = motionValue<number | "auto">("auto");
width.on("change", (value) => root.value && props.morph && (root.value.style.width = typeof value === "number" ? `${value}px` : value));
onMounted(() => {
  const node = sizer.value;
  if (!node) return;
  let measured: string | null = null;
  observer = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.inlineSize ?? node.offsetWidth;
    if (measured !== null && measured !== node.textContent && !reduced) animate(width as never, next, motionTokens.spring.morph as never);
    else width.jump(next);
    measured = node.textContent;
  });
  observer.observe(node);
});
onBeforeUnmount(() => observer?.disconnect());

// Copy that holds a number enters from the side it moved toward: a larger value rises from below, a smaller one drops from above.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enter(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3 * shownDirection), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3 * shownDirection), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span ref="root" class="mc-sparkline__roll" :data-end="numeric || undefined" :data-whole="whole || undefined">
    <span v-if="morph" ref="sizer" class="mc-sparkline__sizer" aria-hidden="true">{{ text }}</span>
    <!-- One flex item holds the pieces, so they stay inline and the text reads and copies as one string. -->
    <TransitionGroup tag="span" class="mc-sparkline__track" :css="false" @enter="enter" @leave="leave">
      <span v-for="chunk in chunks" :key="chunk.slot" class="mc-sparkline__slot">
        <Transition :css="false" @enter="enter" @leave="leave"><span :key="`${tone ?? ''}${chunk.key}`" :class="tone ? `mc-sparkline__glyph ${tone}` : 'mc-sparkline__glyph'">{{ chunk.text }}</span></Transition>
      </span>
    </TransitionGroup>
  </span>
</template>
