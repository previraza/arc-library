<script lang="ts">
  // @manicat-dependencies motion
  import { tick } from "svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    name: string;
    src?: string;
    size?: "sm" | "md" | "lg" | "xl";
    status?: "online" | "offline";
    class?: string;
    /** Extend the inner, named parts of the avatar: fallback. */
    classNames?: { fallback?: string };
  }

  let { name, src, size = "md", status, class: className, classNames }: Props = $props();

  const initials = $derived(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let image: HTMLImageElement | undefined = $state();
  let failedSrc = $state<string>();
  const showImage = $derived(src && failedSrc !== src);

  // A photo that is already decoded shows at once. One that is still loading waits, then fades in from a soft blur.
  $effect(() => {
    void src;
    tick().then(() => {
      if (image && !image.complete) image.dataset.loading = "";
    });
  });

  // The status dot scales in on a spring and out a little faster.
  const dot = { opacity: 0, scale: 0.6 };
  const rest = { opacity: 1, scale: 1 };
  const enter = poseTransition(dot, rest, reduced ? { duration: 0 } : { spring: "snappy" });
  const leave = poseTransition(dot, rest, { duration: reduced ? 0 : motionTokens.duration.fast, ease: "standard" });
</script>

<span class={["mc-avatar__avatar", `mc-avatar__${size}`, className]} role="img" aria-label={`${name}${status ? `, ${status}` : ""}`}>
  {#if showImage}
    {#key src}
      <img bind:this={image} {src} alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; color: transparent" onload={(event) => event.currentTarget.removeAttribute("data-loading")} onerror={() => (failedSrc = src)} />
    {/key}
  {:else}
    <span class={[src && "mc-avatar__fallback", classNames?.fallback]} aria-hidden="true">{initials}</span>
  {/if}
  {#if status}
    {#key status}
      <i class={["mc-avatar__status", `mc-avatar__${status}`]} aria-hidden="true" in:enter out:leave></i>
    {/key}
  {/if}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar__avatar {
  position: relative;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  overflow: visible;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-muted);
  color: var(--foreground);
  font-size: var(--text-xs);
  font-weight: 500;
}

.mc-avatar__avatar img {
  pointer-events: none;
  border-radius: inherit;
  object-fit: cover;
  transition: opacity var(--duration-standard) var(--ease-enter), filter var(--duration-standard) var(--ease-enter);
}

/* Set only while a photo is still downloading after mount, so cached photos never fade. */
.mc-avatar__avatar img[data-loading] {
  opacity: 0;
  filter: blur(4px);
  transition: none;
}

.mc-avatar__fallback { animation: mc-avatar-avatar-fallback-in var(--duration-standard) var(--ease-enter) both; }

.mc-avatar__sm { width: 28px; height: 28px; font-size: 10px; }
.mc-avatar__md { width: 36px; height: 36px; }
.mc-avatar__lg { width: 48px; height: 48px; font-size: var(--text-sm); }
.mc-avatar__xl { width: 88px; height: 88px; font-size: var(--text-xl); }

.mc-avatar__status {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 10px;
  height: 10px;
  border: 2px solid var(--surface);
  border-radius: var(--radius-pill);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--border) 70%, transparent);
}

.mc-avatar__sm .mc-avatar__status { width: 8px; height: 8px; border-width: 1.5px; }
.mc-avatar__lg .mc-avatar__status { width: 12px; height: 12px; }
.mc-avatar__xl .mc-avatar__status { width: 14px; height: 14px; right: 4px; bottom: 4px; }
.mc-avatar__online { background: var(--success); }
.mc-avatar__offline { background: var(--text-muted); }

@keyframes mc-avatar-avatar-fallback-in { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .mc-avatar__avatar img { transition: none; }
  .mc-avatar__avatar img[data-loading] { filter: none; }
  .mc-avatar__fallback { animation: none; }
}
}
</style>
