<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { MotionValue } from "motion";
import { createPanelMotion } from "@/lib/expanding-search";

/** The panel shares the field's width value, so on first open it unfolds out of the field; afterwards only its height follows the content. */
const props = defineProps<{ width: MotionValue<number>; reduced: boolean; classNames?: Record<string, string | undefined> }>();
const panel = ref<HTMLElement>();
const body = ref<HTMLElement>();
let stop: (() => void) | undefined;
onMounted(() => (stop = createPanelMotion(panel.value!, body.value!, props.width, props.reduced)));
onBeforeUnmount(() => stop?.());
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
</script>

<template>
  <div ref="panel" :class="cn('mc-expanding-search__panel', 'panel')">
    <div ref="body" :class="cn('mc-expanding-search__body', 'body')"><slot /></div>
  </div>
</template>
