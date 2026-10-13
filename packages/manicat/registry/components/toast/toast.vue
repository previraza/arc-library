<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate } from "motion";
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import { playPose, popOut } from "@/lib/motion-dom";
import { createHeightFrame, createSwipe, throwTiming } from "@/lib/toast";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    /** Milliseconds before it closes itself. Pass 0 to keep it until dismissed. */
    duration?: number;
    /** Extend the inner, named parts of the toast: icon, frame, copy, title, line, description or close. */
    classNames?: { icon?: string; frame?: string; copy?: string; title?: string; line?: string; description?: string; close?: string };
  }>(),
  { duration: 4500 },
);

/** `v-model:open` binds visibility. */
const open = defineModel<boolean>("open", { default: true });
const instance = getCurrentInstance();
const listens = Boolean(instance?.vnode.props?.["onUpdate:open"]);
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const dismissed = ref(false);
const throwX = ref(0);
let releaseVelocity = 0;
const visible = computed(() => open.value && !dismissed.value);
const frame = ref<HTMLElement>();
const content = ref<HTMLElement>();
let heightFrame: ReturnType<typeof createHeightFrame> | undefined;
let swiper: ReturnType<typeof createSwipe> | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

watch(open, (now) => {
  if (now) {
    dismissed.value = false;
    throwX.value = 0;
  }
});

/** Closing tells the parent at once, while the exit plays out here, so a new toast can be raised mid-exit and simply turns back. */
function dismiss(to: number) {
  throwX.value = to;
  dismissed.value = true;
  open.value = false;
}

watch(
  visible,
  (now) => {
    clearTimeout(timer);
    if (!now || !listens || props.duration <= 0) return;
    timer = setTimeout(() => {
      throwX.value = 0;
      dismissed.value = true;
      open.value = false;
    }, props.duration);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  clearTimeout(timer);
  heightFrame?.destroy();
  swiper?.destroy();
});

// The copy column follows its content height, so a longer message grows the toast instead of snapping it.
watch(() => `${props.title}\n${props.description ?? ""}`, () => heightFrame?.changed(), { flush: "post" });

// Toasts rise in from their edge; the check draws itself a moment later.
function enter(el: Element, done: () => void) {
  const node = el as HTMLElement;
  heightFrame = createHeightFrame(frame.value!, content.value!, reduced);
  swiper = createSwipe(node, { reduced: () => reduced, onThrow: (to, velocity) => { releaseVelocity = velocity; dismiss(to); } });
  const path = node.querySelector("path");
  if (path && !reduced) animate(path, { pathLength: [0, 1] }, { duration: duration.standard, ease: [...motionTokens.ease.enter], delay: 0.12 });
  if (reduced) playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  else playPose(node, { opacity: 0, x: 0, y: 16, scale: 0.96 }, { opacity: 1, x: 0, y: 0, scale: 1 }, { spring: "morph", fade: duration.standard }).finished.then(done);
}
// A thrown toast keeps its release velocity; a closed one sinks back toward the edge it came from.
function leave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  swiper?.destroy();
  swiper = undefined;
  heightFrame?.destroy();
  heightFrame = undefined;
  if (reduced) return void animate(node, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  if (throwX.value) return void animate(node, { x: throwX.value, opacity: 0 } as never, throwTiming(releaseVelocity) as never).finished.then(done);
  playPose(node, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: 8, scale: 0.97 }, { duration: duration.exit, ease: "standard" }).finished.then(done);
}

// Changed copy rises in and the old copy lifts away, so the live region reads only the current text.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterText(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveText(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.setAttribute("aria-hidden", "true");
  popOut(node);
  if (reduced) return void playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(node, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <Transition :css="false" appear @enter="enter" @leave="leave">
    <div v-if="visible" key="toast" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-toast__toast', $attrs.class as string | undefined)" role="status" aria-live="polite" aria-atomic="true">
      <span :class="cn('mc-toast__icon', classNames?.icon)" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
      </span>
      <!-- The copy column follows its content height, so a longer message grows the toast instead of snapping it. -->
      <div ref="frame" :class="cn('mc-toast__frame', classNames?.frame)">
        <div ref="content" :class="cn('mc-toast__copy', classNames?.copy)">
          <strong :class="cn('mc-toast__title', classNames?.title)"><Transition :css="false" @enter="enterText" @leave="leaveText"><span :key="title" :class="cn('mc-toast__line', classNames?.line)">{{ title }}</span></Transition></strong>
          <Transition :css="false" @enter="enterText" @leave="leaveText"><span v-if="description" :key="description" :class="cn('mc-toast__description', classNames?.description)">{{ description }}</span></Transition>
        </div>
      </div>
      <button :class="cn('mc-toast__close', classNames?.close)" type="button" aria-label="Dismiss notification" @click="dismiss(0)"><X :width="16" :height="16" :stroke-width="2" aria-hidden="true" /></button>
    </div>
  </Transition>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-toast__toast {
  display: flex;
  width: min(100%, 26rem);
  min-width: 0;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: color-mix(in oklab, var(--surface) 94%, var(--background));
  color: var(--foreground);
  letter-spacing: var(--tracking-body);
  box-shadow: var(--shadow-floating);
}

.mc-toast__icon {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in oklab, var(--success) 24%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--success) 10%, var(--surface));
  color: var(--success);
}

.mc-toast__frame {
  display: block;
  min-width: 0;
  flex: 1;
}

.mc-toast__copy {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 0.125rem;
  /* Centers the title's first line on the 30px status icon. */
  padding-top: 0.3125rem;
}

.mc-toast__title {
  position: relative;
  display: block;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: var(--leading-body);
}

.mc-toast__line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-toast__description {
  display: block;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
}

.mc-toast__close {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  margin: -0.0625rem -0.125rem 0 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: transform var(--duration-spring) var(--ease-spring),
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .mc-toast__close:hover {
    background: var(--surface-muted);
    color: var(--foreground);
  }
}

/* Quick press, spring release. */
.mc-toast__close:active {
  transform: scale(0.96);
  transition-duration: var(--duration-instant);
  transition-timing-function: var(--ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  .mc-toast__close { transition: none; }
  .mc-toast__close:active { transform: none; }
}
</style>
