<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createAutoSize, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label?: string;
    lines?: number;
    avatar?: boolean;
    /** Keeps the placeholder visible while true. Only used when the content to reveal is given. */
    loading?: boolean;
    /** The content to reveal once loading finishes. With it, the placeholder crossfades into it. */
    children?: Snippet;
    /** Extend the inner, named parts of the skeleton: avatar, lines, line or frame. */
    classNames?: { avatar?: string; lines?: string; line?: string; frame?: string };
  }

  let { label = "Loading content", lines = 3, avatar = false, loading = true, children, classNames }: Props = $props();

  const count = $derived(Math.min(Math.max(Math.floor(lines), 1), 6));
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame: HTMLElement | undefined = $state();
  let content: HTMLElement | undefined = $state();
  let size: ReturnType<typeof createAutoSize> | undefined;

  // The frame follows its content height; a change of loading springs it from the old height to the new one.
  onMount(() => {
    if (frame && content) size = createAutoSize(frame, content, { axis: "height", reduced });
    return () => size?.destroy();
  });
  $effect.pre(() => {
    void loading;
    size?.changed();
  });

  const fast = reduced ? motionTokens.duration.instant : motionTokens.duration.fast;
  const placeholderIn = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: fast, ease: "standard" });
  const placeholderOut = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: fast }, { pop: true });
  const contentIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.standard, ease: "enter" });
  const contentOut = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: fast }, { pop: true });
</script>

{#snippet placeholder()}
  <div class="mc-skeleton__root" role="status" aria-label={label} aria-busy="true">
    {#if avatar}<span class={["mc-skeleton__avatar", classNames?.avatar]} aria-hidden="true"></span>{/if}
    <span class={["mc-skeleton__lines", classNames?.lines]} aria-hidden="true">
      {#each { length: count } as _, index (index)}
        <span class={["mc-skeleton__line", classNames?.line]} style={`--index: ${index + (avatar ? 1 : 0)}`}></span>
      {/each}
    </span>
  </div>
{/snippet}

{#if !children}
  {@render placeholder()}
{:else}
  <div bind:this={frame} aria-busy={loading}>
    <div bind:this={content} class={["mc-skeleton__frame", classNames?.frame]}>
      {#if loading}
        <div in:placeholderIn out:placeholderOut>{@render placeholder()}</div>
      {:else}
        <div in:contentIn out:contentOut>{@render children()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-skeleton__root { display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: var(--space-4); }
/* A calm, finite pulse: each block dims a beat after the one above it, then rests after about 20 seconds. */
.mc-skeleton__avatar, .mc-skeleton__line { display: block; flex: 0 0 auto; border-radius: var(--radius-control); background: color-mix(in oklab, var(--border-strong) 38%, var(--surface)); animation: mc-skeleton-skeleton-pulse 1.8s var(--ease-in-out) calc(var(--index, 0) * 90ms) 11 both; }
.mc-skeleton__avatar { width: var(--control-height-md); height: var(--control-height-md); border-radius: var(--radius-pill); }
.mc-skeleton__lines { display: grid; flex: 1; gap: var(--space-3); padding-top: var(--space-1); }
.mc-skeleton__line { width: 100%; height: var(--space-3); }
.mc-skeleton__line:first-child { width: 48%; height: var(--space-4); }
.mc-skeleton__line:last-child { width: 72%; }
.mc-skeleton__frame { position: relative; display: flow-root; }
@keyframes mc-skeleton-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .52; } }
@media (prefers-reduced-motion: reduce) { .mc-skeleton__avatar, .mc-skeleton__line { animation: none; } }
}
</style>
