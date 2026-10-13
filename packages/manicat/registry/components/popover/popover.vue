<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from "vue";

defineProps<{
  /** Extend the inner, named parts of the popover: content. */
  classNames?: { content?: string };
}>();

/** `v-model:open` binds visibility. The `trigger` slot receives `toggle` and `open` to wire to a button. */
const open = defineModel<boolean>("open", { default: false });
const root = ref<HTMLElement>();
const id = useId();

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    open.value = false;
    root.value?.querySelector<HTMLElement>("button")?.focus();
  }
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-popover" @keydown="onKeydown">
    <slot name="trigger" :toggle="() => (open = !open)" :open="open" :aria-controls="id" />
    <div v-if="open" :id="id" role="dialog" :class="['mc-popover__content', classNames?.content]">
      <slot :close="() => (open = false)" />
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-popover { position: relative; display: inline-block; }
.mc-popover__content { position: absolute; z-index: 60; top: calc(100% + 8px); left: 0; width: 16rem; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); font-size: var(--text-sm); box-shadow: var(--shadow-floating); animation: mc-popover-in .18s var(--ease-enter) both; transform-origin: top left; }
@keyframes mc-popover-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-popover__content { animation: none; } }
</style>
