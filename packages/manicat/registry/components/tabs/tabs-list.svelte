<script lang="ts">
  // @manicat-dependencies bits-ui motion @lucide/svelte
  import { getContext, onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { Tabs } from "bits-ui";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { createSelectionGlide, createTabsScroll, tabsKey } from "@/lib/tabs-motion";
  import type { Edges, TabsState } from "@/lib/tabs-motion";

  let { class: className, children, ...rest }: { class?: string; children?: Snippet; [key: string]: unknown } = $props();

  const tabs = getContext<TabsState>(tabsKey);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let shell: HTMLElement;
  let viewport: HTMLElement;
  let list = $state<HTMLElement | null>(null);
  let edges = $state<Edges>({ overflow: false, left: false, right: false });
  let scroll: ReturnType<typeof createTabsScroll> | undefined;
  let glide: ReturnType<typeof createSelectionGlide> | undefined;

  const activeTab = () => list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]') ?? null;

  onMount(() => {
    scroll = createTabsScroll(shell, viewport, list!, { reduced, onEdges: (next) => (edges = next) });
    glide = createSelectionGlide(list!, { selectionClass: ["mc-tabs__selection", tabs.classNames()?.selection].filter(Boolean).join(" "), reduced });
    glide.update();
    scroll.reveal(activeTab());
    return () => {
      scroll?.destroy();
      glide?.destroy();
    };
  });
  $effect(() => {
    tabs.active();
    queueMicrotask(() => {
      glide?.update();
      scroll?.reveal(activeTab());
    });
  });
</script>

<div bind:this={shell} class={["mc-tabs__listShell", tabs.classNames()?.listShell]} data-overflow={edges.overflow} data-left={edges.left} data-right={edges.right}>
  {#if edges.overflow}
    <button type="button" class={["mc-tabs__scrollButton", "mc-tabs__scrollLeft", tabs.classNames()?.scrollButton]} aria-label="Scroll tabs left" disabled={!edges.left} onclick={() => scroll?.page(-1)}><ChevronLeft size={17} aria-hidden="true" /></button>
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={viewport} class={["mc-tabs__viewport", tabs.classNames()?.viewport]} onfocusincapture={(event) => { if (event.target instanceof HTMLElement && event.target.getAttribute("role") === "tab") scroll?.reveal(event.target); }}>
    <Tabs.List {...rest} bind:ref={list} class={["mc-tabs__list", className, tabs.classNames()?.list]}>{@render children?.()}</Tabs.List>
  </div>
  {#if edges.overflow}
    <button type="button" class={["mc-tabs__scrollButton", "mc-tabs__scrollRight", tabs.classNames()?.scrollButton]} aria-label="Scroll tabs right" disabled={!edges.right} onclick={() => scroll?.page(1)}><ChevronRight size={17} aria-hidden="true" /></button>
  {/if}
</div>
