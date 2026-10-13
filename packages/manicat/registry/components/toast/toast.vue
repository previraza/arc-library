<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    /** Milliseconds before it closes itself. Pass 0 to keep it until dismissed. */
    duration?: number;
    /** Extend the inner, named parts of the toast: title, description or close. */
    classNames?: { toast?: string; title?: string; description?: string; close?: string };
  }>(),
  { duration: 4500 },
);

/** `v-model:open` binds visibility. */
const open = defineModel<boolean>("open", { default: true });
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  open,
  (value) => {
    clearTimeout(timer);
    if (value && props.duration) timer = setTimeout(() => (open.value = false), props.duration);
  },
  { immediate: true },
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="mc-toast-region" aria-live="polite">
    <Transition name="mc-toast">
      <div v-if="open" role="status" :class="['mc-toast', classNames?.toast]">
        <div class="mc-toast__copy">
          <span :class="['mc-toast__title', classNames?.title]">{{ title }}</span>
          <span v-if="description" :class="['mc-toast__description', classNames?.description]">{{ description }}</span>
        </div>
        <button type="button" :class="['mc-toast__close', classNames?.close]" aria-label="Dismiss" @click="open = false">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-toast-region { position: fixed; z-index: 100; left: 50%; bottom: var(--space-6); width: min(calc(100vw - var(--space-8)), 26rem); transform: translateX(-50%); pointer-events: none; }
.mc-toast { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-raised); box-shadow: var(--shadow-floating); pointer-events: auto; }
.mc-toast__copy { display: grid; flex: 1; gap: 2px; min-width: 0; }
.mc-toast__title { font-size: var(--text-sm); font-weight: 500; }
.mc-toast__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-toast__close { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-toast__close:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-toast-enter-active { transition: opacity .28s var(--ease-enter), transform .28s var(--ease-enter); }
.mc-toast-leave-active { transition: opacity .16s var(--ease-standard), transform .16s var(--ease-standard); }
.mc-toast-enter-from, .mc-toast-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }
@media (prefers-reduced-motion: reduce) { .mc-toast-enter-active, .mc-toast-leave-active { transition: opacity .12s linear; } .mc-toast-enter-from, .mc-toast-leave-to { transform: none; } }
</style>
