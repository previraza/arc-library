<script lang="ts">
  // @manicat-dependencies motion
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Text that changes in place: the new words rise in with a soft blur while the old ones leave upward, faster. */
  let { text }: { text: string } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const lineIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" })(node);
  const lineOut = (node: HTMLElement) => {
    node.setAttribute("aria-hidden", "true");
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  };
</script>

<span class="mc-notification-center__swap">{#key text}<span class="mc-notification-center__swapLine" in:lineIn out:lineOut>{text}</span>{/key}</span>
