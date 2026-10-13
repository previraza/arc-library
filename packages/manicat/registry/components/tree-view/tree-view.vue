<script setup lang="ts">
import { computed, ref } from "vue";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const props = defineProps<{
  nodes: TreeNode[];
  ariaLabel?: string;
  /** Extend the inner, named parts of the tree: row, chevron or label. */
  classNames?: { row?: string; chevron?: string; label?: string };
}>();

const emit = defineEmits<{ select: [node: TreeNode] }>();
/** `v-model:expanded` binds the ids of the open branches. */
const expanded = defineModel<string[]>("expanded", { default: () => [] });
const selected = ref<string>();

// The tree is flattened into the visible rows, so keyboard focus moves through a plain list.
interface Row {
  node: TreeNode;
  depth: number;
}
const rows = computed(() => {
  const out: Row[] = [];
  const walk = (list: TreeNode[], depth: number) => {
    for (const node of list) {
      out.push({ node, depth });
      if (node.children?.length && expanded.value.includes(node.id)) walk(node.children, depth + 1);
    }
  };
  walk(props.nodes, 0);
  return out;
});

function toggle(node: TreeNode) {
  expanded.value = expanded.value.includes(node.id) ? expanded.value.filter((entry) => entry !== node.id) : [...expanded.value, node.id];
}

function activate(node: TreeNode) {
  selected.value = node.id;
  if (node.children?.length) toggle(node);
  emit("select", node);
}

function onKeydown(event: KeyboardEvent, index: number) {
  const row = rows.value[index];
  const focusRow = (at: number) => (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>("[role=treeitem]")[at]?.focus();
  if (event.key === "ArrowDown") focusRow(Math.min(rows.value.length - 1, index + 1));
  else if (event.key === "ArrowUp") focusRow(Math.max(0, index - 1));
  else if (event.key === "Home") focusRow(0);
  else if (event.key === "End") focusRow(rows.value.length - 1);
  else if (event.key === "ArrowRight" && row.node.children?.length && !expanded.value.includes(row.node.id)) toggle(row.node);
  else if (event.key === "ArrowLeft" && expanded.value.includes(row.node.id)) toggle(row.node);
  else if (event.key === "Enter" || event.key === " ") activate(row.node);
  else return;
  event.preventDefault();
}
</script>

<template>
  <div role="tree" :aria-label="ariaLabel ?? 'File tree'" class="mc-tree">
    <div
      v-for="({ node, depth }, index) in rows"
      :key="node.id"
      role="treeitem"
      :aria-level="depth + 1"
      :aria-expanded="node.children?.length ? expanded.includes(node.id) : undefined"
      :aria-selected="selected === node.id"
      :tabindex="index === 0 ? 0 : -1"
      :class="['mc-tree__row', classNames?.row]"
      :style="{ paddingLeft: `${8 + depth * 16}px` }"
      @click="activate(node)"
      @keydown="onKeydown($event, index)"
    >
      <svg v-if="node.children?.length" :class="['mc-tree__chevron', classNames?.chevron]" :data-open="expanded.includes(node.id) || undefined" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
      <span v-else class="mc-tree__spacer" />
      <slot name="icon" :node="node" />
      <span :class="['mc-tree__label', classNames?.label]">{{ node.label }}</span>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tree { display: grid; gap: 1px; }
.mc-tree__row { display: flex; align-items: center; gap: 6px; min-height: 32px; padding-right: 8px; border-radius: calc(var(--radius-control) - 6px); color: var(--foreground); font-size: var(--text-sm); cursor: pointer; outline: none; }
@media (hover: hover) and (pointer: fine) { .mc-tree__row:hover { background: var(--surface-muted); } }
.mc-tree__row:focus-visible, .mc-tree__row[aria-selected="true"] { background: var(--surface-muted); }
.mc-tree__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform .2s var(--ease-standard); }
.mc-tree__chevron[data-open] { transform: rotate(90deg); }
.mc-tree__spacer { width: 14px; flex: 0 0 auto; }
@media (prefers-reduced-motion: reduce) { .mc-tree__chevron { transition: none; } }
</style>
