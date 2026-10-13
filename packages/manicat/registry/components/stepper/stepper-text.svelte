<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { followTextHeight } from "@/lib/stepper";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Text that rises in with a small blur when it changes. Its slot springs to the new height, so a message that wraps eases what is below it down instead of pushing it. */
  let { text, className }: { text?: string; className: string } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let slot: HTMLElement;
  let inner: HTMLElement;
  let follower: ReturnType<typeof followTextHeight> | undefined;

  onMount(() => {
    follower = followTextHeight(slot, inner, reduced);
    return () => follower?.destroy();
  });
  let last = text;
  $effect.pre(() => {
    if (last !== text) follower?.arm();
    last = text;
  });

  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const rise = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" })(node);
  const lift = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
</script>

<span bind:this={slot} class="mc-stepper__slot">
  <span bind:this={inner} class="mc-stepper__slotInner">
    {#if text}{#key `${className}:${text}`}<span class={className} in:rise out:lift>{text}</span>{/key}{/if}
  </span>
</span>
