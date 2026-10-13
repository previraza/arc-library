<script setup lang="ts">
import { onBeforeUnmount, ref, useId } from "vue";

withDefaults(
  defineProps<{
    /** The tip. Use the `content` slot for markup. */
    content?: string;
    side?: "top" | "bottom";
    /** Extend the inner, named parts of the tooltip: tooltip. */
    classNames?: { tooltip?: string };
  }>(),
  { side: "top" },
);

const id = useId();
const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

// The first tip waits a beat so brushing past a control stays quiet; leaving hides it at once.
function show(delay = 400) {
  clearTimeout(timer);
  timer = setTimeout(() => (visible.value = true), delay);
}

function hide() {
  clearTimeout(timer);
  visible.value = false;
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <span class="mc-tooltip-root" @pointerenter="show()" @pointerleave="hide" @focusin="show(0)" @focusout="hide" @keydown.esc="hide">
    <span :aria-describedby="visible ? id : undefined"><slot /></span>
    <span v-if="visible" :id="id" role="tooltip" :data-side="side" :class="['mc-tooltip', classNames?.tooltip]">
      <slot name="content">{{ content }}</slot>
    </span>
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tooltip-root { position: relative; display: inline-flex; }
.mc-tooltip { --tooltip-y: 3px; position: absolute; z-index: 90; left: 50%; bottom: calc(100% + 8px); width: max-content; max-width: 15rem; padding: var(--space-3) var(--space-4); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font-size: var(--text-xs); line-height: var(--leading-body); pointer-events: none; transform: translateX(-50%); animation: mc-tooltip-in .16s var(--ease-enter) both; }
.mc-tooltip[data-side="bottom"] { --tooltip-y: -3px; top: calc(100% + 8px); bottom: auto; }
@keyframes mc-tooltip-in { from { opacity: 0; transform: translateX(-50%) translateY(var(--tooltip-y)) scale(.97); } to { opacity: 1; transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .mc-tooltip { animation: none; } }
</style>
