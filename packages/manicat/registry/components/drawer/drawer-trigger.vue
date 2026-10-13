<script setup lang="ts">
// @manicat-dependencies reka-ui
import { DialogTrigger } from "reka-ui";
import type { DialogTriggerProps } from "reka-ui";

defineProps<DialogTriggerProps>();
</script>

<template>
  <DialogTrigger v-bind="$props"><slot /></DialogTrigger>
</template>
