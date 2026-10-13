<script lang="ts" module>
  export interface AccordionItem {
    title: string;
    /** Plain text of the panel. For anything richer, fill the `content` snippet, which receives the item and its index. */
    content?: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { Accordion } from "bits-ui";
  import { animate } from "motion";
  import { ChevronDown } from "@lucide/svelte";
  import { createCollapse } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    items: AccordionItem[];
    defaultOpen?: number;
    /** "lg" suits page-level FAQs: questions at the large text size, answers at body size. */
    size?: "md" | "lg";
    content?: Snippet<[AccordionItem, number]>;
    /** Extend the inner, named parts of the accordion: item, header, trigger, icon, panel or panelInner. */
    classNames?: { item?: string; header?: string; trigger?: string; icon?: string; panel?: string; panelInner?: string };
  }

  let { items, defaultOpen = 0, size = "md", content, classNames }: Props = $props();

  let openValue = $state(defaultOpen >= 0 && defaultOpen < items.length ? String(defaultOpen) : "");
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let panels: HTMLElement[] = $state([]);
  let inners: HTMLElement[] = $state([]);
  let icons: HTMLElement[] = $state([]);
  const controllers: ReturnType<typeof createCollapse>[] = [];
  let previous = openValue;
  let ready = false;

  onMount(() => {
    items.forEach((_, index) => {
      controllers[index] = createCollapse(panels[index], inners[index], { open: openValue === String(index), reduced });
      icons[index].style.transform = openValue === String(index) ? "rotate(180deg)" : "none";
    });
    ready = true;
    return () => controllers.forEach((controller) => controller.destroy());
  });
  $effect(() => {
    const next = openValue;
    if (!ready) return;
    controllers.forEach((controller, index) => controller.set(next === String(index)));
    icons.forEach((icon, index) => {
      const open = next === String(index);
      if (open === (previous === String(index))) return;
      if (reduced) icon.style.transform = open ? "rotate(180deg)" : "none";
      else animate(icon, { rotate: open ? 180 : 0 }, motionTokens.spring.snappy);
    });
    previous = next;
  });
</script>

<Accordion.Root bind:value={openValue} class={["mc-accordion__accordion", size === "lg" && "mc-accordion__lg"]} type="single">
  {#each items as item, index (`${item.title}-${index}`)}
    <Accordion.Item class={["mc-accordion__item", classNames?.item]} value={String(index)}>
      <Accordion.Header class={["mc-accordion__header", classNames?.header]}>
        <Accordion.Trigger class={["mc-accordion__trigger", classNames?.trigger]}>
          <span>{item.title}</span>
          <span bind:this={icons[index]} class={["mc-accordion__icon", classNames?.icon]}><ChevronDown size={17} aria-hidden="true" /></span>
        </Accordion.Trigger>
      </Accordion.Header>
      <!-- Bits UI keeps semantics and ids; the height is driven here, so a toggle mid-flight retargets instead of restarting. -->
      <Accordion.Content forceMount>
        {#snippet child({ props })}
          <div {...props} bind:this={panels[index]} class={["mc-accordion__panel", classNames?.panel]}>
            <div bind:this={inners[index]} class={["mc-accordion__panelInner", classNames?.panelInner]}>{#if content}{@render content(item, index)}{:else}{item.content}{/if}</div>
          </div>
        {/snippet}
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-accordion__accordion { width: 100%; border-top: 1px solid var(--border); }
.mc-accordion__item { border-bottom: 1px solid var(--border); }
.mc-accordion__header { margin: 0; }
.mc-accordion__trigger { display: flex; width: 100%; min-height: var(--control-height-lg); align-items: center; justify-content: space-between; gap: var(--space-5); padding: var(--space-2) 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-accordion__trigger:hover { color: var(--text-secondary); } .mc-accordion__trigger:hover .mc-accordion__icon { color: var(--foreground); } }
/* Rotation is driven by a spring in accordion.mc-accordion__tsx; CSS only handles color. */
.mc-accordion__icon { display: inline-flex; flex: 0 0 auto; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-accordion__trigger[data-state="open"] .mc-accordion__icon { color: var(--foreground); }
.mc-accordion__panel { overflow: hidden; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-accordion__panelInner { overflow-wrap: anywhere; padding: 0 var(--space-8) var(--space-5) 0; }
.mc-accordion__lg .mc-accordion__trigger { min-height: 76px; gap: var(--space-8); padding-block: var(--space-5); font-size: var(--text-lg); letter-spacing: var(--tracking-body); }
.mc-accordion__lg .mc-accordion__panel { font-size: var(--text-base); line-height: 1.65; }
.mc-accordion__lg .mc-accordion__panelInner { max-width: 62ch; padding: 0 var(--space-12) var(--space-6) 0; }
@media (max-width: 520px) { .mc-accordion__lg .mc-accordion__trigger { min-height: 68px; font-size: var(--text-base); } .mc-accordion__lg .mc-accordion__panel { font-size: var(--text-sm); } .mc-accordion__lg .mc-accordion__panelInner { padding-right: var(--space-6); } }
@media (prefers-reduced-motion: reduce) { .mc-accordion__trigger, .mc-accordion__icon { transition: none; } }
}
</style>
