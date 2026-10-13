<script lang="ts" module>
  export interface DropdownItem {
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    separatorBefore?: boolean;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    /** Accessible name of the trigger and the menu. */
    label: string;
    items: DropdownItem[];
    /** Also called on every choice, with the item's index, for code that prefers listening over `onSelect` callbacks. */
    onselect?: (index: number) => void;
    /** Replaces the label inside the trigger. */
    icon?: Snippet;
    /** Extend the inner, named parts of the menu: trigger, content, item or separator. */
    classNames?: { trigger?: string; content?: string; item?: string; separator?: string };
  }

  let { label, items, onselect, icon, classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let active = $state(-1);

  async function focusItem(index: number) {
    active = index;
    await tick();
    document.getElementById(`${id}-item-${index}`)?.focus();
  }

  async function show(index = 0) {
    open = true;
    const first = items.findIndex((item, at) => at >= index && !item.disabled);
    await tick();
    focusItem(Math.max(0, first));
  }

  function hide(refocus = false) {
    open = false;
    active = -1;
    if (refocus) root?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  }

  function choose(index: number) {
    const item = items[index];
    if (!item || item.disabled) return;
    hide(true);
    item.onSelect?.();
    onselect?.(index);
  }

  function step(from: number, direction: number) {
    const length = items.length;
    for (let tries = 1; tries <= length; tries += 1) {
      const next = (from + direction * tries + length * tries) % length;
      if (!items[next].disabled) return next;
    }
    return from;
  }

  function onMenuKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") focusItem(step(active, 1));
    else if (event.key === "ArrowUp") focusItem(step(active, -1));
    else if (event.key === "Home") focusItem(step(-1, 1));
    else if (event.key === "End") focusItem(step(items.length, -1));
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

<div bind:this={root} class="mc-menu">
  <button
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls="{id}-menu"
    aria-label={icon ? label : undefined}
    data-state={open ? "open" : "closed"}
    class={["mc-menu__trigger", classNames?.trigger]}
    onclick={() => (open ? hide() : show())}
    onkeydown={(event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        show();
      }
    }}
  >
    {#if icon}{@render icon()}{:else}{label}{/if}
  </button>
  {#if open}
    <div id="{id}-menu" role="menu" tabindex="-1" aria-label={label} class={["mc-menu__content", classNames?.content]} onkeydown={onMenuKeydown}>
      {#each items as item, index (`${item.label}-${index}`)}
        {#if item.separatorBefore}<div role="separator" class={["mc-menu__separator", classNames?.separator]}></div>{/if}
        <button
          id="{id}-item-{index}"
          type="button"
          role="menuitem"
          tabindex={active === index ? 0 : -1}
          disabled={item.disabled}
          data-destructive={item.destructive || undefined}
          class={["mc-menu__item", classNames?.item]}
          onclick={() => choose(index)}
          onpointermove={() => !item.disabled && focusItem(index)}
        >
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-menu { position: relative; display: inline-block; }
.mc-menu__trigger { display: inline-flex; max-width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: center; gap: var(--space-2); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-menu__trigger:hover { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-menu__trigger[data-state="open"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-menu__trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-menu__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-menu-in .18s var(--ease-enter) both; transform-origin: top left; }
.mc-menu__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-menu__item:focus, .mc-menu__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-menu__item[data-destructive] { color: var(--danger); }
.mc-menu__item:disabled { opacity: .45; cursor: not-allowed; }
.mc-menu__separator { height: 1px; margin: 4px var(--space-2); background: var(--border); }
@keyframes mc-menu-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-menu__trigger { transition: none; } .mc-menu__content { animation: none; } }
}
</style>
