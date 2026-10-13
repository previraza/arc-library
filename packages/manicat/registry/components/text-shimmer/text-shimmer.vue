<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createLabelSwap, createTextShimmer } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";

/**
 * A calm light sweep across a short status line, such as "Thinking" or "Generating summary", to show that work is ongoing.
 * The band uses the current text color over a muted base. When `active` turns false the band glides off and the text settles to solid.
 * A changed label rises in place while the line springs to its new width.
 */
const props = withDefaults(
  defineProps<{
    /** Sweep while work is ongoing. Defaults to true. */
    active?: boolean;
    /** Seconds for one sweep across the text. Defaults to 1.8. */
    duration?: number;
    as?: "span" | "p" | "div" | "h2" | "h3" | "h4";
    id?: string;
    /** Extend the inner, named parts of the text shimmer: stage or label. */
    classNames?: { stage?: string; label?: string };
  }>(),
  { active: true, duration: 1.8, as: "span" },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = ref<HTMLElement>();
const label = ref<HTMLElement>();
let shimmer: ReturnType<typeof createTextShimmer> | undefined;
let swap: LabelSwap | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  shimmer = createTextShimmer(label.value!, { active: props.active, duration: props.duration, reduced });
  swap = createLabelSwap(stage.value!, label.value!, label.value!, { reduced, variant: "badge", release: true, flag: "sizing" });
});
watch(() => props.active, (next) => shimmer?.set(next));
onBeforeUnmount(() => {
  shimmer?.destroy();
  swap?.destroy();
});
</script>

<template>
  <component :is="as" :id="id" class="mc-text-shimmer__shimmer" :data-state="active ? 'active' : 'idle'" :aria-busy="active || undefined">
    <span ref="stage" :class="cn('mc-text-shimmer__stage', classNames?.stage)">
      <span ref="label" :class="cn('mc-text-shimmer__label', classNames?.label)"><slot /></span>
    </span>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The band is the current text color; the resting base leans toward muted text. Override with --text-shimmer-highlight and --text-shimmer-base. */
.mc-text-shimmer__shimmer { --ts-highlight: var(--text-shimmer-highlight, currentColor); --ts-base: var(--text-shimmer-base, color-mix(in oklab, currentColor 12%, var(--text-muted))); }
.mc-text-shimmer__stage { position: relative; display: inline-block; max-width: 100%; }
.mc-text-shimmer__label { display: inline-block; max-width: 100%; background-repeat: no-repeat; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
/* While the line springs to a new width the label keeps its own line, so it never rewraps mid morph. */
.mc-text-shimmer__stage[data-sizing] .mc-text-shimmer__label { max-width: none; white-space: nowrap; }
.mc-text-shimmer__label::selection { -webkit-text-fill-color: currentColor; }
@supports not (color: color-mix(in oklab, red, blue)) { .mc-text-shimmer__label { background: none !important; -webkit-text-fill-color: currentColor; } }
@media (forced-colors: active) { .mc-text-shimmer__label { background: none !important; -webkit-text-fill-color: currentColor; } }
</style>
