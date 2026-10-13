<script lang="ts">
  // @manicat-dependencies motion bits-ui
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { Tooltip } from "bits-ui";
  import { createTooltipText, warmth } from "@/lib/tooltip-motion";

  interface Props {
    /** The text of the tooltip. For anything richer, use the `body` snippet. */
    content?: string;
    side?: "top" | "bottom";
    /** The element the tooltip describes. Spread `props` on it: `{#snippet trigger({ props })}<Button {...props}>…</Button>{/snippet}`. */
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
    body?: Snippet;
    /** Extend the inner, named parts of the tooltip: text or line. */
    classNames?: { text?: string; line?: string };
  }

  let { content, side = "top", trigger, body, classNames }: Props = $props();

  const DELAY = 250;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isWarm = $state(warmth.get());
  let open = $state(false);
  let instant = $state(false);
  let host: HTMLElement | undefined = $state();
  let text: ReturnType<typeof createTooltipText> | undefined;

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

  onMount(() => warmth.subscribe(() => (isWarm = warmth.get())));

  // Controlled so the instant flag lands in the same render that mounts the content.
  function change(next: boolean) {
    if (next) instant = warmth.get();
    open = next;
  }
  $effect(() => {
    if (!open) return;
    warmth.opened();
    return () => warmth.closed();
  });

  // String content crossfades when it changes while open, and the bubble springs to the new text size.
  $effect(() => {
    const node = host;
    if (!node || content === undefined) return;
    text = createTooltipText(node, { text: content, reduced, classes: { text: cn("mc-tooltip__text", classNames?.text), measure: "mc-tooltip__measure", line: cn("mc-tooltip__line", classNames?.line) } });
    return () => text?.destroy();
  });
  $effect(() => {
    if (content !== undefined) text?.set(content);
  });
</script>

<Tooltip.Provider delayDuration={DELAY} skipDelayDuration={0}>
  <Tooltip.Root {open} onOpenChange={change} delayDuration={isWarm ? 0 : DELAY}>
    <Tooltip.Trigger>
      {#snippet child({ props })}{@render trigger({ props })}{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content class="mc-tooltip__tooltip" data-instant={instant || undefined} {side} sideOffset={8} collisionPadding={12}>
        {#if content !== undefined}<span bind:this={host} style="display: contents"></span>{:else}{@render body?.()}{/if}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tooltip__tooltip { --tooltip-y: 3px; z-index: 90; max-width: 15rem; padding: var(--space-3) var(--space-4); border: 1px solid color-mix(in oklab, var(--background) 14%, var(--foreground)); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); box-shadow: var(--shadow-raised); font-size: var(--text-sm); font-weight: 400; line-height: var(--leading-body); transform-origin: var(--bits-tooltip-content-transform-origin); transition: opacity var(--duration-fast) var(--ease-enter), transform var(--duration-fast) var(--ease-enter); }
.mc-tooltip__tooltip[data-side="bottom"] { --tooltip-y: -3px; }
/* The first tooltip waits, then rises a few pixels from its trigger. Within the skip window the next one only fades.
   Transitions instead of keyframes, so returning to the trigger while it fades out reverses the fade instead of restarting it. */
@starting-style {
  .mc-tooltip__tooltip[data-state$="-open"] { opacity: 0; transform: translateY(var(--tooltip-y)) scale(.97); }
  .mc-tooltip__tooltip[data-instant][data-state$="-open"] { transform: none; }
}
.mc-tooltip__tooltip[data-instant][data-state$="-open"] { transition: opacity var(--duration-instant) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
/* Radix unmounts when the exit animation ends, so a no-op keyframe times the exit while the transition does the visual work. */
.mc-tooltip__tooltip[data-state="closed"] { opacity: 0; transform: scale(.98); transition: opacity var(--duration-instant) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); animation: mc-tooltip-tooltip-exit var(--duration-instant) linear both; }
.mc-tooltip__text { position: relative; display: block; overflow: clip; overflow-clip-margin: var(--space-2); }
.mc-tooltip__measure { position: absolute; top: 0; left: 0; width: max-content; max-width: calc(15rem - 2 * var(--space-4) - 2px); visibility: hidden; pointer-events: none; }
.mc-tooltip__line { display: block; width: max-content; max-width: calc(15rem - 2 * var(--space-4) - 2px); }
@keyframes mc-tooltip-tooltip-exit { to { --tooltip-exit: 1; } }
@media (prefers-reduced-motion: reduce) {
  .mc-tooltip__tooltip, .mc-tooltip__tooltip[data-state="closed"], .mc-tooltip__tooltip[data-instant][data-state$="-open"] { transform: none; transition: opacity var(--duration-instant) var(--ease-standard); }
}
}
</style>
