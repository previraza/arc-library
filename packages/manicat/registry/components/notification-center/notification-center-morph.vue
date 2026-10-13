<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { followWidth } from "@/lib/motion-dom";
import type { WidthFollower } from "@/lib/motion-dom";

/** Follows the width of its content. After `morphKey` changes the width springs from the old size to the new one, so a longer label grows the control instead of snapping it. */
const props = defineProps<{ morphKey: string }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const frame = ref<HTMLElement>();
const content = ref<HTMLElement>();
let follower: WidthFollower | undefined;
onMounted(() => (follower = followWidth(frame.value!, content.value!, reduced)));
onBeforeUnmount(() => follower?.destroy());
watch(() => props.morphKey, () => follower?.arm(), { flush: "sync" });
</script>

<template>
  <span ref="frame" class="mc-notification-center__morph"><span ref="content" class="mc-notification-center__morphContent"><slot /></span></span>
</template>
