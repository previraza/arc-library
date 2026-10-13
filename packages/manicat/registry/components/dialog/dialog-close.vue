<script setup lang="ts">
// @manicat-dependencies reka-ui
import { DialogClose } from "reka-ui";
import type { DialogCloseProps } from "reka-ui";

defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose v-bind="$props"><slot /></DialogClose>
</template>
