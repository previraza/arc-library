<script setup lang="ts">
// @manicat-dependencies reka-ui
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from "reka-ui";
import type { PopoverContentEmits, PopoverContentProps } from "reka-ui";

const props = withDefaults(defineProps<PopoverContentProps & { classNames?: { content?: string } }>(), { align: "start", sideOffset: 6, collisionPadding: 10 });
const emits = defineEmits<PopoverContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent v-bind="{ ...forwarded, ...$attrs }" :class="['mc-popover__content', classNames?.content]"><slot /></PopoverContent>
  </PopoverPortal>
</template>
