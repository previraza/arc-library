<script setup lang="ts">
// @manicat-dependencies reka-ui
import { inject } from "vue";
import { TabsTrigger } from "reka-ui";
import { tabsKey } from "@/lib/tabs-motion";
import type { TabsState } from "@/lib/tabs-motion";

defineOptions({ inheritAttrs: false });

const props = defineProps<{ value: string; disabled?: boolean }>();
const state = inject<TabsState>(tabsKey)!;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
</script>

<template>
  <!-- The highlight is one box that the tab list moves into the active trigger, so it glides between triggers. -->
  <TabsTrigger v-bind="{ ...$attrs, class: undefined }" :value="props.value" :disabled="props.disabled" :data-value="props.value" :class="cn('mc-tabs__trigger', $attrs.class as string | undefined, state.classNames()?.trigger)">
    <span :class="cn('mc-tabs__triggerLabel', state.classNames()?.triggerLabel)"><slot /></span>
  </TabsTrigger>
</template>
