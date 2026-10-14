<script setup lang="ts">
// @manicat-dependencies motion
import { animate, motionValue } from "motion";
import { onBeforeUnmount, ref, watch } from "vue";
import { motionTokens } from "@/lib/motion-tokens";

/** A share that rolls to its new value on a spring and holds its width with tabular figures. */
const props = defineProps<{ value: number; decimals: number }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const shown = motionValue(props.value);
const text = ref(`${props.value.toFixed(props.decimals)}%`);
shown.on("change", (current) => (text.value = `${current.toFixed(props.decimals)}%`));
let run: { stop(): void } | undefined;
watch(() => props.value, (next) => {
  run?.stop();
  if (reduced) return void shown.jump(next);
  run = animate(shown as never, next, motionTokens.spring.smooth as never);
});
onBeforeUnmount(() => run?.stop());
</script>

<template>
  <span>{{ text }}</span>
</template>
