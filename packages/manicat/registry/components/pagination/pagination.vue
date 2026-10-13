<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { createFlip, playPose, popOut } from "@/lib/motion-dom";
import { createMark, slot } from "@/lib/pagination";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    pageCount: number;
    label?: string;
    /** Extend the inner, named parts of the pagination: nav. */
    classNames?: { nav?: string };
  }>(),
  { label: "Pagination" },
);

/** `v-model` binds the current page, counting from 1. */
const page = defineModel<number>({ default: 1 });
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration } = motionTokens;
const nav = ref<HTMLElement>();
const mark = ref<HTMLElement>();
let marker: ReturnType<typeof createMark> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const count = computed(() => Math.max(0, Math.floor(props.pageCount)));
const current = computed(() => (count.value > 0 ? Math.min(Math.max(1, Math.floor(page.value)), count.value) : 0));
const start = computed(() => (count.value > 0 ? Math.max(1, Math.min(count.value - 4, current.value - 2)) : 1));
const visible = computed(() => Array.from({ length: Math.min(count.value, 5) }, (_, index) => start.value + index));
// When the five page window shifts, numbers travel like a belt: each one moves by the same number of slots.
let shift = 0;
watch(start, (next, previous) => (shift = next - previous), { flush: "sync" });

const flip = createFlip(() => [...(nav.value?.querySelectorAll<HTMLElement>("[data-page]") ?? [])], { reduced, spring: "smooth" });
onBeforeUpdate(() => flip.measure());
onUpdated(() => {
  flip.play();
  marker?.sync();
});
onMounted(() => {
  if (!nav.value || !mark.value) return;
  marker = createMark(nav.value, mark.value, reduced);
  marker.sync();
});
onBeforeUnmount(() => marker?.destroy());
// The nav only exists once there are pages; it may appear later.
watch(count, () => {
  marker?.destroy();
  marker = undefined;
}, { flush: "pre" });
watch([nav, mark], () => {
  if (marker || !nav.value || !mark.value) return;
  marker = createMark(nav.value, mark.value, reduced);
  marker.sync();
}, { flush: "post" });

const travel = (el: Element) => ((el as HTMLElement).offsetWidth * slot) / 100;
function enter(el: Element, done: () => void) {
  if (reduced) return done();
  const distance = travel(el) * shift;
  playPose(el, { opacity: 0, x: distance }, { opacity: 1, x: 0 }, { spring: "smooth", fade: duration.standard }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  if (reduced) return done();
  const distance = travel(el) * -shift;
  popOut(el as HTMLElement);
  playPose(el, { opacity: 1, x: 0 }, { opacity: 0, x: distance }, { spring: "smooth", fade: duration.instant }).finished.then(done);
}
</script>

<template>
  <nav v-if="!count" :class="cn('mc-pagination__nav', classNames?.nav)" :aria-label="label" />
  <nav v-else ref="nav" :class="cn('mc-pagination__nav', classNames?.nav)" :aria-label="label">
    <button type="button" class="mc-pagination__step" :disabled="current <= 1" aria-label="Previous page" @click="page = current - 1"><ChevronLeft :size="16" aria-hidden="true" /></button>
    <span ref="mark" aria-hidden="true" class="mc-pagination__mark" />
    <TransitionGroup tag="span" style="display: contents" :css="false" @enter="enter" @leave="leave">
      <button v-for="number in visible" :key="number" type="button" data-page :aria-label="`Page ${number}`" :aria-current="current === number ? 'page' : undefined" @click="page = number">{{ number }}</button>
    </TransitionGroup>
    <button type="button" class="mc-pagination__step" :disabled="current >= count" aria-label="Next page" @click="page = current + 1"><ChevronRight :size="16" aria-hidden="true" /></button>
  </nav>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-pagination__nav { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
.mc-pagination__nav button { position: relative; display: grid; width: var(--control-height-sm); height: var(--control-height-sm); place-items: center; border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); font-variant-numeric: tabular-nums; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-pagination__nav button[aria-current="page"] { color: var(--foreground); }
/* One shared mark travels between pages. Before it has measured (server render), the button draws its own. */
.mc-pagination__mark { position: absolute; top: 0; left: 0; width: var(--control-height-sm); height: var(--control-height-sm); box-sizing: border-box; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); box-shadow: var(--shadow-resting); opacity: 0; pointer-events: none; }
.mc-pagination__nav[data-mark-ready] .mc-pagination__mark { opacity: 1; }
.mc-pagination__nav:not([data-mark-ready]) button[aria-current="page"] { border-color: var(--border); background: var(--surface); box-shadow: var(--shadow-resting); }
/* Only the arrows press in. Page numbers move with Motion, so they keep CSS off transform and opacity. */
.mc-pagination__nav .mc-pagination__step { transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-pagination__nav .mc-pagination__step:active:not(:disabled) { transform: scale(.96); transition-duration: var(--duration-fast), var(--duration-fast), var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard), var(--ease-standard), var(--ease-standard), ease-out; }
.mc-pagination__nav button:disabled { opacity: .4; cursor: not-allowed; }
.mc-pagination__nav button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .mc-pagination__nav button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); }
  .mc-pagination__nav[data-mark-ready] button[aria-current="page"]:hover { background: transparent; }
}
@media (prefers-reduced-motion: reduce) { .mc-pagination__nav button, .mc-pagination__nav .mc-pagination__step { transition: none; } .mc-pagination__nav .mc-pagination__step:active:not(:disabled) { transform: none; } }
</style>
