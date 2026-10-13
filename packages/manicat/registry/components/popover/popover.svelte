<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** Whether the popover is open. Bind it with `bind:open`. */
    open?: boolean;
    /** Extend the inner, named parts of the popover: content. */
    classNames?: { content?: string };
    /** The control that opens it. It receives `toggle`, `open` and the `aria-controls` to wire to a button. */
    trigger?: Snippet<[{ toggle: () => void; open: boolean; "aria-controls": string }]>;
    /** The content. It receives `close`. */
    children?: Snippet<[{ close: () => void }]>;
  }

  let { open = $bindable(false), classNames, trigger, children }: Props = $props();
  let root = $state<HTMLElement>();
  const id = $props.id();

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      root?.querySelector<HTMLElement>("button")?.focus();
    }
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-popover" role="presentation" onkeydown={onKeydown}>
  {@render trigger?.({ toggle: () => (open = !open), open, "aria-controls": id })}
  {#if open}
    <div {id} role="dialog" class={["mc-popover__content", classNames?.content]}>
      {@render children?.({ close: () => (open = false) })}
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-popover { position: relative; display: inline-block; }
.mc-popover__content { position: absolute; z-index: 60; top: calc(100% + 8px); left: 0; width: 16rem; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); font-size: var(--text-sm); box-shadow: var(--shadow-floating); animation: mc-popover-in .18s var(--ease-enter) both; transform-origin: top left; }
@keyframes mc-popover-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-popover__content { animation: none; } }
}
</style>
