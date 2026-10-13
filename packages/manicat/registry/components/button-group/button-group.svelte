<script lang="ts" module>
  export type ButtonGroupVariant = "outline" | "solid";
  export type ButtonGroupSize = "sm" | "md";

  export interface ButtonGroupItem {
    id: string;
    /** Visible text and the accessible name. */
    label: string;
    /** Shows only the `icon` snippet; the label stays the accessible name. */
    iconOnly?: boolean;
    disabled?: boolean;
    href?: string;
  }

  export interface ButtonGroupMenuItem {
    id: string;
    label: string;
    disabled?: boolean;
    onSelect?: () => void;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    items: ButtonGroupItem[];
    /** An overflow menu behind a chevron segment. `label` is its accessible name. */
    menu?: { label: string; items: ButtonGroupMenuItem[] };
    label: string;
    variant?: ButtonGroupVariant;
    size?: ButtonGroupSize;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    onselect?: (id: string) => void;
    /** Draws a segment's icon. It receives the segment's id. */
    icon?: Snippet<[string]>;
    /** Extend the inner, named parts of the group: segment or menuContent. */
    classNames?: { segment?: string; menuContent?: string };
  }

  let { items, menu, label, variant = "outline", size = "md", orientation = "horizontal", disabled = false, onselect, icon, classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let active = $state(-1);

  async function focusItem(index: number) {
    active = index;
    await tick();
    document.getElementById(`${id}-item-${index}`)?.focus();
  }

  function hide(refocus = false) {
    open = false;
    active = -1;
    if (refocus) document.getElementById(`${id}-menu-toggle`)?.focus();
  }

  function chooseMenu(index: number) {
    const entry = menu?.items[index];
    if (!entry || entry.disabled) return;
    hide(true);
    entry.onSelect?.();
    onselect?.(entry.id);
  }

  function showMenu() {
    open = true;
    focusItem(0);
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const total = menu?.items.length ?? 0;
    if (event.key === "ArrowDown") focusItem((active + 1) % total);
    else if (event.key === "ArrowUp") focusItem((active - 1 + total) % total);
    else if (event.key === "Escape") hide(true);
    else if (event.key === "Tab") hide();
    else return;
    event.preventDefault();
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) hide();
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class={["mc-bgroup", `mc-bgroup--${variant}`, `mc-bgroup--${size}`, `mc-bgroup--${orientation}`]} role="toolbar" aria-label={label}>
  {#each items as item (item.id)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <svelte:element
      this={item.href ? "a" : "button"}
      href={item.href}
      type={item.href ? undefined : "button"}
      class={["mc-bgroup__segment", classNames?.segment]}
      aria-label={item.iconOnly ? item.label : undefined}
      title={item.iconOnly ? item.label : undefined}
      disabled={disabled || item.disabled || undefined}
      onclick={() => onselect?.(item.id)}
    >
      {@render icon?.(item.id)}
      {#if !item.iconOnly}<span>{item.label}</span>{/if}
    </svelte:element>
  {/each}
  {#if menu}
    <button
      id="{id}-menu-toggle"
      type="button"
      class={["mc-bgroup__segment", "mc-bgroup__toggle", classNames?.segment]}
      aria-label={menu.label}
      aria-haspopup="menu"
      aria-expanded={open}
      {disabled}
      onclick={() => (open ? hide() : showMenu())}
      onkeydown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          showMenu();
        }
      }}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    {#if open}
      <div role="menu" tabindex="-1" aria-label={menu.label} class={["mc-bgroup__menu", classNames?.menuContent]} onkeydown={onMenuKeydown}>
        {#each menu.items as entry, index (entry.id)}
          <button id="{id}-item-{index}" type="button" role="menuitem" tabindex={active === index ? 0 : -1} disabled={entry.disabled} onclick={() => chooseMenu(index)} onpointermove={() => !entry.disabled && focusItem(index)}>{entry.label}</button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-bgroup { position: relative; display: inline-flex; }
.mc-bgroup--vertical { flex-direction: column; }
.mc-bgroup__segment { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; text-decoration: none; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-bgroup--sm .mc-bgroup__segment { min-height: var(--control-height-sm); }
.mc-bgroup--horizontal .mc-bgroup__segment + .mc-bgroup__segment { margin-left: -1px; }
.mc-bgroup--vertical .mc-bgroup__segment + .mc-bgroup__segment { margin-top: -1px; }
.mc-bgroup--horizontal .mc-bgroup__segment:first-child { border-radius: var(--radius-control) 0 0 var(--radius-control); } .mc-bgroup--horizontal .mc-bgroup__segment:last-of-type { border-radius: 0 var(--radius-control) var(--radius-control) 0; }
.mc-bgroup--horizontal .mc-bgroup__segment:only-of-type { border-radius: var(--radius-control); }
.mc-bgroup--vertical .mc-bgroup__segment:first-child { border-radius: var(--radius-control) var(--radius-control) 0 0; } .mc-bgroup--vertical .mc-bgroup__segment:last-of-type { border-radius: 0 0 var(--radius-control) var(--radius-control); }
.mc-bgroup--solid .mc-bgroup__segment { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
@media (hover: hover) and (pointer: fine) { .mc-bgroup--outline .mc-bgroup__segment:hover:not(:disabled) { background: var(--surface-muted); } .mc-bgroup--solid .mc-bgroup__segment:hover:not(:disabled) { opacity: .9; } }
.mc-bgroup__segment:disabled { opacity: .5; cursor: not-allowed; }
.mc-bgroup__toggle { min-width: var(--control-height-md); padding: 0; }
.mc-bgroup__menu { position: absolute; z-index: 1000; top: calc(100% + 6px); right: 0; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-bgroup-in .18s var(--ease-enter) both; transform-origin: top right; }
.mc-bgroup__menu button { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-bgroup__menu button:focus, .mc-bgroup__menu button:focus-visible { outline: none; background: var(--surface-muted); }
.mc-bgroup__menu button:disabled { opacity: .45; cursor: not-allowed; }
@keyframes mc-bgroup-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-bgroup__segment { transition: none; } .mc-bgroup__menu { animation: none; } }
}
</style>
