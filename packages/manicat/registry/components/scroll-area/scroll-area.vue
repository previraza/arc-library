<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    orientation?: "vertical" | "horizontal" | "both";
    /** Height at which the content starts to scroll, as any CSS length. */
    maxHeight?: string | number;
    /** Size in pixels of the fade that hints there is more content past an edge. */
    fade?: number;
    label?: string;
    /** Extend the inner, named parts of the area: viewport. */
    classNames?: { viewport?: string };
  }>(),
  { orientation: "vertical", fade: 24 },
);

const emit = defineEmits<{ edgeChange: [edges: { top: boolean; bottom: boolean; left: boolean; right: boolean }] }>();
const viewport = ref<HTMLElement>();
const edges = ref({ top: false, bottom: false, left: false, right: false });
let observer: ResizeObserver | undefined;

// An edge is "open" when there is more content beyond it, which is where the fade shows.
function measure() {
  const node = viewport.value;
  if (!node) return;
  edges.value = {
    top: node.scrollTop > 1,
    bottom: node.scrollTop + node.clientHeight < node.scrollHeight - 1,
    left: node.scrollLeft > 1,
    right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
  };
  emit("edgeChange", edges.value);
}

onMounted(() => {
  measure();
  if (viewport.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(measure);
    observer.observe(viewport.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div
    ref="viewport"
    role="region"
    tabindex="0"
    :aria-label="label"
    :class="['mc-scroll', `mc-scroll--${orientation}`, classNames?.viewport]"
    :data-top="edges.top || undefined"
    :data-bottom="edges.bottom || undefined"
    :data-left="edges.left || undefined"
    :data-right="edges.right || undefined"
    :style="{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight, '--mc-fade': `${props.fade}px` }"
    @scroll.passive="measure"
  >
    <slot />
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-scroll { overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; outline: none; }
.mc-scroll--vertical { overflow-x: hidden; } .mc-scroll--horizontal { overflow-y: hidden; }
.mc-scroll[data-top], .mc-scroll[data-bottom] { --mc-top: transparent; --mc-bottom: transparent; }
.mc-scroll--vertical[data-bottom]:not([data-top]) { mask-image: linear-gradient(to bottom, black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--vertical[data-top]:not([data-bottom]) { mask-image: linear-gradient(to bottom, transparent, black var(--mc-fade)); }
.mc-scroll--vertical[data-top][data-bottom] { mask-image: linear-gradient(to bottom, transparent, black var(--mc-fade), black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--horizontal[data-right]:not([data-left]) { mask-image: linear-gradient(to right, black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--horizontal[data-left]:not([data-right]) { mask-image: linear-gradient(to right, transparent, black var(--mc-fade)); }
.mc-scroll--horizontal[data-left][data-right] { mask-image: linear-gradient(to right, transparent, black var(--mc-fade), black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
</style>
