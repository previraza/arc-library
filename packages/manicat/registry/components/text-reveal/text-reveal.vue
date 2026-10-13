<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    as?: "h1" | "h2" | "h3" | "p";
    /** Delay before the first word, in seconds. */
    delay?: number;
    /** Extend the inner, named parts of the reveal: line or word. */
    classNames?: { line?: string; word?: string };
  }>(),
  { as: "h2", delay: 0 },
);

const words = computed(() => props.text.split(/\s+/).filter(Boolean));
const root = ref<HTMLElement>();
const shown = ref(false);
let observer: IntersectionObserver | undefined;

// The words rise when the text first scrolls into view.
onMounted(() => {
  if (!root.value || typeof IntersectionObserver === "undefined") return (shown.value = true);
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      shown.value = true;
      observer?.disconnect();
    }
  }, { threshold: 0.3 });
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <component :is="as" ref="root" :class="['mc-reveal', classNames?.line]" :aria-label="text" :data-shown="shown || undefined">
    <span v-for="(word, index) in words" :key="`${word}-${index}`" aria-hidden="true" :class="['mc-reveal__word', classNames?.word]" :style="{ '--mc-delay': `${delay + index * 0.055}s` }">{{ word }}&nbsp;</span>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-reveal { margin: 0; font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; letter-spacing: var(--tracking-display); line-height: var(--leading-display); text-wrap: balance; }
.mc-reveal__word { display: inline-block; opacity: 0; transform: translateY(.45em); filter: blur(4px); transition: opacity .62s var(--ease-enter) var(--mc-delay), transform .62s var(--ease-enter) var(--mc-delay), filter .5s var(--ease-enter) var(--mc-delay); }
.mc-reveal[data-shown] .mc-reveal__word { opacity: 1; transform: none; filter: blur(0); }
@media (prefers-reduced-motion: reduce) { .mc-reveal__word { opacity: 1; transform: none; filter: none; transition: none; } }
</style>
