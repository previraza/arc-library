<script setup lang="ts">
// @manicat-dependencies motion
import { computed, ref, watch } from "vue";
import TimelineRise from "@/registry/components/timeline/timeline-rise.vue";

/** The day's update count rolls digit by digit in the direction it moved. */
const props = defineProps<{ value: number; classNames?: Record<string, string | undefined> }>();
const direction = ref(1);
watch(() => props.value, (next, previous) => (direction.value = next > previous ? 1 : -1), { flush: "sync" });
const chars = computed(() => [...String(props.value)]);
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
</script>

<template>
  <span :class="cn('mc-timeline__rolling', 'rolling')" aria-hidden="true">
    <span v-for="(char, index) in chars" :key="chars.length - index" :class="cn('mc-timeline__place', 'place')"><TimelineRise :text="char" :direction="direction" :class-names="classNames" /></span>
  </span>
</template>
