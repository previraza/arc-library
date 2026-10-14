<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref } from "vue";
import { playPose } from "@/lib/motion-dom";
import { createSwapWidth, swapPoses } from "@/lib/sortable-data-table";

/** Text that changes in place. The slot eases to the new width, so the words beside it never jump. */
const props = defineProps<{ value: string; direction: number }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const slot = ref<HTMLElement>();
const inner = ref<HTMLElement>();
let stop: (() => void) | undefined;
onMounted(() => (stop = createSwapWidth(slot.value!, inner.value!, reduced)));
onBeforeUnmount(() => stop?.());

function enter(el: Element, done: () => void) {
  const poses = swapPoses(el as HTMLElement, props.direction, reduced);
  playPose(el, poses.enter, poses.shown, poses.enterTiming).finished.then(done);
}
function leave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  const poses = swapPoses(node, props.direction, reduced);
  // Lifts out of the flow where it stands, so the new text takes its place at once.
  Object.assign(node.style, { position: "absolute", left: `${node.offsetLeft}px`, top: `${node.offsetTop}px`, width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`, margin: "0" });
  playPose(el, poses.shown, poses.gone, poses.leaveTiming).finished.then(done);
}
</script>

<template>
  <span ref="slot" class="mc-sortable-data-table__swap">
    <span ref="inner" class="mc-sortable-data-table__swapInner">
      <Transition :css="false" @enter="enter" @leave="leave">
        <span :key="value" class="mc-sortable-data-table__swapText">{{ value }}</span>
      </Transition>
    </span>
  </span>
</template>
