<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export type InViewTitleVariant = "word" | "line" | "blur" | "tracking" | "wipe";

const props = withDefaults(
  defineProps<{
    text: string;
    variant?: InViewTitleVariant;
    as?: "h1" | "h2" | "h3";
    /** Explicit line breaks for the line variants. */
    lines?: string[];
    /** Reveal once, or every time the title scrolls back into view. */
    once?: boolean;
    /** Extend the inner, named parts of the title: line or piece. */
    classNames?: { line?: string; piece?: string };
  }>(),
  { variant: "blur", as: "h2", once: true },
);

const root = ref<HTMLElement>();
const shown = ref(false);
let observer: IntersectionObserver | undefined;

const pieces = computed(() => (props.variant === "word" ? props.text.split(/\s+/).filter(Boolean) : (props.lines ?? [props.text])));

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === "undefined") return (shown.value = true);
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      shown.value = true;
      if (props.once) observer?.disconnect();
    } else if (!props.once) shown.value = false;
  }, { threshold: 0.35 });
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <component :is="as" ref="root" :class="['mc-title', `mc-title--${variant}`, classNames?.line]" :aria-label="text" :data-shown="shown || undefined">
    <span v-for="(piece, index) in pieces" :key="`${piece}-${index}`" aria-hidden="true" :class="['mc-title__piece', classNames?.piece]" :style="{ '--mc-index': index }">{{ piece }}{{ variant === 'word' ? ' ' : '' }}</span>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-title { margin: 0; font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 600; letter-spacing: var(--tracking-display); line-height: var(--leading-display); text-wrap: balance; }
.mc-title--word .mc-title__piece, .mc-title__piece { display: inline-block; }
.mc-title:not(.mc-title--word) .mc-title__piece { display: block; }
.mc-title__piece { opacity: 0; transform: translateY(.4em); transition: opacity .8s var(--ease-enter) calc(var(--mc-index) * .12s), transform .8s var(--ease-enter) calc(var(--mc-index) * .12s), filter .62s var(--ease-enter) calc(var(--mc-index) * .12s), letter-spacing .8s var(--ease-enter) calc(var(--mc-index) * .12s); }
.mc-title--blur .mc-title__piece { filter: blur(10px); }
.mc-title--tracking .mc-title__piece { letter-spacing: .06em; }
.mc-title--wipe .mc-title__piece { clip-path: inset(0 100% 0 0); transition-property: opacity, transform, clip-path; }
.mc-title[data-shown] .mc-title__piece { opacity: 1; transform: none; filter: none; letter-spacing: inherit; clip-path: inset(0 0 0 0); }
@media (prefers-reduced-motion: reduce) { .mc-title__piece { opacity: 1; transform: none; filter: none; clip-path: none; transition: none; } }
</style>
