<script lang="ts">
  // @manicat-dependencies motion
  import { poseTransition } from "@/lib/motion-dom";
  import { risePoses } from "@/lib/usage-meter";

  /** Changed text rises from a soft blur and leaves a little faster than it arrives. */
  let { text, direction = 1, classNames }: { text: string; direction?: number; classNames?: Record<string, string | undefined> } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const swapIn = (node: HTMLElement) => { const poses = risePoses(node, direction, reduced); return poseTransition(poses.from, poses.rest, poses.enterTiming)(node); };
  const swapOut = (node: HTMLElement) => { const poses = risePoses(node, direction, reduced); return poseTransition(poses.out, poses.rest, poses.leaveTiming, { pop: true })(node); };
</script>

<span class={cn("mc-usage-meter__swap", "swap")}>{#key text}<span class={cn("mc-usage-meter__swapText", "swapText")} in:swapIn out:swapOut>{text}</span>{/key}</span>
