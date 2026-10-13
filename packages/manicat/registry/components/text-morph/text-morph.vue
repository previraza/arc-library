<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useSlots, watch } from "vue";
import { createFlip, playPose, popOut } from "@/lib/motion-dom";
import { HANDOFF, createMorphFrame, toGlyphs } from "@/lib/text-morph";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** The label to show. It can also be the default slot, as plain text. */
    text?: string;
    as?: "span" | "div" | "p" | "strong" | "h1" | "h2" | "h3";
    /** Extend the inner, named parts of the text morph: frame, track or glyph. */
    classNames?: { frame?: string; track?: string; glyph?: string };
  }>(),
  { as: "span" },
);

const slots = useSlots();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, stagger } = motionTokens;
const frame = ref<HTMLElement>();
const track = ref<HTMLElement>();
let morph: ReturnType<typeof createMorphFrame> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const slotText = () => (slots.default?.() ?? []).map((node) => (typeof node.children === "string" ? node.children : "")).join("");
const label = computed(() => props.text ?? slotText());
const glyphs = computed(() => toGlyphs(label.value));
// The previous label tells which letters are new, so only they stagger, in reading order, however far along the word they sit.
let previous = label.value;
const kept = ref(new Set(toGlyphs(previous).map((glyph) => glyph.key)));
watch(label, (_, before) => (kept.value = new Set(toGlyphs(before).map((glyph) => glyph.key))), { flush: "sync" });
const order = computed(() => {
  let entering = 0;
  return new Map(glyphs.value.map(({ key }) => [key, kept.value.has(key) ? 0 : entering++]));
});

const flip = createFlip(() => [...(track.value?.querySelectorAll<HTMLElement>("[data-glyph]") ?? [])], { reduced });
onBeforeUpdate(() => flip.measure());
onUpdated(() => {
  flip.play();
  morph?.update();
});
onMounted(() => {
  morph = createMorphFrame(frame.value!, track.value!, reduced);
  morph.update();
});
onBeforeUnmount(() => morph?.destroy());

const blur = motionTokens.blur.soft;
function enter(el: Element, done: () => void) {
  if (reduced) return done();
  const index = Number((el as HTMLElement).dataset.order ?? 0);
  playPose(el, { opacity: 0, scale: 0.8, y: parseFloat(getComputedStyle(el).fontSize) * 0.14, blur }, { opacity: 1, scale: 1, y: 0, blur: 0 }, { duration: duration.standard + 0.04, ease: "enter", delay: HANDOFF + Math.min(index, 8) * stagger.char * 2 }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  popOut(node);
  if (reduced) return done();
  playPose(node, { opacity: 1, scale: 1, y: 0, blur: 0 }, { opacity: 0, scale: 0.86, y: parseFloat(getComputedStyle(node).fontSize) * -0.1, blur }, { duration: duration.exit, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <component :is="as" v-bind="$attrs">
    <span class="mc-text-morph__srOnly">{{ label }}</span>
    <span ref="frame" :class="cn('mc-text-morph__frame', classNames?.frame)" aria-hidden="true"><span ref="track" :class="cn('mc-text-morph__track', classNames?.track)">
      <TransitionGroup tag="span" style="display: contents" :css="false" @enter="enter" @leave="leave">
        <span v-for="{ char, key } in glyphs" :key="key" data-glyph :data-order="order.get(key)" :class="cn('mc-text-morph__glyph', classNames?.glyph)">{{ char === " " ? "\u00a0" : char }}</span>
      </TransitionGroup>
    </span></span>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame carries the animated width. Its mask reveals new letters through a soft trailing edge as it grows and fades leaving ones as it shrinks.
   Padding with matching negative margins gives the mask room for blur and descenders without changing layout; the edge sits entirely in that room, so resting text is never dimmed.
   The track always starts at the frame's leading edge, even in centered text: otherwise it would recenter inside the old width and leaving letters would jump. */
.mc-text-morph__frame.mc-text-morph__frame, .mc-text-morph__frame { position: relative; display: inline-block; box-sizing: content-box; padding: .5em .5em .5em .2em; margin: -.5em -.5em -.5em -.2em; text-align: start; white-space: nowrap; mask-image: linear-gradient(90deg, #000 calc(100% - .5em), transparent); }
/* The track sizes to the letters in flow. Leaving letters are taken out of flow and positioned against it. */
.mc-text-morph__track { position: relative; display: inline-block; white-space: nowrap; }
.mc-text-morph__glyph { display: inline-block; white-space: pre; transform-origin: 50% 60%; }
.mc-text-morph__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; user-select: none; }
</style>
