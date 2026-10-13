<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import { createAutoSize, playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    label?: string;
    lines?: number;
    avatar?: boolean;
    /** Keeps the placeholder visible while true. Only used when the default slot (the content to reveal) is filled. */
    loading?: boolean;
    /** Extend the inner, named parts of the skeleton: avatar, lines, line or frame. */
    classNames?: { avatar?: string; lines?: string; line?: string; frame?: string };
  }>(),
  { label: "Loading content", lines: 3, avatar: false, loading: true },
);

const slots = useSlots();
const count = computed(() => Math.min(Math.max(Math.floor(props.lines), 1), 6));
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const frame = ref<HTMLElement>();
const content = ref<HTMLElement>();
let size: ReturnType<typeof createAutoSize> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The frame follows its content height; a change of loading springs it from the old height to the new one.
onMounted(() => {
  if (frame.value && content.value) size = createAutoSize(frame.value, content.value, { axis: "height", reduced });
});
watch(() => props.loading, () => size?.changed(), { flush: "pre" });
onBeforeUnmount(() => size?.destroy());

const fast = reduced ? motionTokens.duration.instant : motionTokens.duration.fast;
function enter(el: Element, done: () => void) {
  if ((el as HTMLElement).dataset.kind === "placeholder") playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: fast, ease: "standard" }).finished.then(done);
  else playPose(el, reduced ? { opacity: 0 } : { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: fast }).finished.then(done);
}
</script>

<template>
  <div v-if="!slots.default" class="mc-skeleton__root" role="status" :aria-label="label" aria-busy="true">
    <span v-if="avatar" :class="cn('mc-skeleton__avatar', classNames?.avatar)" aria-hidden="true" />
    <span :class="cn('mc-skeleton__lines', classNames?.lines)" aria-hidden="true">
      <span v-for="index in count" :key="index" :class="cn('mc-skeleton__line', classNames?.line)" :style="{ '--index': index - 1 + (avatar ? 1 : 0) }" />
    </span>
  </div>
  <div v-else ref="frame" :aria-busy="loading">
    <div ref="content" :class="cn('mc-skeleton__frame', classNames?.frame)">
      <Transition :css="false" @enter="enter" @leave="leave">
        <div v-if="loading" key="placeholder" data-kind="placeholder">
          <div class="mc-skeleton__root" role="status" :aria-label="label" aria-busy="true">
            <span v-if="avatar" :class="cn('mc-skeleton__avatar', classNames?.avatar)" aria-hidden="true" />
            <span :class="cn('mc-skeleton__lines', classNames?.lines)" aria-hidden="true">
              <span v-for="index in count" :key="index" :class="cn('mc-skeleton__line', classNames?.line)" :style="{ '--index': index - 1 + (avatar ? 1 : 0) }" />
            </span>
          </div>
        </div>
        <div v-else key="content" data-kind="content"><slot /></div>
      </Transition>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-skeleton__root { display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: var(--space-4); }
/* A calm, finite pulse: each block dims a beat after the one above it, then rests after about 20 seconds. */
.mc-skeleton__avatar, .mc-skeleton__line { display: block; flex: 0 0 auto; border-radius: var(--radius-control); background: color-mix(in oklab, var(--border-strong) 38%, var(--surface)); animation: mc-skeleton-skeleton-pulse 1.8s var(--ease-in-out) calc(var(--index, 0) * 90ms) 11 both; }
.mc-skeleton__avatar { width: var(--control-height-md); height: var(--control-height-md); border-radius: var(--radius-pill); }
.mc-skeleton__lines { display: grid; flex: 1; gap: var(--space-3); padding-top: var(--space-1); }
.mc-skeleton__line { width: 100%; height: var(--space-3); }
.mc-skeleton__line:first-child { width: 48%; height: var(--space-4); }
.mc-skeleton__line:last-child { width: 72%; }
.mc-skeleton__frame { position: relative; display: flow-root; }
@keyframes mc-skeleton-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .52; } }
@media (prefers-reduced-motion: reduce) { .mc-skeleton__avatar, .mc-skeleton__line { animation: none; } }
</style>
