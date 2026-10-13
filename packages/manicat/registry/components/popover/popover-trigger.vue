<script setup lang="ts">
// @manicat-dependencies reka-ui
import { PopoverTrigger, useForwardProps } from "reka-ui";
import type { PopoverTriggerProps } from "reka-ui";

/** The trigger anchors the panel, so it opts out of press-scale: a scaled rect measured on open would shift the panel as the trigger springs back. */
const props = defineProps<PopoverTriggerProps & { classNames?: { anchor?: string } }>();
const forwarded = useForwardProps(props);
</script>

<template>
  <PopoverTrigger v-bind="forwarded" :class="['mc-popover__anchor', classNames?.anchor]"><slot /></PopoverTrigger>
</template>
