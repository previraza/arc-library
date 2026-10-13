<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** Accessible name announced while loading. */
    label?: string;
    lines?: number;
    avatar?: boolean;
    /** Shows the children instead of the placeholder once false. */
    loading?: boolean;
    /** Extend the inner, named parts of the skeleton: avatar, lines or line. */
    classNames?: { avatar?: string; lines?: string; line?: string };
    children?: Snippet;
  }

  let { label = "Loading", lines = 3, avatar = false, loading = true, classNames, children }: Props = $props();
</script>

{#if !loading && children}
  {@render children()}
{:else}
  <div class="mc-skeleton" role="status" aria-label={label} aria-busy="true">
    {#if avatar}<span class={["mc-skeleton__block", "mc-skeleton__avatar", classNames?.avatar]}></span>{/if}
    <div class={["mc-skeleton__lines", classNames?.lines]}>
      {#each { length: lines } as _, index (index)}
        <span class={["mc-skeleton__block", "mc-skeleton__line", classNames?.line]} style:--index={index}></span>
      {/each}
    </div>
  </div>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-skeleton { display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: var(--space-4); }
/* A calm, finite pulse: each block dims a beat after the one above it, then rests after about 20 seconds. */
.mc-skeleton__block { display: block; flex: 0 0 auto; border-radius: var(--radius-control); background: color-mix(in oklab, var(--border-strong) 38%, var(--surface)); animation: mc-skeleton-pulse 1.8s var(--ease-in-out) calc(var(--index, 0) * 90ms) 11 both; }
.mc-skeleton__avatar { width: var(--control-height-md); height: var(--control-height-md); border-radius: var(--radius-pill); }
.mc-skeleton__lines { display: grid; flex: 1; gap: var(--space-3); padding-top: var(--space-1); }
.mc-skeleton__line { width: 100%; height: var(--space-3); }
.mc-skeleton__line:first-child { width: 48%; height: var(--space-4); }
.mc-skeleton__line:last-child { width: 72%; }
@keyframes mc-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .52; } }
@media (prefers-reduced-motion: reduce) { .mc-skeleton__block { animation: none; } }
}
</style>
