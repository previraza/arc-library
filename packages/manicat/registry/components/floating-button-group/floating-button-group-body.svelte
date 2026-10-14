<script lang="ts">
  // @manicat-dependencies motion
  import type { Component } from "svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /**
   * Icon and label. Every label the item can show is laid out invisibly in the same grid cell, so the button always has the width
   * of the widest one: a label change crossfades in place and never resizes the button, its neighbours or the tray.
   */
  let { label, icon, iconOnly, reserve, classNames }: { label: string; icon?: Component; iconOnly: boolean; reserve: readonly string[]; classNames?: Record<string, string | undefined> } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const ghosts = $derived(iconOnly ? [] : Array.from(new Set([label, ...reserve])));
  const phaseIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: 4, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" });
  const phaseOut = (node: HTMLElement) => {
    node.setAttribute("aria-hidden", "true");
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -3, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  };
</script>

<span class={cn("mc-floating-button-group__slot", "slot")}>
  {#each ghosts as text (text)}
    <span class={cn("mc-floating-button-group__ghost", "ghost")} aria-hidden="true">
      {#if icon}<span class="mc-floating-button-group__iconSpace"></span>{/if}
      <span class={cn("mc-floating-button-group__text", "text")}>{text}</span>
    </span>
  {/each}
  {#key label}
    {@const Icon = icon}
    <span class="mc-floating-button-group__phase" in:phaseIn out:phaseOut>
      {#if Icon}<span class={cn("mc-floating-button-group__icon", "icon")} aria-hidden="true"><Icon /></span>{/if}
      {#if !iconOnly}<span class={cn("mc-floating-button-group__text", "text")}>{label}</span>{/if}
    </span>
  {/key}
</span>
