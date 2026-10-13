<script setup lang="ts">
// @manicat-dependencies motion
import { onMounted, ref, watch } from "vue";
import { rolling } from "@/lib/field-message";

/** A count that turns like a counter: a shrinking count drops in from above, a growing one rises from below. */
const props = defineProps<{ value: number }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = ref<HTMLElement>();
let roller: ReturnType<typeof rolling> | undefined;

onMounted(() => (roller = rolling(host.value!, String(props.value), { column: "mc-password-strength__place" }, reduced)));
watch(() => props.value, (next) => roller?.set(String(next)));
</script>

<template>
  <span ref="host" class="mc-password-strength__number" />
</template>
