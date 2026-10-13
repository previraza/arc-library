<script lang="ts" module>
  export interface AccordionItem {
    title: string;
    content: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    items: AccordionItem[];
    /** Index of the item open at first. */
    defaultOpen?: number;
    size?: "md" | "lg";
    /** Rich content: it receives the item and its index, and is used instead of `content`. */
    panel?: Snippet<[AccordionItem, number]>;
    /** Extend the inner, named parts of the accordion: item, trigger, icon, panel or panelInner. */
    classNames?: { item?: string; trigger?: string; icon?: string; panel?: string; panelInner?: string };
  }

  let { items, defaultOpen, size = "md", panel, classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let open = $state<number | undefined>(defaultOpen);
  const id = $props.id();
</script>

<div class={["mc-accordion", `mc-accordion--${size}`]}>
  {#each items as item, index (`${item.title}-${index}`)}
    <div class={["mc-accordion__item", classNames?.item]}>
      <h3 class="mc-accordion__header">
        <button
          type="button"
          id="{id}-trigger-{index}"
          class={["mc-accordion__trigger", classNames?.trigger]}
          aria-expanded={open === index}
          aria-controls="{id}-panel-{index}"
          data-state={open === index ? "open" : "closed"}
          onclick={() => (open = open === index ? undefined : index)}
        >
          <span>{item.title}</span>
          <svg class={["mc-accordion__icon", classNames?.icon]} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
        </button>
      </h3>
      <div id="{id}-panel-{index}" role="region" aria-labelledby="{id}-trigger-{index}" class={["mc-accordion__panel", classNames?.panel]} data-state={open === index ? "open" : "closed"}>
        <div class="mc-accordion__clip">
          <div class={["mc-accordion__inner", classNames?.panelInner]}>
            {#if panel}{@render panel(item, index)}{:else}{item.content}{/if}
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-accordion { width: 100%; border-top: 1px solid var(--border); }
.mc-accordion__item { border-bottom: 1px solid var(--border); }
.mc-accordion__header { margin: 0; }
.mc-accordion__trigger { display: flex; width: 100%; min-height: var(--control-height-lg); align-items: center; justify-content: space-between; gap: var(--space-5); padding: var(--space-2) 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-accordion__trigger:hover { color: var(--text-secondary); } .mc-accordion__trigger:hover .mc-accordion__icon { color: var(--foreground); } }
.mc-accordion__icon { flex: 0 0 auto; color: var(--text-muted); transition: transform .3s var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-accordion__trigger[data-state="open"] .mc-accordion__icon { color: var(--foreground); transform: rotate(180deg); }
/* The panel animates its height through grid rows, so it needs no measuring. */
.mc-accordion__panel { display: grid; grid-template-rows: 0fr; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); transition: grid-template-rows .3s var(--ease-standard); }
.mc-accordion__panel[data-state="open"] { grid-template-rows: 1fr; }
.mc-accordion__clip { overflow: hidden; min-height: 0; }
.mc-accordion__inner { overflow-wrap: anywhere; padding: 0 var(--space-8) var(--space-5) 0; }
.mc-accordion--lg .mc-accordion__trigger { min-height: 76px; gap: var(--space-8); padding-block: var(--space-5); font-size: var(--text-lg); letter-spacing: var(--tracking-body); }
.mc-accordion--lg .mc-accordion__panel { font-size: var(--text-base); line-height: 1.65; }
@media (prefers-reduced-motion: reduce) { .mc-accordion__icon, .mc-accordion__panel { transition: none; } }
}
</style>
