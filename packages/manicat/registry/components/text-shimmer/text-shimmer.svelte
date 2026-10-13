<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    as?: "span" | "p" | "div" | "h2" | "h3" | "h4";
    /** Turn the shimmer off when the work is done. */
    active?: boolean;
    /** Seconds for one pass. */
    duration?: number;
    /** Extend the inner, named parts of the shimmer: stage or label. */
    classNames?: { stage?: string; label?: string };
    children?: Snippet;
  }

  let { as = "span", active = true, duration = 1.8, classNames, children }: Props = $props();
</script>

<svelte:element this={as} class={["mc-shimmer", classNames?.stage]} data-active={active || undefined} aria-busy={active || undefined} style="--mc-duration: {duration}s">
  <span class={["mc-shimmer__label", classNames?.label]}>{@render children?.()}</span>
</svelte:element>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-shimmer { display: inline-block; }
.mc-shimmer__label { color: var(--text-muted); }
.mc-shimmer[data-active] .mc-shimmer__label { color: transparent; background: linear-gradient(100deg, var(--text-muted) 35%, var(--foreground) 50%, var(--text-muted) 65%) 100% 0 / 250% 100% no-repeat; -webkit-background-clip: text; background-clip: text; animation: mc-shimmer var(--mc-duration, 1.8s) linear infinite; }
@keyframes mc-shimmer { to { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .mc-shimmer[data-active] .mc-shimmer__label { animation: none; color: var(--text-secondary); background: none; } }
}
</style>
