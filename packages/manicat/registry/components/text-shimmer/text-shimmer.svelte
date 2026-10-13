<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createLabelSwap, createTextShimmer } from "@/lib/motion-dom";

  /**
   * A calm light sweep across a short status line, such as "Thinking" or "Generating summary", to show that work is ongoing.
   * The band uses the current text color over a muted base. When `active` turns false the band glides off and the text settles to solid.
   * A changed label rises in place while the line springs to its new width.
   */
  interface Props {
    /** The status text. Keep it to one short line. */
    children: Snippet;
    /** Sweep while work is ongoing. Defaults to true. */
    active?: boolean;
    /** Seconds for one sweep across the text. Defaults to 1.8. */
    duration?: number;
    as?: "span" | "p" | "div" | "h2" | "h3" | "h4";
    id?: string;
    /** Extend the inner, named parts of the text shimmer: stage or label. */
    classNames?: { stage?: string; label?: string };
  }

  let { children, active = true, duration = 1.8, as = "span", id, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stage: HTMLElement;
  let label: HTMLElement;
  let shimmer: ReturnType<typeof createTextShimmer> | undefined;

  onMount(() => {
    shimmer = createTextShimmer(label, { active, duration, reduced });
    const swap = createLabelSwap(stage, label, label, { reduced, variant: "badge", release: true, flag: "sizing" });
    return () => {
      shimmer?.destroy();
      swap.destroy();
    };
  });
  $effect(() => shimmer?.set(active));
</script>

<svelte:element this={as} {id} class="mc-text-shimmer__shimmer" data-state={active ? "active" : "idle"} aria-busy={active || undefined}>
  <span bind:this={stage} class={["mc-text-shimmer__stage", classNames?.stage]}>
    <span bind:this={label} class={["mc-text-shimmer__label", classNames?.label]}>{@render children()}</span>
  </span>
</svelte:element>

<style>
:global {
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
}
</style>
