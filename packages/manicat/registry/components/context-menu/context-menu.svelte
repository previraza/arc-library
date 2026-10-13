<script lang="ts" module>
  import type { Component } from "svelte";

  export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: Component;
    onSelect?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    checked?: boolean;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { tick } from "svelte";
  import type { Snippet } from "svelte";
  import { Check, MoreHorizontal } from "@lucide/svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    children?: Snippet;
    items: ContextMenuItem[];
    label?: string;
    class?: string;
    /** Extend the inner, named parts of the context menu: menu, highlight, item or icon. */
    classNames?: { menu?: string; highlight?: string; item?: string; icon?: string };
    [key: string]: unknown;
  }

  let { children, items, label = "Context menu", class: className, classNames, ...rest }: Props = $props();

  type Highlight = { index: number; top: number; height: number; danger: boolean; glide: boolean };
  const MENU_WIDTH = 208;

  // Keeps the menu 8px inside the viewport. Rows are 34px with 5px padding and a 1px border; the real size is measured before paint.
  function clampTo(x: number, y: number, width: number, height: number) {
    const left = Math.max(8, Math.min(x, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - height - 8));
    // The menu grows from the pointer, even when it is clamped away from a viewport edge.
    return { x: left, y: top, originX: Math.max(0, Math.min(width, x - left)), originY: Math.max(0, Math.min(height, y - top)) };
  }

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration } = motionTokens;
  let open = $state(false);
  // The portal mounts on first open (client only) and stays so the menu can animate out.
  let portalOn = $state(false);
  // Each open gets its own key, so reopening at a new point fades the old menu out in place
  // and grows a fresh one from the pointer instead of teleporting the visible menu.
  let point = $state({ x: 0, y: 0, originX: 0, originY: 0, key: 0 });
  let highlight = $state<Highlight | null>(null);
  let menu: HTMLElement | null = null;
  let target: HTMLElement;
  let mark = $state<HTMLElement>();
  let pointer = false;
  let clearTimer = 0;
  // A primary press on the target while the menu is open closes it; the click that follows must not reopen it.
  let pressedWhileOpen = false;
  // An exiting menu keeps its last props, so its handlers check this before moving focus or selecting.
  let live = false;
  let anchor = { x: 0, y: 0 };

  $effect(() => {
    live = open;
  });
  // Re-clamp against the menu's real size before the first frame, so long labels or many rows never overflow the viewport.
  $effect(() => {
    if (!open) return;
    point.key;
    tick().then(() => {
      const node = menu;
      if (!open || !node) return;
      const next = clampTo(anchor.x, anchor.y, node.offsetWidth, node.offsetHeight);
      if (!(point.x === next.x && point.y === next.y && point.originX === next.originX && point.originY === next.originY)) point = { ...next, key: point.key };
    });
  });
  $effect(() => () => window.clearTimeout(clearTimer));
  $effect(() => {
    if (!open) return;
    point.key;
    tick().then(() => menu?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus({ preventScroll: true }));
    const closeOnPointerDown = (event: PointerEvent) => { if (!menu?.contains(event.target as Node)) open = false; };
    const closeOnViewportChange = (event: Event) => {
      if (event.target instanceof Node && menu?.contains(event.target)) return;
      open = false;
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  });

  function showMenu(x: number, y: number) {
    anchor = { x, y };
    const estimate = clampTo(x, y, MENU_WIDTH, Math.min(300, items.length * 34 + 12));
    point = { ...estimate, key: point.key + 1 };
    window.clearTimeout(clearTimer);
    pointer = false;
    highlight = null;
    portalOn = true;
    open = true;
  }

  function onTargetKeydown(event: KeyboardEvent) {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      const rect = target.getBoundingClientRect();
      showMenu(rect.left + 12, rect.bottom + 8);
    }
  }
  function onTargetClick() {
    if (pressedWhileOpen) {
      pressedWhileOpen = false;
      return;
    }
    const rect = target.getBoundingClientRect();
    showMenu(rect.left + 12, rect.bottom + 8);
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
    const current = document.activeElement?.getAttribute("data-index");
    const currentPosition = enabled.findIndex(({ index }) => String(index) === current);
    let nextPosition: number | undefined;
    if (event.key === "ArrowDown") nextPosition = (currentPosition + 1) % enabled.length;
    if (event.key === "ArrowUp") nextPosition = currentPosition < 0 ? enabled.length - 1 : (currentPosition - 1 + enabled.length) % enabled.length;
    if (event.key === "Home") nextPosition = 0;
    if (event.key === "End") nextPosition = enabled.length - 1;
    if (nextPosition !== undefined && enabled.length) {
      event.preventDefault();
      (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-index="${enabled[nextPosition].index}"]`)?.focus();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
      target.focus();
    }
  }

  function place(item: HTMLElement, glide: boolean) {
    window.clearTimeout(clearTimer);
    const next = { index: Number(item.dataset.index), top: item.offsetTop, height: item.offsetHeight, danger: item.dataset.tone === "danger" };
    highlight = { ...next, glide: glide && highlight !== null };
  }

  // Keyboard focus places the highlight instantly; the pointer makes it glide between rows.
  function onMenuFocus(event: FocusEvent) {
    const item = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="menuitem"]') : null;
    if (item) {
      // A pointer-opened menu focuses its first row without showing a highlight, like a native menu.
      if (!pointer && item.matches(":focus-visible")) place(item, false);
      return;
    }
    // A short grace period keeps the highlight gliding across the gap between rows.
    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => (highlight = null), pointer ? 70 : 0);
  }

  // The highlight is one box that glides between rows for the pointer and jumps for the keyboard.
  $effect(() => {
    const next = highlight;
    if (!mark) return;
    const glide = next?.glide && !reduced ? motionTokens.spring.snappy : { duration: 0 };
    if (next) animate(mark, { y: next.top, height: next.height, opacity: 1 } as never, { default: glide, opacity: { duration: reduced ? 0 : duration.instant } } as never);
    else animate(mark, { opacity: 0 }, { opacity: { duration: reduced ? 0 : duration.instant } } as never);
  });

  const grow = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const shrink = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1 }, { duration: duration.instant, ease: "standard" });

  /** Moves the menu to the body, so it is never clipped or stacked under its surroundings. */
  function portal(node: HTMLElement) {
    document.body.append(node);
    menu = node;
    return { destroy: () => node.remove() };
  }

  function selectItem(item: ContextMenuItem) {
    if (!live) return;
    live = false;
    item.onSelect?.();
    open = false;
    target.focus();
  }
  function onItemMove(event: PointerEvent, index: number) {
    if (!live) return;
    const el = event.currentTarget as HTMLElement;
    window.clearTimeout(clearTimer);
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    if (highlight?.index !== index) place(el, true);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions, a11y_role_has_required_aria_props -->
<div bind:this={target} {...rest} class={["mc-context-menu__target", className]} tabindex="0" aria-label={label} aria-haspopup="menu" aria-expanded={open} onpointerdown={(event) => (pressedWhileOpen = open && event.button === 0)} onclick={onTargetClick} oncontextmenu={(event) => { event.preventDefault(); showMenu(event.clientX, event.clientY); }} onkeydown={onTargetKeydown}>
  {@render children?.()}
</div>
{#if portalOn}
  {#key point.key}
    {#if open}
      <div use:portal class={["mc-context-menu__menu", classNames?.menu]} role="menu" aria-label={label} tabindex="-1" style={`left: ${point.x}px; top: ${point.y}px; transform-origin: ${point.originX}px ${point.originY}px;`} onkeydown={onMenuKeydown} onfocusin={onMenuFocus} onpointermovecapture={() => (pointer = true)} onkeydowncapture={() => (pointer = false)} onpointerleave={(event) => { if (live) (event.currentTarget as HTMLElement).focus({ preventScroll: true }); }} in:grow out:shrink>
        <span bind:this={mark} class={["mc-context-menu__highlight", classNames?.highlight]} data-tone={highlight?.danger ? "danger" : undefined} aria-hidden="true"></span>
        {#each items as item, index (item.id)}
          <button type="button" role="menuitem" tabindex="-1" data-index={index} data-tone={item.destructive ? "danger" : undefined} style={`--i: ${index}`} disabled={item.disabled} class={["mc-context-menu__item", item.destructive && "mc-context-menu__destructive", classNames?.item]} onpointermove={(event) => onItemMove(event, index)} onpointerleave={() => { if (live) menu?.focus({ preventScroll: true }); }} onclick={() => selectItem(item)}>
            <span class={["mc-context-menu__icon", classNames?.icon]} aria-hidden="true">{#if item.icon}{@const Icon = item.icon}<Icon size={15} />{:else if item.checked}<Check size={15} />{:else}<MoreHorizontal size={15} />{/if}</span><span>{item.label}</span>
          </button>
        {/each}
      </div>
    {/if}
  {/key}
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-context-menu__target { display: block; outline: none; }
/* Motion scales the menu from the pointer (transform-origin is set inline) and fades it out faster than it arrives. */
.mc-context-menu__menu { position: fixed; z-index: 100; min-width: min(13rem, calc(100vw - 16px)); max-width: calc(100vw - 16px); max-height: min(300px, calc(100vh - 16px)); overflow-y: auto; padding: 5px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); outline: none; }
.mc-context-menu__highlight { position: absolute; top: 0; right: 5px; left: 5px; border-radius: calc(var(--radius-panel) - 6px); background: var(--surface-muted); opacity: 0; pointer-events: none; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-context-menu__highlight[data-tone="danger"] { background: color-mix(in oklab, var(--danger) 8%, var(--surface)); }
.mc-context-menu__item { position: relative; display: flex; width: 100%; min-height: 34px; align-items: center; gap: 9px; padding: 0 11px; border: 0; border-radius: calc(var(--radius-panel) - 6px); background: transparent; color: inherit; font: inherit; font-size: var(--text-sm); letter-spacing: var(--tracking-body); line-height: var(--leading-body); text-align: left; cursor: pointer; outline: none; transition: background-color var(--duration-instant) var(--ease-standard), color var(--duration-fast) var(--ease-standard); animation: mc-context-menu-context-item-in var(--duration-standard) var(--ease-enter) both; animation-delay: calc(min(var(--i, 0), 4) * 35ms); }
/* The gliding highlight is the focus indicator, as in the dropdown menu. */
.mc-context-menu__item:focus-visible { outline: none; }
/* Rows press with a tint, not a scale. */
.mc-context-menu__item:active:not(:disabled) { background: color-mix(in oklab, var(--foreground) 5%, transparent); }
.mc-context-menu__item:disabled { opacity: .45; cursor: default; }
.mc-context-menu__item.mc-context-menu__destructive { color: var(--danger); }
.mc-context-menu__icon { display: inline-flex; flex: none; width: 16px; align-items: center; justify-content: center; color: var(--text-secondary); }
.mc-context-menu__item > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-context-menu__destructive .mc-context-menu__icon { color: currentColor; }
@keyframes mc-context-menu-context-item-in { from { opacity: 0; transform: translateY(-2px); } }
@media (prefers-reduced-motion: reduce) { .mc-context-menu__item, .mc-context-menu__highlight { animation: none; transition: none; } }
}
</style>
