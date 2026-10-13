<script lang="ts">
  // @manicat-dependencies bits-ui motion
  import { getContext } from "svelte";
  import type { Snippet } from "svelte";
  import { Tabs } from "bits-ui";
  import { poseTransition } from "@/lib/motion-dom";
  import { mountPanel, panelMotion, pinPanel, tabsKey } from "@/lib/tabs-motion";
  import type { TabsState } from "@/lib/tabs-motion";

  let { class: className, children, value, forceMount = false, ...rest }: { class?: string; children?: Snippet; value: string; forceMount?: boolean; [key: string]: unknown } = $props();

  const tabs = getContext<TabsState>(tabsKey);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selected = $derived(tabs.active() === value);

  // The incoming panel takes over the outgoing panel's height while it slides in from the side of the new tab.
  function panel(node: HTMLElement) {
    return mountPanel(node, tabs.memory, reduced);
  }
  function enter(node: HTMLElement) {
    const { from, to, timing } = panelMotion(tabs.direction(), reduced).enter;
    return poseTransition(from, to, timing)(node);
  }
  // The outgoing panel is pinned where it stood while it fades, so the new one takes its place at once.
  function leave(node: HTMLElement) {
    pinPanel(node, tabs.memory);
    const { from, to, timing } = panelMotion(tabs.direction(), reduced).leave;
    return poseTransition(to, from, timing)(node);
  }
</script>

{#if forceMount}
  <Tabs.Content {...rest} {value} class={["mc-tabs__content", className, tabs.classNames()?.content]}>{@render children?.()}</Tabs.Content>
{:else if selected}
  <Tabs.Content {...rest} {value}>
    {#snippet child({ props })}
      <div {...props} class={["mc-tabs__content", className, tabs.classNames()?.content]} use:panel in:enter out:leave>{@render children?.()}</div>
    {/snippet}
  </Tabs.Content>
{/if}
