<script setup lang="ts">
// @manicat-dependencies reka-ui
import { PopoverClose } from "reka-ui";
import type { PopoverCloseProps } from "reka-ui";

defineProps<PopoverCloseProps>();
</script>

<template>
  <PopoverClose v-bind="$props"><slot /></PopoverClose>
</template>
