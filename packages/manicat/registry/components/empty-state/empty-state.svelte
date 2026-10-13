<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { Folder } from "@lucide/svelte";
  import { createAutoSize, createLabelSwap } from "@/lib/motion-dom";

  interface Props {
    title: string;
    description: string;
    /** Accessible label for the state region. */
    label?: string;
    /** Draws the icon. Swapping it for another crossfades. */
    icon?: Snippet;
    /** The action: buttons, links. */
    children?: Snippet;
    /** Extend the inner, named parts of the empty state: icon, glyph, line or action. */
    classNames?: { icon?: string; glyph?: string; line?: string; action?: string };
  }

  let { title, description, label, icon, children, classNames }: Props = $props();

  let frame: HTMLElement;
  let copy: HTMLElement;
  let iconBox: HTMLElement;
  let glyph: HTMLElement;
  let titleBox: HTMLElement;
  let titleLine: HTMLElement;
  let descriptionBox: HTMLElement;
  let descriptionLine: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let size: ReturnType<typeof createAutoSize> | undefined;

  // The result of an action morphs in place: the icon crossfades and the copy rises in while the old copy leaves.
  onMount(() => {
    size = createAutoSize(frame, copy, { axis: "height", reduced });
    const follower = { arm: () => size?.changed(), destroy: () => undefined };
    const swaps = [
      createLabelSwap(iconBox, iconBox, glyph, { reduced, icon: true, width: false, variant: "badge" }),
      createLabelSwap(titleBox, titleBox, titleLine, { reduced, follower, variant: "badge" }),
      createLabelSwap(descriptionBox, descriptionBox, descriptionLine, { reduced, follower, variant: "badge" }),
    ];
    return () => {
      swaps.forEach((swap) => swap.destroy());
      size?.destroy();
    };
  });
  $effect.pre(() => {
    void title;
    void description;
    size?.changed();
  });
</script>

<section class="mc-empty-state__root" aria-label={label}>
  <div bind:this={iconBox} class={["mc-empty-state__icon", classNames?.icon]} aria-hidden="true">
    <span bind:this={glyph} class={["mc-empty-state__glyph", classNames?.glyph]}>{#if icon}{@render icon()}{:else}<Folder size={24} strokeWidth={1.5} />{/if}</span>
  </div>
  <div bind:this={frame} class="mc-empty-state__frame">
    <div bind:this={copy} class="mc-empty-state__copy">
      <h3 bind:this={titleBox}><span bind:this={titleLine} class={["mc-empty-state__line", classNames?.line]}>{title}</span></h3>
      <p bind:this={descriptionBox}><span bind:this={descriptionLine} class={["mc-empty-state__line", classNames?.line]}>{description}</span></p>
    </div>
  </div>
  {#if children}<div class={["mc-empty-state__action", classNames?.action]}>{@render children()}</div>{/if}
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-empty-state__root { display: flex; width: 100%; flex-direction: column; align-items: center; padding: clamp(var(--space-8), 8vw, var(--space-12)) var(--space-5); text-align: center; }
.mc-empty-state__icon { position: relative; display: grid; width: var(--space-12); height: var(--space-12); place-items: center; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-muted); color: var(--text-secondary); animation: mc-empty-state-empty-state-icon var(--duration-considered) var(--ease-enter) both; }
.mc-empty-state__glyph { display: grid; place-items: center; }
.mc-empty-state__frame { width: 100%; max-width: 100%; }
.mc-empty-state__copy { display: flow-root; }
.mc-empty-state__root h3 { position: relative; margin: var(--space-5) 0 0; color: var(--foreground); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); }
.mc-empty-state__root p { position: relative; max-width: 18rem; margin: var(--space-2) auto 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
/* Centered copy wraps into even lines, so a new description never leaves a single word hanging. */
.mc-empty-state__line { display: block; text-wrap: balance; }
.mc-empty-state__action { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); margin-top: var(--space-5); }
/* The icon settles in once when the state first appears; later changes crossfade in place. */
@keyframes mc-empty-state-empty-state-icon { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .mc-empty-state__icon { animation: none; } }
}
</style>
