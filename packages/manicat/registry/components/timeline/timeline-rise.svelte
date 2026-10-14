<script lang="ts">
  // @manicat-dependencies motion
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Text that changes in place: the new value rises in from a soft blur while the old one lifts away a little faster. */
  let { text, direction = 1, classNames }: { text: string; direction?: number; classNames?: Record<string, string | undefined> } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const riseIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3 * direction), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const riseOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3 * direction), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
</script>

<span class={cn("mc-timeline__rise", "rise")} aria-hidden="true">{#key text}<span class={cn("mc-timeline__riseLine", "riseLine")} in:riseIn out:riseOut>{text}</span>{/key}</span>
