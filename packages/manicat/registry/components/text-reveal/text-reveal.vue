<script setup lang="ts">
import { computed } from "vue";
import { motionTokens } from "@/lib/motion-tokens";

/**
 * Reveals a short headline or sentence once, as it mounts: each word rises out of its own clip while it sharpens from a soft blur.
 * The entrance runs in CSS, so it starts on first paint and never leaves text hidden when scripts are slow.
 * Use `\n` in `text` for a deliberate line break and change the element's `key` to replay it.
 */
const props = withDefaults(
  defineProps<{
    text: string;
    as?: "h1" | "h2" | "h3" | "p";
    id?: string;
    /** Seconds to wait before the first word rises. Defaults to 0. */
    delay?: number;
    /** Extend the inner, named parts of the text reveal: line, clip or word. */
    classNames?: { line?: string; clip?: string; word?: string };
  }>(),
  { as: "h2", delay: 0 },
);

/** Total stagger stays under this many seconds, however long the text is. */
const MAX_STAGGER = motionTokens.duration.considered;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

const lines = computed(() => props.text.split("\n").map((line) => line.split(" ").filter(Boolean)));
const step = computed(() => Math.min(motionTokens.stagger.word, MAX_STAGGER / Math.max(lines.value.reduce((total, words) => total + words.length, 0), 1)));
const blur = computed(() => (props.as === "p" ? motionTokens.blur.soft : motionTokens.blur.text));
// Each word's position in the whole text, so the stagger runs across lines.
const starts = computed(() => lines.value.map((_, index) => lines.value.slice(0, index).reduce((total, words) => total + words.length, 0)));
</script>

<template>
  <component :is="as" :id="id" class="mc-text-reveal__reveal" :style="{ '--reveal-blur': `${blur}px` }">
    <span class="mc-text-reveal__srOnly">{{ text.replace(/\n/g, " ") }}</span>
    <template v-for="(words, lineIndex) in lines" :key="lineIndex">
      <span :class="cn('mc-text-reveal__line', classNames?.line)" aria-hidden="true">
        <template v-for="(word, wordIndex) in words" :key="`${word}-${starts[lineIndex] + wordIndex}`">
          <span :class="cn('mc-text-reveal__clip', classNames?.clip)"><span :class="cn('mc-text-reveal__word', classNames?.word)" :style="{ '--reveal-delay': `${delay + (starts[lineIndex] + wordIndex) * step + lineIndex * step}s` }">{{ word }}</span></span>
          <template v-if="wordIndex < words.length - 1">{{ " " }}</template>
        </template>
      </span>
      <template v-if="lineIndex < lines.length - 1">{{ " " }}</template>
    </template>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-text-reveal__reveal { max-width: 24ch; margin: 0; overflow: visible; color: var(--foreground); text-wrap: balance; }
.mc-text-reveal__line { display: block; }
/* The clip hides the mc-text-reveal-rise below the line through a feathered bottom edge, so a blurred word surfaces softly instead of being cut by a hard line.
   Padding with matching negative margins leaves room for descenders and the blur without changing layout; the feather sits below the descenders, so resting words are never dimmed. */
.mc-text-reveal__clip { display: inline-block; vertical-align: top; padding: .1em .16em .24em; margin: -.1em -.16em -.24em; mask-image: linear-gradient(#000 calc(100% - .18em), transparent); }
/* Three tracks: the mc-text-reveal-rise settles longest, the mc-text-reveal-fade finishes first, and the blur clears between them.
   Backwards fill holds the hidden start through each word's delay, then lets go at the end, so resting words keep no transform or filter layer and render as crisp as plain text. */
.mc-text-reveal__word { display: inline-block; animation: mc-text-reveal-rise .76s var(--ease-enter) var(--reveal-delay, 0s) backwards, mc-text-reveal-fade .44s var(--ease-standard) var(--reveal-delay, 0s) backwards, mc-text-reveal-focus .58s var(--ease-enter) var(--reveal-delay, 0s) backwards; }
.mc-text-reveal__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; user-select: none; }
@keyframes mc-text-reveal-rise { from { transform: translateY(.62em); } }
@keyframes mc-text-reveal-fade { from { opacity: 0; } }
@keyframes mc-text-reveal-focus { from { filter: blur(var(--reveal-blur, 4px)); } }
@media (prefers-reduced-motion: reduce) { .mc-text-reveal__clip { mask-image: none; } .mc-text-reveal__word { animation: mc-text-reveal-fade var(--duration-fast) var(--ease-standard) backwards; } }
</style>
