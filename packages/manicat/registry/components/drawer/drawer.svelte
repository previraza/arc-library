<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    description?: string;
    side?: "left" | "right" | "top" | "bottom";
    /** Whether the drawer is open. Bind it with `bind:open`. */
    open?: boolean;
    /** Extend the inner, named parts of the drawer: panel, header, title, description, close or body. */
    classNames?: { panel?: string; header?: string; title?: string; description?: string; close?: string; body?: string };
    /** The control that opens it. It receives an `open` function to wire to a button. */
    trigger?: Snippet<[{ open: () => void }]>;
    children?: Snippet;
  }

  let { title, description, side = "right", open = $bindable(false), classNames, trigger, children }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  const id = $props.id();
  let opener: HTMLElement | null = null;

  $effect(() => {
    const node = dialog;
    if (!node) return;
    if (open && !node.open) {
      opener = document.activeElement as HTMLElement | null;
      node.showModal();
    } else if (!open && node.open) node.close();
  });

  $effect(() => () => {
    if (dialog?.open) dialog.close();
  });

  function onClose() {
    open = false;
    opener?.focus();
  }

  function onBackdrop(event: MouseEvent) {
    if (event.target === dialog) open = false;
  }
</script>

{@render trigger?.({ open: () => (open = true) })}
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class={["mc-drawer", `mc-drawer--${side}`, classNames?.panel]} aria-labelledby="{id}-title" onclose={onClose} onclick={onBackdrop}>
  <header class={["mc-drawer__header", classNames?.header]}>
    <div>
      <h2 id="{id}-title" class={["mc-drawer__title", classNames?.title]}>{title}</h2>
      {#if description}<p class={["mc-drawer__description", classNames?.description]}>{description}</p>{/if}
    </div>
    <button type="button" class={["mc-drawer__close", classNames?.close]} aria-label="Close" onclick={() => (open = false)}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    </button>
  </header>
  <div class={["mc-drawer__body", classNames?.body]}>{@render children?.()}</div>
</dialog>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-drawer { margin: 0; padding: var(--space-5); overflow: auto; border: 1px solid var(--border); background: var(--surface); color: var(--foreground); box-shadow: var(--shadow-floating); }
.mc-drawer::backdrop { background: oklch(10% 0 0 / .4); backdrop-filter: blur(6px); }
.mc-drawer--right { inset: 0 0 0 auto; width: min(85vw, 24rem); height: 100dvh; max-height: none; border-radius: var(--radius-panel) 0 0 var(--radius-panel); }
.mc-drawer--left { inset: 0 auto 0 0; width: min(85vw, 24rem); height: 100dvh; max-height: none; border-radius: 0 var(--radius-panel) var(--radius-panel) 0; }
.mc-drawer--top { inset: 0 0 auto 0; width: 100vw; max-width: none; max-height: 70dvh; border-radius: 0 0 var(--radius-panel) var(--radius-panel); }
.mc-drawer--bottom { inset: auto 0 0 0; width: 100vw; max-width: none; max-height: 70dvh; border-radius: var(--radius-panel) var(--radius-panel) 0 0; }
.mc-drawer[open] { animation: var(--mc-drawer-in, mc-drawer-right) .32s var(--ease-enter) both; }
.mc-drawer--left { --mc-drawer-in: mc-drawer-left; } .mc-drawer--top { --mc-drawer-in: mc-drawer-top; } .mc-drawer--bottom { --mc-drawer-in: mc-drawer-bottom; }
.mc-drawer[open]::backdrop { animation: mc-drawer-fade var(--duration-standard) var(--ease-enter) both; }
.mc-drawer:focus { outline: none; }
.mc-drawer__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-4); }
.mc-drawer__title { margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); }
.mc-drawer__description { margin: var(--space-1) 0 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-drawer__close { display: grid; place-items: center; width: var(--space-8); height: var(--space-8); border: 1px solid var(--border); border-radius: var(--radius-control); background: transparent; color: var(--text-muted); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-drawer__close:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-drawer__body { display: grid; gap: var(--space-3); }
@keyframes mc-drawer-right { from { transform: translateX(100%); } to { transform: none; } }
@keyframes mc-drawer-left { from { transform: translateX(-100%); } to { transform: none; } }
@keyframes mc-drawer-top { from { transform: translateY(-100%); } to { transform: none; } }
@keyframes mc-drawer-bottom { from { transform: translateY(100%); } to { transform: none; } }
@keyframes mc-drawer-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .mc-drawer[open], .mc-drawer[open]::backdrop { animation: none; } }
}
</style>
