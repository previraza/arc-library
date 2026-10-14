<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref } from "vue";
import { CircleAlert } from "lucide-vue-next";
import { playPose, popOut } from "@/lib/motion-dom";
import { createReveal, textPoses } from "@/lib/inline-edit";

/** A message row that opens and closes its height on a spring while the words rise in, so an error never pushes the page in one frame. */
const props = defineProps<{ id: string; message: { key: string; tone: "error" | "failed"; text: string } | null; reduced: boolean }>();
const emit = defineEmits<{ retry: [] }>();
const host = ref<HTMLElement>();
const inner = ref<HTMLElement>();
let stop: (() => void) | undefined;
onMounted(() => (stop = createReveal(host.value!, inner.value!, props.reduced)));
onBeforeUnmount(() => stop?.());
const enter = (el: Element, done: () => void) => { const poses = textPoses(el as HTMLElement, 1, props.reduced); void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done); };
const leave = (el: Element, done: () => void) => { const poses = textPoses(el as HTMLElement, 1, props.reduced); popOut(el as HTMLElement); void playPose(el, poses.rest, poses.out, poses.leaveTiming).finished.then(done); };
</script>

<template>
  <span ref="host" class="mc-inline-edit__reveal">
    <span :id="id" ref="inner" class="mc-inline-edit__revealInner" aria-live="polite">
      <Transition :css="false" @enter="enter" @leave="leave">
        <span v-if="message" :key="message.key" class="mc-inline-edit__message" :data-tone="message.tone">
          <CircleAlert class="mc-inline-edit__messageIcon" :size="14" :stroke-width="2" aria-hidden="true" />
          <span v-if="message.tone === 'error'">{{ message.text }}</span>
          <span v-else>{{ message.text }} <button type="button" class="mc-inline-edit__retry" @click="emit('retry')">Try again</button></span>
        </span>
      </Transition>
    </span>
  </span>
</template>
