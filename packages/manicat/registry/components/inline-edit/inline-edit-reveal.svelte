<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import { CircleAlert } from "@lucide/svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { createReveal, textPoses } from "@/lib/inline-edit";

  /** A message row that opens and closes its height on a spring while the words rise in, so an error never pushes the page in one frame. */
  let { id, message, reduced, onretry }: { id: string; message: { key: string; tone: "error" | "failed"; text: string } | null; reduced: boolean; onretry: () => void } = $props();
  let host = $state<HTMLElement>();
  let inner = $state<HTMLElement>();
  onMount(() => createReveal(host!, inner!, reduced));
  const textIn = (node: HTMLElement) => { const poses = textPoses(node, 1, reduced); return poseTransition(poses.from, poses.rest, poses.enterTiming)(node); };
  const textOut = (node: HTMLElement) => { const poses = textPoses(node, 1, reduced); return poseTransition(poses.out, poses.rest, poses.leaveTiming, { pop: true })(node); };
</script>

<span bind:this={host} class="mc-inline-edit__reveal">
  <span {id} bind:this={inner} class="mc-inline-edit__revealInner" aria-live="polite">
    {#if message}
      {#key message.key}
        <span class="mc-inline-edit__message" data-tone={message.tone} in:textIn out:textOut>
          <CircleAlert class="mc-inline-edit__messageIcon" size={14} strokeWidth={2} aria-hidden="true" />
          {#if message.tone === "error"}<span>{message.text}</span>{:else}<span>{message.text} <button type="button" class="mc-inline-edit__retry" onclick={onretry}>Try again</button></span>{/if}
        </span>
      {/key}
    {/if}
  </span>
</span>
