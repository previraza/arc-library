<script lang="ts">
  // @manicat-dependencies motion bits-ui
  import { onDestroy, onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { Popover } from "bits-ui";
  import { CLOSE_DELAY, INTENT, OPEN_DELAY, cards, createSurface } from "@/lib/hover-card";

  interface Props {
    /** The trigger, such as a mention button or a link. It must be focusable. */
    children: Snippet;
    /** The preview. `HoverCardProfile` covers people; any read only content works. */
    content: Snippet;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    /** Milliseconds of hover before the first card opens. */
    openDelay?: number;
    /** Milliseconds of grace after the pointer leaves, so it can travel into the card. */
    closeDelay?: number;
    class?: string;
    /** Extend the inner, named parts of the hover-card: card. */
    classNames?: { card?: string };
  }

  let { children, content, side = "bottom", align = "start", openDelay = OPEN_DELAY, closeDelay = CLOSE_DELAY, class: className, classNames }: Props = $props();

  const id = $props.id();
  const cardId = `${id}-card`;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let snapshot = $state(cards.get());
  const open = $derived(snapshot.id === id);
  let triggerBox: HTMLElement;
  const timers = { open: 0, close: 0 };
  const inside = { trigger: false, card: false, focus: false };
  /** Set by Escape, so a pointer resting on the trigger does not reopen what was just dismissed. */
  let dismissed = false;
  let pointerType = "";

  onMount(() => cards.subscribe(() => (snapshot = cards.get())));
  onDestroy(() => {
    window.clearTimeout(timers.open);
    window.clearTimeout(timers.close);
    cards.close(id);
  });

  const clearTimers = () => { window.clearTimeout(timers.open); window.clearTimeout(timers.close); };
  const show = () => { clearTimers(); dismissed = false; cards.open(id); };
  const hide = () => { clearTimers(); cards.close(id); };
  const scheduleOpen = () => {
    window.clearTimeout(timers.close);
    if (dismissed || cards.get().id === id) return;
    window.clearTimeout(timers.open);
    timers.open = window.setTimeout(() => cards.open(id), cards.warm() ? INTENT : openDelay);
  };
  const scheduleClose = () => {
    window.clearTimeout(timers.open);
    if (inside.trigger || inside.card || inside.focus) return;
    window.clearTimeout(timers.close);
    timers.close = window.setTimeout(() => cards.close(id), closeDelay);
  };
  const mouse = (event: PointerEvent) => event.pointerType !== "touch";

  // The card grows from the trigger edge on enter and shrinks back on leave.
  let surface: ReturnType<typeof createSurface> | undefined;
  function grow(node: HTMLElement) {
    surface = createSurface(node, { still: snapshot.instant || reduced, reduced });
    surface.in();
    return { duration: 0 };
  }
  function shrink(_node: HTMLElement) {
    // The surface runs its own fade and shrink; the transition only keeps the node mounted for as long as they take.
    surface?.out(() => undefined);
    return { duration: reduced ? 100 : 120 };
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={triggerBox} style="display: contents">
  <Popover.Root open={open} onOpenChange={() => undefined}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <span {...props} data-hover-card={open ? "open" : "closed"} aria-describedby={open ? cardId : undefined} style="display: inline-flex"
          onclick={() => { const isOpen = cards.get().id === id; if (pointerType === "touch") { if (isOpen) hide(); else show(); } else if (!isOpen) show(); pointerType = ""; }}
          onpointerenter={(event: PointerEvent) => { if (!mouse(event)) return; inside.trigger = true; scheduleOpen(); }}
          onpointerleave={(event: PointerEvent) => { if (!mouse(event)) return; inside.trigger = false; dismissed = false; scheduleClose(); }}
          onpointerdown={(event: PointerEvent) => { pointerType = event.pointerType; }}
          onfocusin={(event: FocusEvent) => { if (!(event.target as HTMLElement).matches(":focus-visible")) return; inside.focus = true; show(); }}
          onfocusout={() => { inside.focus = false; dismissed = false; scheduleClose(); }}>{@render children()}</span>
      {/snippet}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content forceMount {side} {align} sideOffset={8} collisionPadding={12} id={cardId} role="tooltip"
        onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeydown={() => { dismissed = true; hide(); }}
        onInteractOutside={(event) => { if (triggerBox?.contains(event.target as Node)) event.preventDefault(); else hide(); }}>
        {#snippet child({ props, wrapperProps })}
          <div {...wrapperProps}>
            {#if open}
              <div {...props} class={["mc-hover-card__card", classNames?.card, className]} role="tooltip" id={cardId}
                onpointerenter={(event: PointerEvent) => { if (!mouse(event)) return; inside.card = true; window.clearTimeout(timers.close); }}
                onpointerleave={(event: PointerEvent) => { if (!mouse(event)) return; inside.card = false; scheduleClose(); }}
                in:grow out:shrink>{@render content()}</div>
            {/if}
          </div>
        {/snippet}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* A floating layer, so it earns the floating shadow. Transforms pivot on the placed origin, the corner nearest the trigger. */
.mc-hover-card__card { z-index: 60; box-sizing: border-box; width: 18.5rem; max-width: min(18.5rem, var(--bits-popover-content-available-width, calc(100vw - 24px))); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); font-family: var(--font-body); letter-spacing: var(--tracking-body); transform-origin: var(--bits-popover-content-transform-origin); outline: none; }
.mc-hover-card__profile { display: grid; gap: var(--space-3); }
.mc-hover-card__head { display: flex; min-width: 0; align-items: center; gap: var(--space-3); }
.mc-hover-card__avatar { position: relative; display: grid; width: 48px; height: 48px; flex: none; place-items: center; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; }
.mc-hover-card__avatar img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity var(--duration-standard) var(--ease-enter), filter var(--duration-standard) var(--ease-enter); }
.mc-hover-card__avatar img[data-loading] { opacity: 0; filter: blur(4px); transition: none; }
.mc-hover-card__identity { display: grid; min-width: 0; }
.mc-hover-card__name, .mc-hover-card__role { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-hover-card__name { color: var(--foreground); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); }
.mc-hover-card__role { color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-hover-card__bio { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
/* Numbers lead and labels follow, while the markup keeps label then value for screen readers. */
.mc-hover-card__stats { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); margin: 0; padding-top: var(--space-3); border-top: 1px solid var(--border-subtle); }
.mc-hover-card__stat { display: flex; flex-direction: column-reverse; }
.mc-hover-card__stat dt { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-hover-card__stat dd { margin: 0; color: var(--foreground); font-size: var(--text-base); font-variant-numeric: tabular-nums; font-weight: 500; line-height: var(--leading-body); }
.mc-hover-card__meta { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-hover-card__meta svg { flex: none; }
@media (prefers-reduced-motion: reduce) { .mc-hover-card__avatar img { transition: none; } .mc-hover-card__avatar img[data-loading] { filter: none; } }
}
</style>
