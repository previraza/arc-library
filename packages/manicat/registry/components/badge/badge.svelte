<script lang="ts" module>
  export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger";
  export type BadgeSize = "sm" | "md";
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createAutoSize, createLabelSwap } from "@/lib/motion-dom";

  interface Props {
    tone?: BadgeTone;
    size?: BadgeSize;
    /** Draws the icon. Swapping it for another crossfades; re-rendering the same icon stays still. */
    icon?: Snippet;
    children?: Snippet;
    /** Extend the inner, named parts of the badge: body, content, icon, glyph, label or text. */
    classNames?: { body?: string; content?: string; icon?: string; glyph?: string; label?: string; text?: string };
  }

  let { tone = "neutral", size = "md", icon, children, classNames }: Props = $props();

  let body: HTMLElement;
  let content: HTMLElement;
  let iconBox: HTMLElement | undefined = $state();
  let glyph: HTMLElement | undefined = $state();
  let label: HTMLElement;
  let text: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  onMount(() => {
    // Width stays auto at rest. Only a new label or icon springs it from the old size to the new one.
    const autosize = createAutoSize(body, content, { axis: "width", reduced });
    const follower = { arm: () => autosize.changed(), destroy: () => undefined };
    const swaps = [createLabelSwap(label, label, text, { reduced, follower, variant: "badge" })];
    if (iconBox && glyph) swaps.push(createLabelSwap(iconBox, iconBox, glyph, { reduced, icon: true, follower, variant: "badge" }));
    return () => {
      swaps.forEach((swap) => swap.destroy());
      autosize.destroy();
    };
  });
</script>

<!-- The pill follows its content: text and icon swap in place while the width springs to the new size. -->
<span class={["mc-badge__badge", `mc-badge__${tone}`, `mc-badge__${size}`]}>
  <span bind:this={body} class={["mc-badge__body", classNames?.body]}>
    <span bind:this={content} class={["mc-badge__content", classNames?.content]}>
      {#if icon}<span bind:this={iconBox} class={["mc-badge__icon", classNames?.icon]} aria-hidden="true"><span bind:this={glyph} class={["mc-badge__glyph", classNames?.glyph]}>{@render icon()}</span></span>{/if}
      <span bind:this={label} class={["mc-badge__label", classNames?.label]}><span bind:this={text} class={["mc-badge__text", classNames?.text]}>{@render children?.()}</span></span>
    </span>
  </span>
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-badge__badge {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  border: 1px solid var(--badge-border, var(--border));
  border-radius: var(--radius-pill);
  padding: 0 10px;
  color: var(--badge-foreground, var(--foreground));
  background: var(--badge-background, var(--surface));
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: -.01em;
  line-height: 1;
  white-space: nowrap;
  /* Clip keeps the inline baseline while the pill morphs around swapped text. */
  overflow: clip;
  transition: border-color var(--duration-standard) var(--ease-standard), background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .mc-badge__badge:hover { border-color: color-mix(in oklab, var(--badge-color, var(--foreground)) 32%, var(--border)); background: color-mix(in oklab, var(--badge-color, var(--foreground)) 10%, var(--surface)); }
}
.mc-badge__sm { min-height: 22px; padding: 0 8px; font-size: 11px; }
.mc-badge__md { font-size: var(--text-xs); }

.mc-badge__body { display: block; }
.mc-badge__content { position: relative; display: inline-flex; width: max-content; align-items: center; gap: 5px; }
.mc-badge__sm .mc-badge__content { gap: 4px; }
.mc-badge__label, .mc-badge__glyph { position: relative; display: inline-flex; align-items: center; }
.mc-badge__text { display: block; }

.mc-badge__icon {
  position: relative;
  display: inline-flex;
  width: auto;
  height: auto;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: var(--badge-color, var(--foreground));
  line-height: 1;
}

.mc-badge__neutral { --badge-color: var(--text-secondary); --badge-foreground: var(--text-secondary); --badge-background: var(--surface-muted); --badge-border: var(--border); }
.mc-badge__success { --badge-color: var(--success); --badge-foreground: var(--success); --badge-background: color-mix(in oklab, var(--success) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--success) 25%, var(--border)); }
.mc-badge__info { --badge-color: var(--accent); --badge-foreground: var(--accent-strong); --badge-background: var(--accent-subtle); --badge-border: color-mix(in oklab, var(--accent) 24%, var(--border)); }
.mc-badge__warning { --badge-color: var(--warning); --badge-foreground: var(--warning); --badge-background: color-mix(in oklab, var(--warning) 11%, var(--surface)); --badge-border: color-mix(in oklab, var(--warning) 27%, var(--border)); }
.mc-badge__danger { --badge-color: var(--danger); --badge-foreground: var(--danger); --badge-background: color-mix(in oklab, var(--danger) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--danger) 26%, var(--border)); }

@media (prefers-reduced-motion: reduce) {
  .mc-badge__badge { transition-duration: var(--duration-instant); }
}
}
</style>
