<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed } from "vue";
import { ChevronRight } from "lucide-vue-next";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Runs when the crumb is chosen. Without an href the crumb renders as a button, for paths that live in local state. */
  onClick?: (event: MouseEvent) => void;
}

const props = withDefaults(
  defineProps<{
    items: BreadcrumbItem[];
    ariaLabel?: string;
    /** Extend the inner, named parts of the breadcrumb: list. */
    classNames?: { list?: string };
  }>(),
  { ariaLabel: "Breadcrumb" },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const path = computed(() => props.items.map((item) => item.label).join("/"));
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// Crumbs present on first render stay still; crumbs added later slide in from the path before them.
const away = { opacity: 0, x: -8, blur: motionTokens.blur.subtle };
const rest = { opacity: 1, x: 0, blur: 0 };
function enter(el: Element, done: () => void) {
  playPose(el, reduced ? { opacity: 0 } : away, rest, reduced ? { duration: 0 } : { duration: motionTokens.duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  playPose(el, rest, reduced ? { opacity: 0 } : { opacity: 0, x: -4, blur: motionTokens.blur.subtle }, { duration: reduced ? 0 : motionTokens.duration.instant, ease: "standard" }).finished.then(done);
}
void path;
</script>

<template>
  <nav :aria-label="ariaLabel">
    <TransitionGroup tag="ol" :css="false" :class="cn('mc-breadcrumb__list', classNames?.list)" @enter="enter" @leave="leave">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <ChevronRight v-if="index > 0" :size="14" aria-hidden="true" />
        <a v-if="index < items.length - 1 && item.href" :href="item.href" :data-label="item.label" @click="item.onClick?.($event)">{{ item.label }}</a>
        <button v-else-if="index < items.length - 1 && item.onClick" type="button" :data-label="item.label" @click="item.onClick($event)">{{ item.label }}</button>
        <span v-else :aria-current="index === items.length - 1 ? 'page' : undefined" :data-label="item.label">{{ item.label }}</span>
      </li>
    </TransitionGroup>
  </nav>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The gap between crumbs matches the gap inside one, so every chevron sits centered between its two labels. */
.mc-breadcrumb__list { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; margin: 0; padding: 0; list-style: none; }
.mc-breadcrumb__list li { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); white-space: nowrap; }
.mc-breadcrumb__list li > svg { width: 16px; height: 16px; flex: 0 0 auto; color: var(--border-strong); stroke-width: 1.75; }
/* Each crumb reserves the width of its medium weight label, so becoming the current page never shifts the path. */
.mc-breadcrumb__list a, .mc-breadcrumb__list li > span, .mc-breadcrumb__list li > button { display: inline-flex; flex-direction: column; border-radius: 7px; padding: 4px 2px; }
.mc-breadcrumb__list a::after, .mc-breadcrumb__list li > span::after, .mc-breadcrumb__list li > button::after { height: 0; overflow: hidden; content: attr(data-label); font-weight: 500; visibility: hidden; user-select: none; pointer-events: none; }
.mc-breadcrumb__list li > button { border: 0; margin: 0; background: none; font: inherit; line-height: inherit; text-align: start; cursor: pointer; }
.mc-breadcrumb__list a, .mc-breadcrumb__list li > button { color: var(--text-secondary); text-decoration: underline 1px; text-decoration-color: transparent; text-underline-offset: 4px; transition: color var(--duration-fast) var(--ease-standard), text-decoration-color var(--duration-fast) var(--ease-standard); }
.mc-breadcrumb__list [aria-current="page"] { color: var(--accent-strong); font-weight: 500; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-breadcrumb__list a:hover, .mc-breadcrumb__list li > button:hover { color: var(--accent-strong); text-decoration-color: color-mix(in oklab, currentColor 45%, transparent); } }
@media (prefers-reduced-motion: reduce) { .mc-breadcrumb__list a, .mc-breadcrumb__list li > button, .mc-breadcrumb__list [aria-current="page"] { transition: none; } }
</style>
