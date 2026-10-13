<script lang="ts" module>
  export interface ContextMenuItem {
    id: string;
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    checked?: boolean;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    items: ContextMenuItem[];
    label?: string;
    onselect?: (id: string) => void;
    /** The area that opens the menu. */
    children?: Snippet;
    /** Extend the inner, named parts of the menu: content or item. */
    classNames?: { content?: string; item?: string };
  }

  let { items, label = "Context menu", onselect, children, classNames }: Props = $props();

  const id = $props.id();
  let host = $state<HTMLElement>();
  let menu = $state<HTMLElement>();
  let open = $state(false);
  let point = $state({ x: 0, y: 0 });
  let active = $state(-1);

  async function show(x: number, y: number) {
    point = { x, y };
    open = true;
    await tick();
    // Keep the menu on screen near the edges.
    const box = menu?.getBoundingClientRect();
    if (box) point = { x: Math.min(x, window.innerWidth - box.width - 8), y: Math.min(y, window.innerHeight - box.height - 8) };
    focusItem(items.findIndex((item) => !item.disabled));
  }

  async function focusItem(index: number) {
    active = index;
    await tick();
    document.getElementById(`${id}-item-${index}`)?.focus();
  }

  function hide(refocus = false) {
    open = false;
    active = -1;
    if (refocus) host?.focus();
  }

  function choose(index: number) {
    const item = items[index];
    if (!item || item.disabled) return;
    hide(true);
    item.onSelect?.();
    onselect?.(item.id);
  }

  function onContextmenu(event: MouseEvent) {
    event.preventDefault();
    show(event.clientX, event.clientY);
  }

  // The menu key and Shift+F10 open it at the element, so it is not pointer-only.
  function onHostKeydown(event: KeyboardEvent) {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      const box = host?.getBoundingClientRect();
      if (box) show(box.left + 16, box.top + 16);
    }
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const count = items.length;
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (step) {
      let next = active;
      for (let tries = 0; tries < count; tries += 1) {
        next = (next + step + count) % count;
        if (!items[next].disabled) break;
      }
      focusItem(next);
    } else if (event.key === "Escape") hide(true);
    else if (event.key === "Tab") hide();
    else return;
    event.preventDefault();
  }

  function onOutside(event: PointerEvent) {
    if (open && menu && !menu.contains(event.target as Node)) hide();
  }
</script>

<svelte:document onpointerdown={onOutside} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div bind:this={host} class="mc-context" role="group" tabindex="0" oncontextmenu={onContextmenu} onkeydown={onHostKeydown}>
  {@render children?.()}
  {#if open}
    <div bind:this={menu} role="menu" tabindex="-1" aria-label={label} class={["mc-context__content", classNames?.content]} style="left: {point.x}px; top: {point.y}px" onkeydown={onMenuKeydown}>
      {#each items as item, index (item.id)}
        <button
          id="{id}-item-{index}"
          type="button"
          role={item.checked !== undefined ? "menuitemcheckbox" : "menuitem"}
          aria-checked={item.checked}
          tabindex={active === index ? 0 : -1}
          disabled={item.disabled}
          data-destructive={item.destructive || undefined}
          class={["mc-context__item", classNames?.item]}
          onclick={() => choose(index)}
          onpointermove={() => !item.disabled && focusItem(index)}
        >
          <span>{item.label}</span>
          {#if item.checked}<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-context { outline: none; }
.mc-context__content { position: fixed; z-index: 1000; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-context-in .14s var(--ease-enter) both; transform-origin: top left; }
.mc-context__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: space-between; gap: var(--space-3); padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-context__item:focus, .mc-context__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-context__item[data-destructive] { color: var(--danger); }
.mc-context__item:disabled { opacity: .45; cursor: not-allowed; }
@keyframes mc-context-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-context__content { animation: none; } }
}
</style>
