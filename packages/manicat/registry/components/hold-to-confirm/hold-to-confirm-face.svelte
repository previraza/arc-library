<script lang="ts">
  // @manicat-dependencies motion
  import type { Component } from "svelte";
  import { drawPath, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Icon and label. The button renders it twice: once on the surface and once inside the fill, so the text changes colour exactly at the fill edge. */
  let { icon, text, done, measure = false, classNames }: { icon: Component; text: string; done: boolean; /** Marks the copy that measures the label. */ measure?: boolean; classNames?: { face?: string; iconSlot?: string; iconPhase?: string; labelFrame?: string; label?: string } } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);

  // Scale rides the spring; opacity and blur tween so the blur never overshoots below zero.
  function iconIn(node: HTMLElement) {
    // The tick draws itself from its short stroke, the way a hand would write it.
    const path = node.querySelector("path");
    if (path && node.querySelector("svg[data-check]")) queueMicrotask(() => drawPath(path, { reduced, duration: 0.32, ease: "enter", delay: 0.08 }));
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.fast } : { spring: "snappy", fade: duration.fast })(node);
  }
  const iconOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  const textIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.fast } : { duration: duration.standard, ease: "enter" })(node);
  const textOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
</script>

<span class={["mc-hold-to-confirm__face", classNames?.face]}>
  <span class={["mc-hold-to-confirm__iconSlot", classNames?.iconSlot]}>
    {#key done}
      {@const Icon = icon}
      <span class={["mc-hold-to-confirm__iconPhase", classNames?.iconPhase]} in:iconIn out:iconOut>
        {#if done}
          <svg data-check width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg>
        {:else}
          <Icon strokeWidth={1.75} />
        {/if}
      </span>
    {/key}
  </span>
  <span data-label-frame class={["mc-hold-to-confirm__labelFrame", classNames?.labelFrame]}>
    {#if measure}<span data-measure class="mc-hold-to-confirm__measure">{text}</span>{/if}
    {#key text}<span class={["mc-hold-to-confirm__label", classNames?.label]} in:textIn out:textOut>{text}</span>{/key}
  </span>
</span>
