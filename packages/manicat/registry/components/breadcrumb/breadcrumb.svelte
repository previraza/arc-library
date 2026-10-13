<script lang="ts" module>
  export interface BreadcrumbItem {
    label: string;
    href?: string;
    /** Runs when the crumb is chosen. Without an href the crumb renders as a button, for paths that live in local state. */
    onclick?: (event: MouseEvent) => void;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { flip } from "svelte/animate";
  import { ChevronRight } from "@lucide/svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    items: BreadcrumbItem[];
    ariaLabel?: string;
    /** Extend the inner, named parts of the breadcrumb: list. */
    classNames?: { list?: string };
  }

  let { items, ariaLabel = "Breadcrumb", classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Crumbs present on first render stay still; crumbs added later slide in from the path before them.
  const rest = { opacity: 1, x: 0, blur: 0 };
  const enter = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, x: -8, blur: motionTokens.blur.subtle }, rest, reduced ? { duration: 0 } : { duration: motionTokens.duration.standard, ease: "enter" });
  const leave = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, x: -4, blur: motionTokens.blur.subtle }, rest, { duration: reduced ? 0 : motionTokens.duration.instant, ease: "standard" }, { pop: true });
</script>

<nav aria-label={ariaLabel}>
  <ol class={["mc-breadcrumb__list", classNames?.list]}>
    {#each items as item, index (`${item.label}-${index}`)}
      {@const current = index === items.length - 1}
      <li in:enter|global out:leave animate:flip={{ duration: reduced ? 0 : 400 }}>
        {#if index > 0}<ChevronRight size={14} aria-hidden="true" />{/if}
        {#if !current && item.href}
          <a href={item.href} data-label={item.label} onclick={item.onclick}>{item.label}</a>
        {:else if !current && item.onclick}
          <button type="button" data-label={item.label} onclick={item.onclick}>{item.label}</button>
        {:else}
          <span aria-current={current ? "page" : undefined} data-label={item.label}>{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The gap between crumbs matches the gap inside one, so every chevron sits centered between its two labels. */
.mc-breadcrumb__list { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; margin: 0; padding: 0; list-style: none; }
.mc-breadcrumb__list li { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); white-space: nowrap; }
.mc-breadcrumb__list li > svg { width: 16px; height: 16px; flex: 0 0 auto; color: var(--border-strong); stroke-width: 1.75; }
/* Each crumb reserves the width of its medium weight label, so becoming the current page never shifts the path. */
.mc-breadcrumb__list a, .mc-breadcrumb__list li > span, .mc-breadcrumb__list li > button { display: inline-flex; flex-direction: column; border-radius: 7px; padding: 4px 2px; }
.mc-breadcrumb__list a::after, .mc-breadcrumb__list li > span::after, .mc-breadcrumb__list li > button::after { height: 0; overflow: hidden; content: attr(data-label); font-weight: 500; visibility: hidden; user-select: none; pointer-events: none; }
.mc-breadcrumb__list li > button { border: 0; margin: 0; background: none; font: inherit; line-height: inherit; text-align: start; cursor: pointer; }
.mc-breadcrumb__list a, .mc-breadcrumb__list li > button { color: var(--text-secondary); text-decoration: underline 1px; text-decoration-color: transparent; text-underline-offset: 4px; transition: color var(--duration-fast) var(--ease-standard), text-decoration-color var(--duration-fast) var(--ease-standard); }
.mc-breadcrumb__list [aria-current="page"] { color: var(--accent-strong); font-weight: 500; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-breadcrumb__list a:hover, .mc-breadcrumb__list li > button:hover { color: var(--accent-strong); text-decoration-color: color-mix(in oklab, currentColor 45%, transparent); } }
@media (prefers-reduced-motion: reduce) { .mc-breadcrumb__list a, .mc-breadcrumb__list li > button, .mc-breadcrumb__list [aria-current="page"] { transition: none; } }
}
</style>
