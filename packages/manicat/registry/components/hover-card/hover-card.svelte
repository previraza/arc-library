<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    openDelay?: number;
    closeDelay?: number;
    /** Extend the inner, named parts of the card: card. */
    classNames?: { card?: string };
    /** The element that opens the card. */
    children?: Snippet;
    /** The content of the card. */
    content?: Snippet;
  }

  let { side = "bottom", align = "start", openDelay = 300, closeDelay = 150, classNames, children, content }: Props = $props();

  const id = $props.id();
  let open = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Moving from the trigger onto the card keeps it open: leaving either only starts the close delay.
  function show() {
    clearTimeout(timer);
    timer = setTimeout(() => (open = true), openDelay);
  }

  function hide() {
    clearTimeout(timer);
    timer = setTimeout(() => (open = false), closeDelay);
  }

  $effect(() => () => clearTimeout(timer));
</script>

<span class="mc-hovercard" role="presentation" onpointerenter={show} onpointerleave={hide} onfocusin={show} onfocusout={hide} onkeydown={(event) => event.key === "Escape" && (open = false)}>
  <span aria-describedby={open ? id : undefined}>{@render children?.()}</span>
  {#if open}
    <div {id} role="dialog" data-side={side} data-align={align} class={["mc-hovercard__card", classNames?.card]}>
      {@render content?.()}
    </div>
  {/if}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-hovercard { position: relative; display: inline-flex; }
.mc-hovercard__card { position: absolute; z-index: 70; width: 18rem; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-hovercard-in .18s var(--ease-enter) both; }
.mc-hovercard__card[data-side="bottom"] { top: calc(100% + 8px); } .mc-hovercard__card[data-side="top"] { bottom: calc(100% + 8px); }
.mc-hovercard__card[data-side="right"] { left: calc(100% + 8px); top: 0; } .mc-hovercard__card[data-side="left"] { right: calc(100% + 8px); top: 0; }
.mc-hovercard__card[data-align="start"][data-side="bottom"], .mc-hovercard__card[data-align="start"][data-side="top"] { left: 0; }
.mc-hovercard__card[data-align="end"][data-side="bottom"], .mc-hovercard__card[data-align="end"][data-side="top"] { right: 0; }
.mc-hovercard__card[data-align="center"][data-side="bottom"], .mc-hovercard__card[data-align="center"][data-side="top"] { left: 50%; margin-left: -9rem; }
@keyframes mc-hovercard-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-hovercard__card { animation: none; } }
}
</style>
