<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    label?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    locale?: string;
    /** Count up when the counter scrolls into view instead of on mount. */
    animateOnView?: boolean;
    /** Extend the inner, named parts of the counter: label or value. */
    classNames?: { label?: string; value?: string };
  }>(),
  { prefix: "", suffix: "", decimals: 0, locale: "en-US", animateOnView: false },
);

const shown = ref(0);
const root = ref<HTMLElement>();
let frame = 0;
let observer: IntersectionObserver | undefined;

function format(n: number) {
  return `${props.prefix}${n.toLocaleString(props.locale, { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals })}${props.suffix}`;
}

function run(to: number) {
  cancelAnimationFrame(frame);
  const from = shown.value;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return (shown.value = to);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 900);
    shown.value = from + (to - from) * (1 - Math.pow(1 - t, 3));
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

onMounted(() => {
  if (props.animateOnView && root.value && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        run(props.value);
        observer?.disconnect();
      }
    });
    observer.observe(root.value);
  } else run(props.value);
});
watch(() => props.value, run);
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
});

const label = computed(() => `${props.label ? `${props.label}: ` : ""}${format(props.value)}`);
</script>

<template>
  <div ref="root" class="mc-counter" role="group" :aria-label="label">
    <span v-if="props.label" :class="['mc-counter__label', classNames?.label]">{{ props.label }}</span>
    <span :class="['mc-counter__value', classNames?.value]" aria-hidden="true">{{ format(shown) }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-counter { display: grid; gap: 4px; }
.mc-counter__label { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-counter__value { font-size: var(--text-3xl); font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-display); }
</style>
