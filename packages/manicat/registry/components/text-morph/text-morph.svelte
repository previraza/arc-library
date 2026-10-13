<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    as?: "span" | "div" | "p" | "strong" | "h1" | "h2" | "h3";
    /** The text. It is the key of the animation, so pass it for the text to morph when it changes. */
    text?: string;
    /** Extend the inner, named parts of the morph: frame or glyph. */
    classNames?: { frame?: string; glyph?: string };
    children?: Snippet;
  }

  let { as = "span", text, classNames, children }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The same easing as the CSS of the other ports: the old copy leaves up, the new one rises in.
  function rise(_node: Element, { y, duration, blur }: { y: number; duration: number; blur: number }) {
    return {
      duration: reduced ? 120 : duration,
      css: (t: number) => `opacity: ${t}; ${reduced ? "" : `transform: translateY(${(1 - t) * y}em); filter: blur(${(1 - t) * blur}px);`}`,
    };
  }
</script>

<svelte:element this={as} class={["mc-morph", classNames?.frame]}>
  <!-- Keying on the text makes the old copy leave and the new one rise in, in order. -->
  {#key text}
    <span class={["mc-morph__glyph", classNames?.glyph]} in:rise={{ y: 0.4, duration: 280, blur: 4 }} out:rise={{ y: -0.4, duration: 140, blur: 3 }}>{#if children}{@render children()}{:else}{text}{/if}</span>
  {/key}
</svelte:element>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-morph { display: inline-block; }
.mc-morph__glyph { display: inline-block; }
.mc-morph-enter-active { transition: opacity .28s var(--ease-enter), transform .28s var(--ease-enter), filter .28s var(--ease-enter); }
.mc-morph-leave-active { transition: opacity .14s var(--ease-standard), transform .14s var(--ease-standard), filter .14s var(--ease-standard); }
.mc-morph-enter-from { opacity: 0; transform: translateY(.4em); filter: blur(4px); }
.mc-morph-leave-to { opacity: 0; transform: translateY(-.4em); filter: blur(3px); }
@media (prefers-reduced-motion: reduce) { .mc-morph-enter-active, .mc-morph-leave-active { transition: opacity .12s linear; } .mc-morph-enter-from, .mc-morph-leave-to { transform: none; filter: none; } }
}
</style>
