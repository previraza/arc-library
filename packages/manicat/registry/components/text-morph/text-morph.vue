<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: "span" | "div" | "p" | "strong" | "h1" | "h2" | "h3";
    /** The text. The slot is used when this is not given. */
    text?: string;
    /** Extend the inner, named parts of the morph: frame or glyph. */
    classNames?: { frame?: string; glyph?: string };
  }>(),
  { as: "span" },
);
</script>

<template>
  <component :is="as" :class="['mc-morph', classNames?.frame]">
    <!-- Keying on the text makes the old copy leave and the new one rise in, in order. -->
    <Transition name="mc-morph" mode="out-in">
      <span :key="text ?? String($slots.default?.()[0]?.children ?? '')" :class="['mc-morph__glyph', classNames?.glyph]"><slot>{{ text }}</slot></span>
    </Transition>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-morph { display: inline-block; }
.mc-morph__glyph { display: inline-block; }
.mc-morph-enter-active { transition: opacity .28s var(--ease-enter), transform .28s var(--ease-enter), filter .28s var(--ease-enter); }
.mc-morph-leave-active { transition: opacity .14s var(--ease-standard), transform .14s var(--ease-standard), filter .14s var(--ease-standard); }
.mc-morph-enter-from { opacity: 0; transform: translateY(.4em); filter: blur(4px); }
.mc-morph-leave-to { opacity: 0; transform: translateY(-.4em); filter: blur(3px); }
@media (prefers-reduced-motion: reduce) { .mc-morph-enter-active, .mc-morph-leave-active { transition: opacity .12s linear; } .mc-morph-enter-from, .mc-morph-leave-to { transform: none; filter: none; } }
</style>
