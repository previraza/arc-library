<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Check } from "lucide-vue-next";
import { createLabelSwap, createProgress, playPose } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    value?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    /** Extend the inner, named parts of the progress: meta, label, line, value, done, count, track or fill. */
    classNames?: { meta?: string; label?: string; line?: string; value?: string; done?: string; count?: string; track?: string; fill?: string };
  }>(),
  { value: 0, max: 100, showValue: false },
);

const safeMax = computed(() => (props.max > 0 ? props.max : 100));
const safeValue = computed(() => Math.min(Math.max(props.value, 0), safeMax.value));
const percentage = computed(() => Math.round((safeValue.value / safeMax.value) * 100));
const complete = computed(() => percentage.value >= 100);

const fill = ref<HTMLElement>();
const count = ref<HTMLElement>();
const labelSlot = ref<HTMLElement>();
const labelLine = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let bar: ReturnType<typeof createProgress> | undefined;
let swap: LabelSwap | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  bar = createProgress({ fill: fill.value!, count: count.value }, { percent: percentage.value, reduced });
  if (labelSlot.value && labelLine.value) swap = createLabelSwap(labelSlot.value, labelSlot.value, labelLine.value, { reduced, width: false });
});
watch(percentage, (next) => bar?.set(next));
onBeforeUnmount(() => {
  bar?.destroy();
  swap?.destroy();
});

// Completion lands as the fill arrives: a check settles in beside the final count.
const icon = { opacity: 0, scale: 0.6, blur: motionTokens.blur.subtle };
const rest = { opacity: 1, scale: 1, blur: 0 };
function enter(el: Element, done: () => void) {
  playPose(el, icon, rest, reduced ? { duration: motionTokens.duration.instant } : { spring: "snappy", delay: 0.24 }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  playPose(el, rest, reduced ? { opacity: 0 } : icon, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div
    :class="'mc-progress__progress'"
    :data-complete="complete ? '' : undefined"
    role="progressbar"
    :aria-label="label ?? 'Progress'"
    :aria-valuemin="0"
    :aria-valuemax="safeMax"
    :aria-valuenow="safeValue"
    :aria-valuetext="`${percentage}%`"
  >
    <div v-if="label || showValue" :class="cn('mc-progress__meta', classNames?.meta)">
      <span v-if="label" ref="labelSlot" :class="cn('mc-progress__label', classNames?.label)"><span ref="labelLine" :class="cn('mc-progress__line', classNames?.line)">{{ label }}</span></span>
      <span v-else />
      <span v-if="showValue" :class="cn('mc-progress__value', classNames?.value)">
        <Transition :css="false" @enter="enter" @leave="leave">
          <span v-if="complete" key="done" :class="cn('mc-progress__done', classNames?.done)"><Check :size="14" :stroke-width="1.75" aria-hidden="true" /></span>
        </Transition>
        <span ref="count" :class="cn('mc-progress__count', classNames?.count)" />
      </span>
    </div>
    <div :class="cn('mc-progress__track', classNames?.track)"><span ref="fill" :class="cn('mc-progress__fill', classNames?.fill)" /></div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-progress__progress { width: 100%; color: var(--text-secondary); font-size: var(--text-sm); } .mc-progress__meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; line-height: var(--leading-body); } .mc-progress__label { position: relative; min-width: 0; } .mc-progress__line { display: block; } .mc-progress__value { display: inline-flex; flex: none; align-items: center; gap: 4px; color: var(--text-muted); font-variant-numeric: tabular-nums; } .mc-progress__count { display: inline-grid; justify-items: end; } /* A hidden "100%" row reserves the widest count, so the check never shifts as the number gains a digit. */ .mc-progress__count::before { content: "100%"; height: 0; overflow: hidden; visibility: hidden; } .mc-progress__done { display: grid; place-items: center; color: var(--success); } .mc-progress__track { height: 7px; overflow: hidden; border: 1px solid var(--border); border-radius: 99px; background: var(--surface-muted); } .mc-progress__fill { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--accent); transition: background-color var(--duration-standard) var(--ease-standard); } .mc-progress__progress[data-complete] .mc-progress__fill { background: var(--success); transition-delay: 200ms; } @media (prefers-reduced-motion: reduce) { .mc-progress__fill, .mc-progress__progress[data-complete] .mc-progress__fill { transition: none; } }
</style>
