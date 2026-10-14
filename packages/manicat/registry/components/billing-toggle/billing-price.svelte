<script lang="ts">
  // @manicat-dependencies motion
  import { animate } from "motion";
  import { onMount } from "svelte";
  import AnimatedCounter from "@/registry/components/animated-counter/animated-counter.svelte";
  import { curveOf, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** A price that rolls to its new amount. The old price and the period ease their width, so nothing beside them jumps. */
  let { amount, currency = "$", period, was, decimals = 0, class: className }: {
    amount: number;
    currency?: string;
    /** Period after the price, e.g. "per month". Swaps in place when it changes. */
    period?: string;
    /** Previous price, shown struck through when it is higher than `amount`. */
    was?: number;
    decimals?: number;
    class?: string;
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  const clip = { type: "spring", visualDuration: 0.36, bounce: 0 } as const;
  const showWas = $derived(was !== undefined && was > amount);
  let periodBox = $state<HTMLElement>();
  let periodSizer = $state<HTMLElement>();
  let placed = false;
  let moving = false;

  // The period box follows the width of its text on a spring; the first measure lands without motion.
  $effect(() => {
    period;
    const box = periodBox;
    const sizer = periodSizer;
    if (!box || !sizer) return;
    const width = sizer.offsetWidth;
    if (!placed || reduced) {
      placed = true;
      box.style.width = `${width}px`;
      return;
    }
    moving = true;
    animate(box, { width: [`${box.offsetWidth}px`, `${width}px`] }, clip as never).finished.then(() => (moving = false), () => (moving = false));
  });
  // A font that arrives after the first measure changes the width of the text: the box follows it at once.
  $effect(() => {
    if (!periodSizer || !periodBox) return;
    const box = periodBox;
    const sizer = periodSizer;
    const watcher = new ResizeObserver(() => { if (!moving) box.style.width = `${sizer.offsetWidth}px`; });
    watcher.observe(sizer);
    return () => watcher.disconnect();
  });

  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  function wasIn(node: HTMLElement) {
    if (reduced) return poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.fast })(node);
    const natural = node.offsetWidth;
    const { duration: length, easing } = curveOf(clip as never);
    return { duration: length, easing, css: (t: number) => `width: ${natural * t}px; opacity: ${Math.min(1, t * 2)}; overflow: clip;` };
  }
  function wasOut(node: HTMLElement) {
    if (reduced) return { duration: 0 };
    const natural = node.offsetWidth;
    const { duration: length, easing } = curveOf(clip as never);
    return { duration: length, easing, css: (t: number) => `width: ${natural * t}px; opacity: ${Math.min(1, t * 4)}; overflow: clip;` };
  }
  const periodIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.45), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.fast } : { duration: duration.standard, ease: "enter" })(node);
  const periodOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.45), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" })(node);
</script>

<span class={["mc-billing-toggle__price", className]}>
  <span class="mc-billing-toggle__amount">
    <span class="mc-billing-toggle__currency">{currency}</span>
    <span class="mc-billing-toggle__counter"><AnimatedCounter value={amount} {decimals} /></span>
  </span>
  <span class="mc-billing-toggle__aside">
    {#if showWas && was !== undefined}
      <span class="mc-billing-toggle__wasSlot" in:wasIn out:wasOut><del class="mc-billing-toggle__was">{currency}{was.toFixed(decimals)}</del></span>
    {/if}
    {#if period}
      <span bind:this={periodBox} class="mc-billing-toggle__period">
        <span bind:this={periodSizer} class="mc-billing-toggle__periodSizer" aria-hidden="true">{period}</span>
        {#key period}<span class="mc-billing-toggle__periodText" in:periodIn out:periodOut>{period}</span>{/key}
      </span>
    {/if}
  </span>
</span>
