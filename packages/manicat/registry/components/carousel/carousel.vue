<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    /** Number of slides; read it from the slot content when left out. */
    count?: number;
    /** Share of the width each slide takes, as any CSS length, so the next one peeks in. */
    slideSize?: string;
    slideLabel?: (index: number, count: number) => string;
    /** Milliseconds between automatic advances; pauses while hovered or focused. */
    interval?: number;
    autoplay?: boolean;
    /** Extend the inner, named parts of the carousel: viewport, slide or dots. */
    classNames?: { viewport?: string; slide?: string; dots?: string };
  }>(),
  { slideSize: "72%", interval: 5000, autoplay: false },
);

/** `v-model` binds the current slide's index. Give each slide its own element in the default slot. */
const index = defineModel<number>({ default: 0 });
const slots = useSlots();
const viewport = ref<HTMLElement>();
const paused = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const nodes = () => (slots.default?.() ?? []).flatMap((node) => (Array.isArray(node.children) ? (node.children as unknown[]) : [node])).length;
const total = () => props.count ?? nodes();
const labelOf = (at: number) => (props.slideLabel ? props.slideLabel(at, total()) : `Slide ${at + 1} of ${total()}`);

function goTo(next: number) {
  const clamped = Math.max(0, Math.min(total() - 1, next));
  index.value = clamped;
  const slide = viewport.value?.children[clamped] as HTMLElement | undefined;
  slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
}

function onScroll() {
  const box = viewport.value;
  if (!box) return;
  const slide = box.children[0] as HTMLElement | undefined;
  if (!slide) return;
  const at = Math.round(box.scrollLeft / (slide.offsetWidth + 12));
  if (at !== index.value) index.value = at;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowRight") goTo(index.value + 1);
  else if (event.key === "ArrowLeft") goTo(index.value - 1);
  else return;
  event.preventDefault();
}

onMounted(() => {
  if (props.autoplay) timer = setInterval(() => !paused.value && goTo((index.value + 1) % Math.max(1, total())), props.interval);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <section class="mc-carousel" role="group" aria-roledescription="carousel" :aria-label="label" @pointerenter="paused = true" @pointerleave="paused = false" @focusin="paused = true" @focusout="paused = false" @keydown="onKeydown">
    <div ref="viewport" :class="['mc-carousel__viewport', classNames?.viewport]" tabindex="0" :style="{ '--mc-slide': slideSize }" @scroll.passive="onScroll">
      <slot />
    </div>
    <div :class="['mc-carousel__dots', classNames?.dots]">
      <button v-for="at in total()" :key="at" type="button" :aria-label="labelOf(at - 1)" :aria-current="index === at - 1" @click="goTo(at - 1)" />
    </div>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Each direct child of the default slot is a slide. */
.mc-carousel { display: grid; gap: var(--space-3); container-type: inline-size; }
.mc-carousel__viewport { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; outline: none; }
.mc-carousel__viewport::-webkit-scrollbar { display: none; }
.mc-carousel__viewport > * { flex: 0 0 var(--mc-slide, 72%); scroll-snap-align: start; }
.mc-carousel__viewport:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: var(--radius-panel); }
.mc-carousel__dots { display: flex; justify-content: center; gap: 8px; }
.mc-carousel__dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 50%; background: var(--border-strong); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
.mc-carousel__dots button[aria-current="true"] { background: var(--foreground); transform: scale(1.25); }
@media (prefers-reduced-motion: reduce) { .mc-carousel__viewport { scroll-behavior: auto; } .mc-carousel__dots button { transition: none; } }
</style>
