<script lang="ts">
  // @manicat-dependencies bits-ui
  import { getContext } from "svelte";
  import type { Snippet } from "svelte";
  import { Tabs } from "bits-ui";
  import { tabsKey } from "@/lib/tabs-motion";
  import type { TabsState } from "@/lib/tabs-motion";

  let { class: className, children, value, ...rest }: { class?: string; children?: Snippet; value: string; disabled?: boolean; [key: string]: unknown } = $props();

  const tabs = getContext<TabsState>(tabsKey);
</script>

<!-- The highlight is one box that the tab list moves into the active trigger, so it glides between triggers. -->
<Tabs.Trigger {...rest} {value} data-value={value} class={["mc-tabs__trigger", className, tabs.classNames()?.trigger]}>
  <span class={["mc-tabs__triggerLabel", tabs.classNames()?.triggerLabel]}>{@render children?.()}</span>
</Tabs.Trigger>
