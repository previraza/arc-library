<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import { Folder } from "lucide-vue-next";
import { createAutoSize, createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";

const props = defineProps<{
  title: string;
  description: string;
  /** Accessible label for the state region. */
  label?: string;
  /** Extend the inner, named parts of the empty state: icon, glyph, line or action. */
  classNames?: { icon?: string; glyph?: string; line?: string; action?: string };
}>();

const slots = useSlots();
const frame = ref<HTMLElement>();
const copy = ref<HTMLElement>();
const iconBox = ref<HTMLElement>();
const glyph = ref<HTMLElement>();
const titleBox = ref<HTMLElement>();
const titleLine = ref<HTMLElement>();
const descriptionBox = ref<HTMLElement>();
const descriptionLine = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const swaps: LabelSwap[] = [];
let size: ReturnType<typeof createAutoSize> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The result of an action morphs in place: the icon crossfades and the copy rises in while the old copy leaves.
onMounted(() => {
  size = createAutoSize(frame.value!, copy.value!, { axis: "height", reduced });
  const follower = { arm: () => size?.changed(), destroy: () => undefined };
  swaps.push(createLabelSwap(iconBox.value!, iconBox.value!, glyph.value!, { reduced, icon: true, width: false, variant: "badge" }));
  swaps.push(createLabelSwap(titleBox.value!, titleBox.value!, titleLine.value!, { reduced, follower, variant: "badge" }));
  swaps.push(createLabelSwap(descriptionBox.value!, descriptionBox.value!, descriptionLine.value!, { reduced, follower, variant: "badge" }));
});
watch(() => [props.title, props.description], () => size?.changed(), { flush: "pre" });
onBeforeUnmount(() => {
  swaps.forEach((swap) => swap.destroy());
  size?.destroy();
});
</script>

<template>
  <section class="mc-empty-state__root" :aria-label="label">
    <div ref="iconBox" :class="cn('mc-empty-state__icon', classNames?.icon)" aria-hidden="true">
      <span ref="glyph" :class="cn('mc-empty-state__glyph', classNames?.glyph)"><slot name="icon"><Folder :size="24" :stroke-width="1.5" /></slot></span>
    </div>
    <div ref="frame" class="mc-empty-state__frame">
      <div ref="copy" class="mc-empty-state__copy">
        <h3 ref="titleBox"><span ref="titleLine" :class="cn('mc-empty-state__line', classNames?.line)">{{ title }}</span></h3>
        <p ref="descriptionBox"><span ref="descriptionLine" :class="cn('mc-empty-state__line', classNames?.line)">{{ description }}</span></p>
      </div>
    </div>
    <div v-if="slots.default" :class="cn('mc-empty-state__action', classNames?.action)"><slot /></div>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-empty-state__root { display: flex; width: 100%; flex-direction: column; align-items: center; padding: clamp(var(--space-8), 8vw, var(--space-12)) var(--space-5); text-align: center; }
.mc-empty-state__icon { position: relative; display: grid; width: var(--space-12); height: var(--space-12); place-items: center; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-muted); color: var(--text-secondary); animation: mc-empty-state-empty-state-icon var(--duration-considered) var(--ease-enter) both; }
.mc-empty-state__glyph { display: grid; place-items: center; }
.mc-empty-state__frame { width: 100%; max-width: 100%; }
.mc-empty-state__copy { display: flow-root; }
.mc-empty-state__root h3 { position: relative; margin: var(--space-5) 0 0; color: var(--foreground); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); }
.mc-empty-state__root p { position: relative; max-width: 18rem; margin: var(--space-2) auto 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
/* Centered copy wraps into even lines, so a new description never leaves a single word hanging. */
.mc-empty-state__line { display: block; text-wrap: balance; }
.mc-empty-state__action { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); margin-top: var(--space-5); }
/* The icon settles in once when the state first appears; later changes crossfade in place. */
@keyframes mc-empty-state-empty-state-icon { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .mc-empty-state__icon { animation: none; } }
</style>
