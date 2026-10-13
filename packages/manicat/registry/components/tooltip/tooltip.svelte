<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** The tip. Use the `tip` snippet for markup. */
    content?: string;
    side?: "top" | "bottom";
    /** Extend the inner, named parts of the tooltip: tooltip. */
    classNames?: { tooltip?: string };
    /** The element the tip describes. */
    children?: Snippet;
    /** Markup for the tip, instead of `content`. */
    tip?: Snippet;
  }

  let { content, side = "top", classNames, children, tip }: Props = $props();

  const id = $props.id();
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // The first tip waits a beat so brushing past a control stays quiet; leaving hides it at once.
  function show(delay = 400) {
    clearTimeout(timer);
    timer = setTimeout(() => (visible = true), delay);
  }

  function hide() {
    clearTimeout(timer);
    visible = false;
  }

  $effect(() => () => clearTimeout(timer));
</script>

<span
  class="mc-tooltip-root"
  role="presentation"
  onpointerenter={() => show()}
  onpointerleave={hide}
  onfocusin={() => show(0)}
  onfocusout={hide}
  onkeydown={(event) => event.key === "Escape" && hide()}
>
  <span aria-describedby={visible ? id : undefined}>{@render children?.()}</span>
  {#if visible}
    <span {id} role="tooltip" data-side={side} class={["mc-tooltip", classNames?.tooltip]}>
      {#if tip}{@render tip()}{:else}{content}{/if}
    </span>
  {/if}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tooltip-root { position: relative; display: inline-flex; }
.mc-tooltip { --tooltip-y: 3px; position: absolute; z-index: 90; left: 50%; bottom: calc(100% + 8px); width: max-content; max-width: 15rem; padding: var(--space-3) var(--space-4); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font-size: var(--text-xs); line-height: var(--leading-body); pointer-events: none; transform: translateX(-50%); animation: mc-tooltip-in .16s var(--ease-enter) both; }
.mc-tooltip[data-side="bottom"] { --tooltip-y: -3px; top: calc(100% + 8px); bottom: auto; }
@keyframes mc-tooltip-in { from { opacity: 0; transform: translateX(-50%) translateY(var(--tooltip-y)) scale(.97); } to { opacity: 1; transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .mc-tooltip { animation: none; } }
}
</style>
