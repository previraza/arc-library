<script setup lang="ts">
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

withDefaults(
  defineProps<{
    items: BreadcrumbItem[];
    ariaLabel?: string;
    /** Extend the inner, named parts of the breadcrumb: list, crumb or current. */
    classNames?: { list?: string; crumb?: string; current?: string };
  }>(),
  { ariaLabel: "Breadcrumb" },
);

/** Items without an href render a button that emits `select` with the crumb's index, so a router link or a handler fits either way. */
defineEmits<{ select: [index: number] }>();
</script>

<template>
  <nav :aria-label="ariaLabel">
    <ol :class="['mc-breadcrumb', classNames?.list]">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <span v-if="index === items.length - 1" aria-current="page" :data-label="item.label" :class="classNames?.current">{{ item.label }}</span>
        <a v-else-if="item.href" :href="item.href" :data-label="item.label" :class="classNames?.crumb">{{ item.label }}</a>
        <button v-else type="button" :data-label="item.label" :class="classNames?.crumb" @click="$emit('select', index)">{{ item.label }}</button>
        <svg v-if="index < items.length - 1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
      </li>
    </ol>
  </nav>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; margin: 0; padding: 0; list-style: none; }
.mc-breadcrumb li { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); white-space: nowrap; }
.mc-breadcrumb li > svg { width: 16px; height: 16px; flex: 0 0 auto; color: var(--border-strong); stroke-width: 1.75; }
/* Each crumb reserves the width of its medium weight label, so becoming the current page never shifts the path. */
.mc-breadcrumb a, .mc-breadcrumb li > span, .mc-breadcrumb li > button { display: inline-flex; flex-direction: column; border-radius: 7px; padding: 4px 2px; }
.mc-breadcrumb a::after, .mc-breadcrumb li > span::after, .mc-breadcrumb li > button::after { height: 0; overflow: hidden; content: attr(data-label); font-weight: 500; visibility: hidden; user-select: none; pointer-events: none; }
.mc-breadcrumb li > button { border: 0; margin: 0; background: none; font: inherit; line-height: inherit; text-align: start; cursor: pointer; }
.mc-breadcrumb a, .mc-breadcrumb li > button { color: var(--text-secondary); text-decoration: underline 1px; text-decoration-color: transparent; text-underline-offset: 4px; transition: color var(--duration-fast) var(--ease-standard), text-decoration-color var(--duration-fast) var(--ease-standard); }
.mc-breadcrumb [aria-current="page"] { color: var(--accent-strong); font-weight: 500; }
@media (hover: hover) and (pointer: fine) { .mc-breadcrumb a:hover, .mc-breadcrumb li > button:hover { color: var(--accent-strong); text-decoration-color: color-mix(in oklab, currentColor 45%, transparent); } }
@media (prefers-reduced-motion: reduce) { .mc-breadcrumb a, .mc-breadcrumb li > button { transition: none; } }
</style>
