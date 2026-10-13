<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createSlotText } from "@/lib/slot-text";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** The value to show. Numbers pass through format; strings render as they are. */
    value: string | number;
    /** Formats a number value. Defaults to en-US grouping, so 12480 reads 12,480. */
    format?: (value: number) => string;
    /** Seconds the first reel spins. Later reels add stagger. */
    duration?: number;
    /** Seconds between reels stopping, left to right. */
    stagger?: number;
    /** Extra full turns a digit makes before it lands. 0 rolls straight to the new digit. */
    spins?: number;
    /** Which end reels are matched from when the length changes. Numbers default to end, so 999 to 1,000 grows on the left. */
    align?: "start" | "end";
    /** Announce new values politely to screen readers. */
    announce?: boolean;
    /** Extend the inner, named parts of the slot text: reels, slot, sizer, window, strip or cell. */
    classNames?: { reels?: string; slot?: string; sizer?: string; window?: string; strip?: string; cell?: string };
  }>(),
  { duration: 0.9, stagger: 0.07, spins: 1, announce: false },
);

const reels = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let slot: ReturnType<typeof createSlotText> | undefined;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

const text = computed(() => (typeof props.value === "number" ? (props.format ? props.format(props.value) : props.value.toLocaleString("en-US")) : props.value));
const fromEnd = computed(() => (props.align ?? (typeof props.value === "number" ? "end" : "start")) === "end");

onMounted(() => {
  slot = createSlotText(reels.value!, {
    classes: { slot: cn("mc-slot-text__slot", props.classNames?.slot), sizer: cn("mc-slot-text__sizer", props.classNames?.sizer), window: cn("mc-slot-text__window", props.classNames?.window), strip: cn("mc-slot-text__strip", props.classNames?.strip), cell: cn("mc-slot-text__cell", props.classNames?.cell) },
    duration: props.duration,
    stagger: props.stagger,
    spins: props.spins,
    reduced,
  });
  slot.update(text.value, { fromEnd: fromEnd.value, rising: true });
});
onBeforeUnmount(() => slot?.destroy());
watch(() => props.value, (next, previous) => slot?.update(text.value, { fromEnd: fromEnd.value, rising: typeof next === "number" && typeof previous === "number" ? next >= previous : true }), { flush: "post" });
</script>

<template>
  <span v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-slot-text__root', $attrs.class as string | undefined)">
    <span class="mc-slot-text__srOnly" :aria-live="announce ? 'polite' : undefined">{{ text }}</span>
    <span ref="reels" :class="cn('mc-slot-text__reels', classNames?.reels)" aria-hidden="true" />
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slot-text__root { position: relative; display: inline-block; font-variant-numeric: tabular-nums; line-height: 1.15; white-space: nowrap; vertical-align: bottom; }
.mc-slot-text__reels { display: inline-flex; height: 1.15em; align-items: flex-start; }

/* Each slot holds one character. Its width follows the character on a spring, so the word never resizes in one frame. */
.mc-slot-text__slot { position: relative; display: inline-block; height: 1.15em; flex: none; overflow: visible; }
.mc-slot-text__sizer { display: inline-block; visibility: hidden; white-space: pre; pointer-events: none; }

/* The window reaches a little past the line so glyphs fade at the edges instead of being cut. */
.mc-slot-text__window {
  position: absolute;
  inset: -.22em -.08em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 .24em, #000 calc(100% - .24em), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 .24em, #000 calc(100% - .24em), transparent);
}
.mc-slot-text__strip { position: absolute; top: calc(.22em - .225em); right: .08em; left: .08em; display: flex; flex-direction: column; align-items: center; will-change: transform; }
.mc-slot-text__cell { display: block; height: 1.6em; padding-top: .225em; box-sizing: border-box; line-height: 1.15; white-space: pre; }

.mc-slot-text__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
