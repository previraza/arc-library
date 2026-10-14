<script lang="ts">
  // @manicat-dependencies bits-ui
  import { getContext } from "svelte";
  import { Tooltip as BitsTooltip } from "bits-ui";
  import FloatingButtonGroupButton from "@/registry/components/floating-button-group/floating-button-group-button.svelte";
  import Tooltip from "@/registry/components/tooltip/tooltip.svelte";
  import { groupKey } from "@/lib/floating-button-group";
  import type { GroupContext } from "@/lib/floating-button-group";

  /** One button of the group. Tooltips render no wrapper element, so every button stays a direct child of the tray and measures against it. */
  let { action }: { action: { id: string; label: string; icon?: import("svelte").Component; iconOnly?: boolean; shortcut?: string; disabled?: boolean; pressed?: boolean; reserveLabels?: readonly string[] } } = $props();

  const group = getContext<GroupContext>(groupKey);
  const iconOnly = $derived(!!action.icon && (action.iconOnly ?? group.iconOnly()));
  const tipped = $derived(iconOnly || !!action.shortcut);
  const sideways = $derived(group.side() === "left" || group.side() === "right");
</script>

{#snippet tip()}<span class="mc-floating-button-group__tip">{action.label}{#if action.shortcut}<kbd class="mc-floating-button-group__kbd">{action.shortcut}</kbd>{/if}</span>{/snippet}

{#if !tipped}
  <FloatingButtonGroupButton {action} {iconOnly} />
{:else if !sideways}
  <Tooltip side={group.side() as "top" | "bottom"}>
    {#snippet trigger({ props })}<FloatingButtonGroupButton {action} {iconOnly} {...props} />{/snippet}
    {#snippet body()}{@render tip()}{/snippet}
  </Tooltip>
{:else}
  <BitsTooltip.Root>
    <BitsTooltip.Trigger>
      {#snippet child({ props })}<FloatingButtonGroupButton {action} {iconOnly} {...props} />{/snippet}
    </BitsTooltip.Trigger>
    <BitsTooltip.Portal>
      <BitsTooltip.Content class="mc-floating-button-group__sideTip" side={group.side()} sideOffset={10} collisionPadding={12}>{@render tip()}</BitsTooltip.Content>
    </BitsTooltip.Portal>
  </BitsTooltip.Root>
{/if}
