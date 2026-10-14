<script lang="ts" module>
  import type { Component } from "svelte";

  export interface SwipeAction {
    label: string;
    /** The glyph drawn on the revealed action and in the More actions menu. */
    icon?: Component;
    /** Fill of the revealed action. Pair `danger` with a label that names the destructive result. */
    tone?: "neutral" | "accent" | "danger";
    /** Runs for a full swipe, a tap on the revealed action, or the More actions menu. Remove the item here unless `keepRow` is set. */
    onSelect: () => void;
    /** The row springs home after the action instead of sliding away and collapsing, for actions such as Mark as unread. */
    keepRow?: boolean;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import type { Snippet } from "svelte";
  import { getContext, onMount } from "svelte";
  import { DropdownMenu } from "bits-ui";
  import { MoreHorizontal } from "@lucide/svelte";
  import { ACTION, createSwipeRow, rowEnter, rowLeave, swipeGroupKey } from "@/lib/swipe-actions";
  import type { Side, SwipeGroup } from "@/lib/swipe-actions";

  /** One row. `leading` actions sit under the left edge and `trailing` actions under the right; the outermost action on each side commits on a full swipe. */
  interface Props {
    /** Names the row in its menu button, for example the message subject. */
    label: string;
    leading?: SwipeAction[];
    trailing?: SwipeAction[];
    /** Lets a long swipe commit the outermost action without a tap. On by default. */
    fullSwipe?: boolean;
    children?: Snippet;
    /** Extend the inner, named parts of the row: row, content, more, menu, item or itemIcon. */
    classNames?: { row?: string; content?: string; more?: string; menu?: string; item?: string; itemIcon?: string };
    class?: string;
    [key: string]: unknown;
  }

  let { label, leading = [], trailing = [], fullSwipe = true, children, classNames, class: className, ...rest }: Props = $props();

  const group = getContext<SwipeGroup>(swipeGroupKey);
  const id = $props.id();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

  let row = $state<HTMLElement>();
  let content = $state<HTMLElement>();
  let menuOpen = $state(false);
  let focusNeighbour = false;
  let controller = $state.raw<ReturnType<typeof createSwipeRow>>();

  const actionsOf = (side: Side) => (side === "leading" ? leading : trailing);
  const menuItems = $derived([...leading.map((action, index) => ({ action, side: "leading" as const, index })), ...trailing.map((action, index) => ({ action, side: "trailing" as const, index }))]);

  onMount(() => {
    const made = createSwipeRow({ row: row!, content: content! }, { id, reduced, leading: () => leading, trailing: () => trailing, fullSwipe: () => fullSwipe, group });
    controller = made;
    return () => made.destroy();
  });
  // Another row opened, or someone touched outside: put this one away.
  $effect(() => {
    void group.openId();
    controller?.closeForOthers();
  });
  $effect(() => {
    void [leading, trailing];
    queueMicrotask(() => controller?.repaint());
  });

  function onCloseAutoFocus(event: Event) {
    if (!focusNeighbour) return;
    focusNeighbour = false;
    event.preventDefault();
    controller?.focusNeighbour();
  }

  // The row opens its height and fades in, and collapses after its action ran. The motion drives the element itself; Svelte only keeps it alive.
  const rowIn = (node: HTMLElement) => ({ duration: rowEnter(node, reduced).ms });
  const rowOut = (node: HTMLElement) => ({ duration: rowLeave(node, reduced).ms });
</script>

<li bind:this={row} {...rest} class={cn("mc-swipe-actions__row", className, classNames?.row)} style:--swipe-action-width={`${ACTION}px`} in:rowIn|global out:rowOut|global>
  {#each ["leading", "trailing"] as const as side (side)}
    {#each actionsOf(side) as action, index (`${side}-${index}`)}
      {@const Icon = action.icon}
      <button type="button" tabindex="-1" aria-hidden="true" class="mc-swipe-actions__layer" data-layer data-side={side} data-index={index} data-tone={action.tone ?? "neutral"} onclick={() => controller?.commit(side, index)}>
        <span class="mc-swipe-actions__anchor">
          <span class="mc-swipe-actions__glyph">
            <span class="mc-swipe-actions__icon">{#if Icon}<Icon />{/if}</span>
            <span class="mc-swipe-actions__label">{action.label}</span>
          </span>
        </span>
      </button>
    {/each}
  {/each}
  <div bind:this={content} class={cn("mc-swipe-actions__content", classNames?.content)}>
    <div class="mc-swipe-actions__body">{@render children?.()}</div>
    {#if menuItems.length > 0}
      <DropdownMenu.Root bind:open={menuOpen}>
        <DropdownMenu.Trigger class={cn("mc-swipe-actions__more", classNames?.more)} data-swipe-more="" aria-label={`More actions for ${label}`} onclick={(event: MouseEvent) => { if (event.detail > 0) menuOpen = !menuOpen; }}>
          <MoreHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content class={cn("mc-swipe-actions__menu", classNames?.menu)} align="end" sideOffset={6} collisionPadding={12} loop onCloseAutoFocus={onCloseAutoFocus}>
            {#each menuItems as { action, side, index }, order (`${side}-${index}`)}
              {@const Icon = action.icon}
              <DropdownMenu.Item class={cn("mc-swipe-actions__item", classNames?.item)} data-tone={action.tone} style={`--i: ${order}`} onSelect={() => { focusNeighbour = !action.keepRow; controller?.commit(side, index); }}>
                <span class={cn("mc-swipe-actions__itemIcon", classNames?.itemIcon)} aria-hidden="true">{#if Icon}<Icon />{/if}</span>{action.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    {/if}
  </div>
</li>
