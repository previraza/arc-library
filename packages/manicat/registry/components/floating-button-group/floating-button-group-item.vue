<script setup lang="ts">
// @manicat-dependencies reka-ui
import { computed, inject } from "vue";
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "reka-ui";
import FloatingButtonGroupButton from "@/registry/components/floating-button-group/floating-button-group-button.vue";
import Tooltip from "@/registry/components/tooltip/tooltip.vue";
import { groupKey } from "@/lib/floating-button-group";
import type { GroupContext } from "@/lib/floating-button-group";

/** One button of the group. Tooltips render no wrapper element, so every button stays a direct child of the tray and measures against it. */
const props = defineProps<{ action: { id: string; label: string; icon?: unknown; iconOnly?: boolean; shortcut?: string; disabled?: boolean; pressed?: boolean; reserveLabels?: readonly string[] } }>();
const group = inject<GroupContext>(groupKey)!;
const iconOnly = computed(() => !!props.action.icon && (props.action.iconOnly ?? group.iconOnly()));
const tipped = computed(() => iconOnly.value || !!props.action.shortcut);
const vertical = computed(() => group.side() === "left" || group.side() === "right");
</script>

<template>
  <FloatingButtonGroupButton v-if="!tipped" :action="action" :icon-only="iconOnly" />
  <Tooltip v-else-if="!vertical" :side="group.side() as 'top' | 'bottom'">
    <FloatingButtonGroupButton :action="action" :icon-only="iconOnly" />
    <template #content><span class="mc-floating-button-group__tip">{{ action.label }}<kbd v-if="action.shortcut" class="mc-floating-button-group__kbd">{{ action.shortcut }}</kbd></span></template>
  </Tooltip>
  <TooltipRoot v-else>
    <TooltipTrigger as-child><FloatingButtonGroupButton :action="action" :icon-only="iconOnly" /></TooltipTrigger>
    <TooltipPortal>
      <TooltipContent class="mc-floating-button-group__sideTip" :side="group.side()" :side-offset="10" :collision-padding="12"><span class="mc-floating-button-group__tip">{{ action.label }}<kbd v-if="action.shortcut" class="mc-floating-button-group__kbd">{{ action.shortcut }}</kbd></span></TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
