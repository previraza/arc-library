<script lang="ts" module>
  import type { Component } from "svelte";

  export interface DropdownItem {
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    icon?: Component;
    destructive?: boolean;
    separatorBefore?: boolean;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { DropdownMenu } from "bits-ui";
  import { ChevronDown } from "@lucide/svelte";
  import { createLabelSwap, createMenuHighlight, followWidth } from "@/lib/motion-dom";

  interface Props {
    label: string;
    items: DropdownItem[];
    /** Draws the icon before the label. */
    icon?: Snippet;
    /** Extend the inner, named parts of the dropdown menu: triggerIcon, chevron, menu, highlight, separator, item or icon. */
    classNames?: { triggerIcon?: string; chevron?: string; menu?: string; highlight?: string; separator?: string; item?: string; icon?: string };
  }

  let { label, items, icon, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let labelBox: HTMLElement;
  let labelMeasure: HTMLElement;
  let labelText: HTMLElement;

  const cn = (base: string, ...extra: (string | false | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

  // A new trigger label rises in while the old one leaves, and the trigger width springs to the measured text instead of snapping.
  onMount(() => {
    const follower = followWidth(labelBox, labelMeasure, reduced);
    const swap = createLabelSwap(labelBox, labelBox, labelText, { reduced, follower, variant: "badge" });
    return () => {
      swap.destroy();
      follower.destroy();
    };
  });

  // One highlight glides between items for the pointer and jumps instantly for the keyboard.
  function highlighted(node: HTMLElement) {
    const menu = node.parentElement ? createMenuHighlight(node.parentElement, node, { reduced }) : undefined;
    return { destroy: () => menu?.destroy() };
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="mc-dropdown-menu__trigger" type="button">
    {#if icon}<span class={["mc-dropdown-menu__triggerIcon", classNames?.triggerIcon]} aria-hidden="true">{@render icon()}</span>{/if}
    <span bind:this={labelBox} class="mc-dropdown-menu__label">
      <span bind:this={labelMeasure} class="mc-dropdown-menu__labelMeasure" aria-hidden="true">{label}</span>
      <span bind:this={labelText} class="mc-dropdown-menu__labelText">{label}</span>
    </span>
    <ChevronDown class={["mc-dropdown-menu__chevron", classNames?.chevron]} size={15} strokeWidth={1.8} aria-hidden="true" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class={["mc-dropdown-menu__menu", classNames?.menu]} sideOffset={6} align="end" collisionPadding={12} loop>
      <span use:highlighted class={["mc-dropdown-menu__highlight", classNames?.highlight]} aria-hidden="true"></span>
      {#each items as item, index (item.label)}
        {#if item.separatorBefore}<DropdownMenu.Separator class={["mc-dropdown-menu__separator", classNames?.separator]} />{/if}
        <DropdownMenu.Item class={["mc-dropdown-menu__item", item.destructive && "mc-dropdown-menu__destructive", classNames?.item]} data-tone={item.destructive ? "danger" : undefined} style={`--i: ${index}`} disabled={item.disabled} onSelect={() => item.onSelect?.()}>
          {#if item.icon}{@const Icon = item.icon}<span class={["mc-dropdown-menu__icon", classNames?.icon]} aria-hidden="true"><Icon size={16} /></span>{/if}
          {item.label}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-dropdown-menu__trigger { display: inline-flex; max-width: 100%; min-height: var(--control-height-sm); align-items: center; gap: var(--space-2); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-instant) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-dropdown-menu__trigger:hover { border-color: var(--border-strong); background: var(--surface-muted); box-shadow: var(--shadow-resting); } }
/* The trigger anchors the menu, so press feedback stays in color. A scaled rect would be measured on pointerdown and shift the menu. */
.mc-dropdown-menu__trigger[data-state="open"] { border-color: var(--border-strong); background: var(--surface-muted); box-shadow: none; }
.mc-dropdown-menu__trigger:active { border-color: var(--border-strong); background: color-mix(in oklab, var(--surface-muted), var(--border) 55%); box-shadow: none; }
.mc-dropdown-menu__trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-dropdown-menu__item:focus-visible { outline: none; }
.mc-dropdown-menu__triggerIcon { display: inline-flex; flex: none; color: var(--text-secondary); }
.mc-dropdown-menu__label { position: relative; display: inline-flex; min-width: 0; flex: 0 1 auto; overflow-x: clip; }
.mc-dropdown-menu__labelMeasure { position: absolute; top: 0; left: 0; visibility: hidden; white-space: nowrap; pointer-events: none; }
.mc-dropdown-menu__labelText { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-dropdown-menu__chevron { flex: none; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard); }
.mc-dropdown-menu__trigger[data-state="open"] .mc-dropdown-menu__chevron { transform: rotate(180deg); }
/* The menu grows from the trigger edge: offset toward the trigger, scale from the Radix origin, fade quickly.
   Transitions instead of keyframes, so a close that interrupts the open (or a reopen during the close) reverses from where it is. */
.mc-dropdown-menu__menu { --menu-x: 0px; --menu-y: -5px; position: relative; z-index: 60; min-width: min(12rem, var(--bits-dropdown-menu-content-available-width)); max-width: var(--bits-dropdown-menu-content-available-width); padding: 5px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: var(--bits-dropdown-menu-content-transform-origin); transition: opacity var(--duration-fast) var(--ease-enter), transform var(--duration-spring) var(--ease-spring); }
.mc-dropdown-menu__menu[data-side="top"] { --menu-y: 5px; }
.mc-dropdown-menu__menu[data-side="left"] { --menu-x: 5px; --menu-y: 0px; }
.mc-dropdown-menu__menu[data-side="right"] { --menu-x: -5px; --menu-y: 0px; }
@starting-style {
  .mc-dropdown-menu__menu[data-state="open"] { opacity: 0; transform: translate(var(--menu-x), var(--menu-y)) scale(.97); }
  .mc-dropdown-menu__menu[data-state="open"] .mc-dropdown-menu__item { opacity: 0; transform: translate(calc(var(--menu-x) * .4), calc(var(--menu-y) * .4)); }
}
/* Radix unmounts when the exit animation ends, so a no-op keyframe times the exit while the transition does the visual work. */
.mc-dropdown-menu__menu[data-state="closed"] { opacity: 0; transform: translate(calc(var(--menu-x) * .5), calc(var(--menu-y) * .5)) scale(.985); transition: opacity 130ms var(--ease-standard), transform 130ms var(--ease-standard); animation: mc-dropdown-menu-menu-exit 130ms linear both; pointer-events: none; }
.mc-dropdown-menu__highlight { position: absolute; top: 0; right: 5px; left: 5px; border-radius: calc(var(--radius-panel) - 6px); background: var(--surface-muted); opacity: 0; pointer-events: none; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-dropdown-menu__highlight[data-tone="danger"] { background: color-mix(in oklab, var(--danger) 8%, var(--surface)); }
.mc-dropdown-menu__item { position: relative; display: flex; min-height: 36px; align-items: center; gap: 10px; padding: 0 11px; border-radius: calc(var(--radius-panel) - 6px); color: var(--foreground); font-size: var(--text-sm); cursor: pointer; outline: none; transition: color var(--duration-fast) var(--ease-standard), opacity var(--duration-standard) var(--ease-enter) calc(min(var(--i, 0), 4) * 35ms), transform var(--duration-standard) var(--ease-enter) calc(min(var(--i, 0), 4) * 35ms); }
.mc-dropdown-menu__icon { display: inline-flex; width: 17px; color: var(--text-secondary); }
.mc-dropdown-menu__separator { height: 1px; margin: var(--space-1) calc(var(--space-1) * -1); background: var(--border-subtle); }
.mc-dropdown-menu__destructive { color: var(--danger); }
.mc-dropdown-menu__destructive .mc-dropdown-menu__icon { color: var(--danger); }
.mc-dropdown-menu__item[data-disabled] { opacity: .45; cursor: default; }
@keyframes mc-dropdown-menu-menu-exit { to { --menu-exit: 1; } }
@media (prefers-reduced-transparency: reduce) { .mc-dropdown-menu__menu { background: var(--surface-raised); backdrop-filter: none; -webkit-backdrop-filter: none; } }
@media (prefers-reduced-motion: reduce) {
  .mc-dropdown-menu__trigger, .mc-dropdown-menu__chevron, .mc-dropdown-menu__item, .mc-dropdown-menu__highlight { transition: none; }
  .mc-dropdown-menu__menu, .mc-dropdown-menu__menu[data-state="closed"] { transform: none; transition: opacity var(--duration-instant) linear; }
}
}
</style>
