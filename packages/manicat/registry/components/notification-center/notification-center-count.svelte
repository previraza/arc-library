<script lang="ts">
  // @manicat-dependencies motion
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Counts roll like an odometer: a higher number rises from below, a lower one drops from above. */
  let { value, display }: { value: number; display?: string } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let direction = 0;
  let previous = value;
  $effect.pre(() => {
    if (value !== previous) direction = value > previous ? 1 : -1;
    previous = value;
  });
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const rollIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, direction >= 0 ? 0.7 : -0.7), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { spring: "snappy", fade: duration.fast })(node);
  const rollOut = (node: HTMLElement) => {
    node.setAttribute("aria-hidden", "true");
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, direction >= 0 ? -0.7 : 0.7), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  };
</script>

<span class="mc-notification-center__roll">{#key display ?? String(value)}<span class="mc-notification-center__rollValue" in:rollIn out:rollOut>{display ?? value}</span>{/key}</span>
