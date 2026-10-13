<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

defineProps<{
  title: string;
  description?: string;
  closeLabel?: string;
  /** Extend the inner, named parts of the sheet: sheet, handle, header, title, description or body. */
  classNames?: { sheet?: string; handle?: string; header?: string; title?: string; description?: string; body?: string };
}>();

/** `v-model:open` binds visibility. The `trigger` slot receives an `open` function to wire to a button. */
const open = defineModel<boolean>("open", { default: false });
const dialog = ref<HTMLDialogElement>();
const id = useId();
let opener: HTMLElement | null = null;

// A native modal dialog gives the focus trap, Escape and the top layer; the styles turn it into a sheet.
watch(open, async (value) => {
  await nextTick();
  const node = dialog.value;
  if (!node) return;
  if (value && !node.open) {
    opener = document.activeElement as HTMLElement | null;
    node.showModal();
  } else if (!value && node.open) node.close();
});

function onClose() {
  open.value = false;
  opener?.focus();
}

function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false;
}

onBeforeUnmount(() => dialog.value?.open && dialog.value.close());
</script>

<template>
  <slot name="trigger" :open="() => (open = true)" />
  <dialog ref="dialog" :class="['mc-sheet', classNames?.sheet]" :aria-labelledby="`${id}-title`" @close="onClose" @click="onBackdrop">
    <button type="button" :class="['mc-sheet__handle-hit']" :aria-label="closeLabel ?? 'Close'" @click="open = false"><span :class="['mc-sheet__handle', classNames?.handle]" /></button>
    <header :class="['mc-sheet__header', classNames?.header]">
      <h2 :id="`${id}-title`" :class="['mc-sheet__title', classNames?.title]">{{ title }}</h2>
      <p v-if="description" :class="['mc-sheet__description', classNames?.description]">{{ description }}</p>
    </header>
    <div :class="['mc-sheet__body', classNames?.body]"><slot /></div>
  </dialog>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-sheet { width: min(100vw, 32rem); max-width: 100vw; max-height: 85dvh; margin: auto auto 0; padding: 0 0 var(--space-5); overflow: auto; border: 1px solid var(--border); border-bottom: 0; border-radius: 28px 28px 0 0; background: var(--surface); color: var(--foreground); box-shadow: var(--shadow-floating); }
.mc-sheet::backdrop { background: oklch(10% 0 0 / .4); backdrop-filter: blur(6px); }
.mc-sheet[open] { animation: mc-sheet-in .34s var(--ease-enter) both; }
.mc-sheet[open]::backdrop { animation: mc-sheet-fade var(--duration-standard) var(--ease-enter) both; }
.mc-sheet:focus { outline: none; }
.mc-sheet__handle-hit { display: grid; width: 100%; place-items: center; padding: 10px 0; border: 0; background: transparent; cursor: pointer; }
.mc-sheet__handle { width: 40px; height: 4px; border-radius: 2px; background: var(--border-strong); }
.mc-sheet__header { display: grid; gap: 4px; padding: 0 var(--space-5) var(--space-3); }
.mc-sheet__title { margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); }
.mc-sheet__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-sheet__body { display: grid; gap: var(--space-3); padding: 0 var(--space-5); }
@keyframes mc-sheet-in { from { transform: translateY(100%); } to { transform: none; } }
@keyframes mc-sheet-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .mc-sheet[open], .mc-sheet[open]::backdrop { animation: none; } }
</style>
