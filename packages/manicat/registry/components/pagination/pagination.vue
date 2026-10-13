<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    pageCount: number;
    label?: string;
    /** Extend the inner, named parts of the pagination: nav, button or step. */
    classNames?: { nav?: string; button?: string; step?: string };
  }>(),
  { label: "Pagination" },
);

/** `v-model` binds the current page, starting at 1. */
const page = defineModel<number>({ default: 1 });

const total = computed(() => Math.max(0, Math.floor(props.pageCount)));
const current = computed(() => (total.value > 0 ? Math.min(Math.max(1, Math.floor(page.value)), total.value) : 0));
// A window of five pages that follows the current one.
const start = computed(() => (total.value > 0 ? Math.max(1, Math.min(total.value - 4, current.value - 2)) : 1));
const visible = computed(() => Array.from({ length: Math.min(total.value, 5) }, (_, index) => start.value + index));
</script>

<template>
  <nav :class="['mc-pagination', classNames?.nav]" :aria-label="label">
    <button type="button" :class="['mc-pagination__step', classNames?.step]" aria-label="Previous page" :disabled="current <= 1" @click="page = current - 1">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3.5-4.5 4.5L10 12.5" /></svg>
    </button>
    <button
      v-for="number in visible"
      :key="number"
      type="button"
      :class="['mc-pagination__page', classNames?.button]"
      :aria-label="`Page ${number}`"
      :aria-current="current === number ? 'page' : undefined"
      @click="page = number"
    >
      {{ number }}
    </button>
    <button type="button" :class="['mc-pagination__step', classNames?.step]" aria-label="Next page" :disabled="current >= total" @click="page = current + 1">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
    </button>
  </nav>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
.mc-pagination button { display: grid; width: var(--control-height-sm); height: var(--control-height-sm); place-items: center; border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-pagination button[aria-current="page"] { border-color: var(--border); background: var(--surface); color: var(--foreground); box-shadow: var(--shadow-resting); }
.mc-pagination button:disabled { opacity: .4; cursor: not-allowed; }
.mc-pagination .mc-pagination__step:active:not(:disabled) { transform: scale(.96); }
@media (hover: hover) and (pointer: fine) {
  .mc-pagination button:hover:not(:disabled, [aria-current="page"]) { background: var(--surface-muted); color: var(--foreground); }
}
@media (prefers-reduced-motion: reduce) { .mc-pagination button { transition: none; } .mc-pagination .mc-pagination__step:active:not(:disabled) { transform: none; } }
</style>
