<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

defineProps<{
  title: string;
  description?: string;
  /** Extend the inner, named parts of the dialog: content, header, title, description, close or body. */
  classNames?: { content?: string; header?: string; title?: string; description?: string; close?: string; body?: string };
}>();

/** `v-model:open` binds visibility. The `trigger` slot receives an `open` function to wire to a button. */
const open = defineModel<boolean>("open", { default: false });
const dialog = ref<HTMLDialogElement>();
const id = useId();
let opener: HTMLElement | null = null;

// A native modal dialog gives the focus trap, Escape and the top layer for free.
watch(open, async (value) => {
  await nextTick();
  const node = dialog.value;
  if (!node) return;
  if (value && !node.open) {
    opener = document.activeElement as HTMLElement | null;
    node.showModal();
  } else if (!value && node.open) {
    node.close();
  }
});

function onClose() {
  open.value = false;
  opener?.focus();
}

// A press on the backdrop lands on the dialog element itself, not on anything inside it.
function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false;
}

onBeforeUnmount(() => dialog.value?.open && dialog.value.close());
</script>

<template>
  <slot name="trigger" :open="() => (open = true)" />
  <dialog
    ref="dialog"
    :class="['mc-dialog', classNames?.content]"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="description ? `${id}-description` : undefined"
    @close="onClose"
    @click="onBackdrop"
  >
    <header :class="['mc-dialog__header', classNames?.header]">
      <div>
        <h2 :id="`${id}-title`" :class="['mc-dialog__title', classNames?.title]">{{ title }}</h2>
        <p v-if="description" :id="`${id}-description`" :class="['mc-dialog__description', classNames?.description]">{{ description }}</p>
      </div>
      <button type="button" :class="['mc-dialog__close', classNames?.close]" aria-label="Close" @click="open = false">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
      </button>
    </header>
    <div :class="['mc-dialog__body', classNames?.body]"><slot /></div>
  </dialog>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-dialog { width: min(calc(100vw - var(--space-8)), 440px); max-height: calc(100dvh - var(--space-8)); margin: auto; padding: 0; overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); box-shadow: var(--shadow-floating); }
.mc-dialog::backdrop { background: oklch(10% 0 0 / .46); backdrop-filter: blur(7px); }
.mc-dialog[open] { animation: mc-dialog-in .3s var(--ease-spring, var(--ease-enter)) both; }
.mc-dialog[open]::backdrop { animation: mc-dialog-fade var(--duration-standard) var(--ease-enter) both; }
.mc-dialog:focus { outline: none; }
.mc-dialog__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-5); padding: var(--space-6); border-bottom: 1px solid var(--border); }
.mc-dialog__title { margin: 0; font-family: var(--font-body); font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); }
.mc-dialog__description { margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-dialog__close { display: grid; flex: 0 0 auto; place-items: center; width: var(--space-8); height: var(--space-8); border: 1px solid var(--border); border-radius: var(--radius-control); background: transparent; color: var(--text-muted); cursor: pointer; transition: transform var(--duration-instant) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-dialog__close:active { transform: scale(.96); }
@media (hover: hover) and (pointer: fine) { .mc-dialog__close:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-dialog__body { padding: var(--space-6); }
@keyframes mc-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes mc-dialog-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .mc-dialog[open], .mc-dialog[open]::backdrop { animation: none; } .mc-dialog__close { transition: none; } .mc-dialog__close:active { transform: none; } }
</style>
