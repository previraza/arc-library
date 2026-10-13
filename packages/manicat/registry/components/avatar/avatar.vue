<script setup lang="ts">
// @manicat-dependencies motion
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    name: string;
    src?: string;
    size?: "sm" | "md" | "lg" | "xl";
    status?: "online" | "offline";
    /** Extend the inner, named parts of the avatar: fallback. */
    classNames?: { fallback?: string };
  }>(),
  { size: "md" },
);

const initials = computed(() => props.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const image = ref<HTMLImageElement>();
const failedSrc = ref<string>();
const showImage = computed(() => props.src && failedSrc.value !== props.src);

// A photo that is already decoded shows at once. One that is still loading waits, then fades in from a soft blur.
async function markLoading() {
  await nextTick();
  const node = image.value;
  if (node && !node.complete) node.dataset.loading = "";
}
onMounted(markLoading);
watch(() => props.src, markLoading);

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The status dot scales in on a spring and out a little faster.
const dot = { opacity: 0, scale: 0.6 };
const rest = { opacity: 1, scale: 1 };
function enter(el: Element, done: () => void) {
  playPose(el, dot, rest, reduced ? { duration: 0 } : { spring: "snappy" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  playPose(el, rest, dot, { duration: reduced ? 0 : motionTokens.duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <span :class="['mc-avatar__avatar', `mc-avatar__${size}`]" role="img" :aria-label="`${name}${status ? `, ${status}` : ''}`">
    <img
      v-if="showImage"
      :key="src"
      ref="image"
      :src="src"
      alt=""
      style="position: absolute; inset: 0; width: 100%; height: 100%; color: transparent"
      @load="($event.currentTarget as HTMLElement).removeAttribute('data-loading')"
      @error="failedSrc = src"
    />
    <span v-else :class="cn(src ? 'mc-avatar__fallback' : '', classNames?.fallback)" aria-hidden="true">{{ initials }}</span>
    <Transition :css="false" @enter="enter" @leave="leave">
      <i v-if="status" :key="status" :class="['mc-avatar__status', `mc-avatar__${status}`]" aria-hidden="true" />
    </Transition>
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar__avatar {
  position: relative;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  overflow: visible;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-muted);
  color: var(--foreground);
  font-size: var(--text-xs);
  font-weight: 500;
}

.mc-avatar__avatar img {
  pointer-events: none;
  border-radius: inherit;
  object-fit: cover;
  transition: opacity var(--duration-standard) var(--ease-enter), filter var(--duration-standard) var(--ease-enter);
}

/* Set only while a photo is still downloading after mount, so cached photos never fade. */
.mc-avatar__avatar img[data-loading] {
  opacity: 0;
  filter: blur(4px);
  transition: none;
}

.mc-avatar__fallback { animation: mc-avatar-avatar-fallback-in var(--duration-standard) var(--ease-enter) both; }

.mc-avatar__sm { width: 28px; height: 28px; font-size: 10px; }
.mc-avatar__md { width: 36px; height: 36px; }
.mc-avatar__lg { width: 48px; height: 48px; font-size: var(--text-sm); }
.mc-avatar__xl { width: 88px; height: 88px; font-size: var(--text-xl); }

.mc-avatar__status {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 10px;
  height: 10px;
  border: 2px solid var(--surface);
  border-radius: var(--radius-pill);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--border) 70%, transparent);
}

.mc-avatar__sm .mc-avatar__status { width: 8px; height: 8px; border-width: 1.5px; }
.mc-avatar__lg .mc-avatar__status { width: 12px; height: 12px; }
.mc-avatar__xl .mc-avatar__status { width: 14px; height: 14px; right: 4px; bottom: 4px; }
.mc-avatar__online { background: var(--success); }
.mc-avatar__offline { background: var(--text-muted); }

@keyframes mc-avatar-avatar-fallback-in { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .mc-avatar__avatar img { transition: none; }
  .mc-avatar__avatar img[data-loading] { filter: none; }
  .mc-avatar__fallback { animation: none; }
}
</style>
