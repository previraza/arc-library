<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { followWidth } from "@/lib/motion-dom";
  import type { WidthFollower } from "@/lib/motion-dom";

  /** Follows the width of its content. After `morphKey` changes the width springs from the old size to the new one, so a longer label grows the control instead of snapping it. */
  let { morphKey, children }: { morphKey: string; children?: Snippet } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame: HTMLElement;
  let content: HTMLElement;
  let follower: WidthFollower | undefined;
  onMount(() => {
    follower = followWidth(frame, content, reduced);
    return () => follower?.destroy();
  });
  let last = morphKey;
  $effect.pre(() => {
    if (last !== morphKey) follower?.arm();
    last = morphKey;
  });
</script>

<span bind:this={frame} class="mc-notification-center__morph"><span bind:this={content} class="mc-notification-center__morphContent">{@render children?.()}</span></span>
