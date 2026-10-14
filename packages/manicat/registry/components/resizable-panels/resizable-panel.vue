<script setup lang="ts">
/** Carries a pane's configuration into `ResizablePanels`. Rendered on its own it shows its children unchanged. */
defineProps<{
  /** Stable id, also used by the dividers' `aria-controls`. */
  id: string;
  /** Names the pane for its divider, for example "Folders". */
  label: string;
  /** Starting share of the group. Shares are relative, so they need not add up to 100. */
  defaultSize: number;
  /** Width in px where the pane starts to resist. Its content never reflows below it; it clips and fades instead. */
  minSize?: number;
  maxSize?: number;
  /** Dragging well past the minimum, or flicking toward the edge, snaps the pane closed. Its divider then shows a restore tab. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}>();
</script>

<template>
  <slot />
</template>
