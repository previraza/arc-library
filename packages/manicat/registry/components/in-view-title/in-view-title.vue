<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createInViewTitle } from "@/lib/in-view-title";
import { motionTokens } from "@/lib/motion-tokens";

export type InViewTitleVariant = "word" | "line" | "blur" | "tracking" | "wipe";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    text: string;
    variant?: InViewTitleVariant;
    as?: "h1" | "h2" | "h3";
    /** Explicit line breaks for the line variant. */
    lines?: string[];
    id?: string;
    /** Reveal once, or every time the title scrolls back into view. */
    once?: boolean;
    /** Extend the inner, named parts of the title: wrap, clip, part, lineClip, blurWord, trackWord or wipe. */
    classNames?: { wrap?: string; clip?: string; part?: string; lineClip?: string; blurWord?: string; trackWord?: string; wipe?: string };
  }>(),
  { variant: "blur", as: "h2", once: true },
);

const wrap = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let title: ReturnType<typeof createInViewTitle> | undefined;
const cn = (...names: (string | undefined)[]) => names.filter(Boolean).join(" ");

const words = computed(() => props.text.split(" ").filter(Boolean));
const titleLines = computed(() => (props.lines?.length ? props.lines : [props.text]));
const step = computed(() => Math.min(motionTokens.stagger.word * 1.5, 0.4 / Math.max(words.value.length, 1)));
/** Horizontal distance each letter travels per step from its word's center in the tracking variant. */
const TRACK_EM = 0.06;
const letters = (word: string) => Array.from(word);
const offset = (word: string, index: number) => ((letters(word).length - 1) / 2 - index) * TRACK_EM;

const start = () => {
  if (wrap.value) title = createInViewTitle(wrap.value, { once: props.once, reduced, visible: title?.visible() });
};
onMounted(start);
onBeforeUnmount(() => title?.destroy());
// A new text or variant renders new parts, which pick up where the old ones were.
watch(() => [props.text, props.variant, props.lines, props.once], () => {
  const showing = title?.visible();
  title?.destroy();
  title = undefined;
  if (wrap.value) title = createInViewTitle(wrap.value, { once: props.once, reduced, visible: showing });
}, { flush: "post" });
</script>

<template>
  <div ref="wrap" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-in-view-title__wrap', classNames?.wrap, $attrs.class as string | undefined)">
    <component :is="as" v-if="variant === 'word'" :id="id" :aria-label="text">
      <template v-for="(word, index) in words" :key="`${word}-${index}`"><span :class="cn('mc-in-view-title__clip', classNames?.clip)" aria-hidden="true"><span :class="cn('mc-in-view-title__part', classNames?.part)" data-reveal="word" :data-delay="index * step">{{ word }}</span></span>{{ index < words.length - 1 ? " " : "" }}</template>
    </component>
    <component :is="as" v-else-if="variant === 'line'" :id="id" :aria-label="text">
      <span v-for="(line, index) in titleLines" :key="`${line}-${index}`" :class="cn('mc-in-view-title__lineClip', classNames?.lineClip)" aria-hidden="true"><span :class="cn('mc-in-view-title__part', classNames?.part)" data-reveal="line" :data-delay="index * motionTokens.stagger.line" data-settle="0.86">{{ line }}</span></span>
    </component>
    <component :is="as" v-else-if="variant === 'blur'" :id="id" :aria-label="text">
      <template v-for="(word, index) in words" :key="`${word}-${index}`"><span :class="cn('mc-in-view-title__blurWord', classNames?.blurWord, 'mc-in-view-title__part', classNames?.part)" aria-hidden="true" data-reveal="blur" :data-delay="index * step">{{ word }}</span>{{ index < words.length - 1 ? " " : "" }}</template>
    </component>
    <component :is="as" v-else-if="variant === 'tracking'" :id="id" :aria-label="text">
      <template v-for="(word, index) in words" :key="`${word}-${index}`"><span :class="cn('mc-in-view-title__trackWord', classNames?.trackWord, 'mc-in-view-title__part', classNames?.part)" aria-hidden="true" data-reveal="track-word" :data-delay="index * motionTokens.stagger.char * 2" data-settle="0.9"><span v-for="(letter, letterIndex) in letters(word)" :key="letterIndex" :class="cn('mc-in-view-title__part', classNames?.part)" data-reveal="track-letter" :data-delay="index * motionTokens.stagger.char * 2" data-settle="1" :data-offset="offset(word, letterIndex)">{{ letter }}</span></span>{{ index < words.length - 1 ? " " : "" }}</template>
    </component>
    <!-- A soft edged mask sweeps across the title instead of a hard clip, so no letter is ever cut mid stroke. -->
    <div v-else :class="cn('mc-in-view-title__wipe', classNames?.wipe, 'mc-in-view-title__part', classNames?.part)" data-reveal="wipe" data-delay="0" data-settle="0.9"><component :is="as" :id="id">{{ text }}</component></div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-in-view-title__wrap { min-width: 0; color: var(--foreground); }
/* Clips hide the rise; padding with matching negative margins leaves room for descenders and blur without changing layout. */
.mc-in-view-title__clip { display: inline-block; overflow: hidden; vertical-align: top; padding: .08em .14em .2em; margin: -.08em -.14em -.2em; }
.mc-in-view-title__lineClip { display: block; overflow: hidden; padding: .06em .12em .18em; margin: -.06em -.12em -.18em; }
.mc-in-view-title__clip > span, .mc-in-view-title__lineClip > span, .mc-in-view-title__blurWord, .mc-in-view-title__trackWord, .mc-in-view-title__trackWord > span { display: inline-block; }
.mc-in-view-title__trackWord { white-space: nowrap; }
/* The wipe mask is 2.3 times the title's width with a feathered middle, so the soft edge sits fully outside the title at both ends of the sweep.
   Padding with matching negative margins keeps descenders and overhangs inside the masked box without changing layout. */
.mc-in-view-title__wipe { padding: .1em .12em .22em; margin: -.1em -.12em -.22em; mask-image: linear-gradient(90deg, #000 44%, transparent 56%); mask-size: 230% 100%; mask-repeat: no-repeat; mask-position: var(--wipe, 0%) 0; }
/* Server rendered titles start hidden. If scripts have not taken over after 2.4s, show them anyway; the class is removed on hydration. */
.mc-in-view-title__pending .mc-in-view-title__part { animation: mc-in-view-title-settle .4s var(--ease-enter) 2.4s forwards; }
@keyframes mc-in-view-title-settle { to { opacity: 1; transform: none; filter: none; --wipe: 0%; mask-image: none; } }
@media (prefers-reduced-motion: reduce) { .mc-in-view-title__part { opacity: 1 !important; transform: none !important; filter: none !important; mask-image: none !important; } .mc-in-view-title__pending .mc-in-view-title__part { animation: none; } }
</style>
