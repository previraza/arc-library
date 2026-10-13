<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";
import { createCounter } from "@/lib/counter";

const props = withDefaults(
  defineProps<{
    value: number;
    label?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    /** Roll every digit up from zero the first time the counter scrolls into view. */
    animateOnView?: boolean;
    /** Formatting locale. Fixed by default so server and client render the same digits. */
    locale?: string;
    /** Extend the inner, named parts of the counter: label, labelSwap, labelText, value, symbol, column or glyph. */
    classNames?: { label?: string; labelSwap?: string; labelText?: string; value?: string; symbol?: string; column?: string; glyph?: string };
  }>(),
  { prefix: "", suffix: "", decimals: 0, animateOnView: false, locale: "en-US" },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = ref<HTMLElement>();
const sr = ref<HTMLElement>();
const labelText = ref<HTMLElement>();
let counter: ReturnType<typeof createCounter> | undefined;
let swap: LabelSwap | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const options = () => ({
  value: props.value,
  prefix: props.prefix,
  suffix: props.suffix,
  decimals: props.decimals,
  locale: props.locale,
  animateOnView: props.animateOnView,
  reduced,
  classes: { value: "", symbol: cn("mc-animated-counter__symbol", props.classNames?.symbol), column: cn("mc-animated-counter__column", props.classNames?.column), glyph: cn("mc-animated-counter__glyph", props.classNames?.glyph), sizer: "mc-animated-counter__sizer" },
});

onMounted(() => {
  counter = createCounter(host.value!, sr.value!, options());
  const box = labelText.value?.parentElement;
  if (labelText.value && box) swap = createLabelSwap(box, box, labelText.value, { reduced, width: false, variant: "badge" });
});
watch(() => [props.value, props.prefix, props.suffix, props.decimals, props.locale], () => counter?.update(options()));
onBeforeUnmount(() => {
  counter?.destroy();
  swap?.destroy();
});
</script>

<template>
  <span class="mc-animated-counter__counter">
    <span v-if="label" :class="cn('mc-animated-counter__label', classNames?.label)"><span :class="cn('mc-animated-counter__labelSwap', classNames?.labelSwap)"><span ref="labelText" :class="cn('mc-animated-counter__labelText', classNames?.labelText)">{{ label }}</span></span></span>
    <span ref="sr" class="mc-animated-counter__srOnly" />
    <span ref="host" :class="cn('mc-animated-counter__value', classNames?.value)" aria-hidden="true" />
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-animated-counter__counter { position: relative; display: inline-flex; flex-direction: column; color: var(--foreground); font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 500; letter-spacing: var(--tracking-display); line-height: 1; font-variant-numeric: tabular-nums; }
.mc-animated-counter__label { margin-bottom: var(--space-2); color: var(--text-muted); font-family: var(--font-body); font-size: var(--text-xs); font-weight: 400; letter-spacing: var(--tracking-body); line-height: var(--leading-body); }
/* Each digit is a clipped wheel; separators clip sideways only so a comma keeps its tail. */
.mc-animated-counter__value { display: inline-flex; align-items: flex-start; white-space: nowrap; user-select: none; }
/* The wheel's window reaches a little past the line box and feathers out, so a turning digit fades at the edge instead of being cut. */
.mc-animated-counter__column { --feather: .16em; position: relative; display: inline-block; overflow: hidden; margin-block: calc(var(--feather) * -1); padding-block: var(--feather); mask-image: linear-gradient(to bottom, transparent, #000 calc(var(--feather) * 1.5), #000 calc(100% - var(--feather) * 1.5), transparent); }
.mc-animated-counter__sizer { visibility: hidden; }
.mc-animated-counter__glyph { position: absolute; inset: var(--feather) 0; text-align: center; }
.mc-animated-counter__labelText { display: inline-block; }
.mc-animated-counter__labelSwap { position: relative; display: block; }
.mc-animated-counter__symbol { display: inline-block; overflow-x: clip; }
.mc-animated-counter__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
