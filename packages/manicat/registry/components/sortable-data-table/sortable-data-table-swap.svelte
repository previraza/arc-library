<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { createSwapWidth, swapPoses } from "@/lib/sortable-data-table";

  /** Text that changes in place. The slot eases to the new width, so the words beside it never jump. */
  let { value, direction, class: className }: { value: string; direction: number; class?: string } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let slot = $state<HTMLElement>();
  let inner = $state<HTMLElement>();
  onMount(() => createSwapWidth(slot!, inner!, reduced));

  const swapIn = (node: HTMLElement) => {
    const poses = swapPoses(node, direction, reduced);
    return poseTransition(poses.enter, poses.shown, poses.enterTiming)(node);
  };
  // Lifts out of the flow where it stands, so the new text takes its place at once.
  const swapOut = (node: HTMLElement) => {
    const poses = swapPoses(node, direction, reduced);
    return poseTransition(poses.gone, poses.shown, poses.leaveTiming, { pop: true })(node);
  };
</script>

<span bind:this={slot} class={["mc-sortable-data-table__swap", className]}>
  <span bind:this={inner} class="mc-sortable-data-table__swapInner">
    {#key value}<span class="mc-sortable-data-table__swapText" in:swapIn out:swapOut>{value}</span>{/key}
  </span>
</span>
