<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { animate } from "motion";
  import type { Snippet } from "svelte";
  import { Dialog } from "bits-ui";
  import { X } from "@lucide/svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    title: string;
    description?: string;
    media?: Snippet;
    action?: Snippet;
    /** A small leading visual for the footer, such as the owner's avatar. */
    avatar?: Snippet;
    /** Who the card belongs to, such as the owner's name. */
    meta?: Snippet;
    /** A short status under the meta, such as "Updated 2 hours ago". Changed words rise in and are announced politely. */
    status?: string;
    /** Content for a quick look. When set, the whole card opens and grows into a larger view; Escape or the close control morphs it back. */
    details?: Snippet;
    children?: Snippet;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    class?: string;
    style?: string;
    /** Extend the inner, named parts of the card: card, footer, byline, avatar, meta, action, media, zoom, content, title, description, panel, closeSlot, close or details. */
    classNames?: { card?: string; footer?: string; byline?: string; avatar?: string; meta?: string; action?: string; media?: string; zoom?: string; content?: string; title?: string; description?: string; panel?: string; close?: string; closeSlot?: string; details?: string };
    [key: string]: unknown;
  }

  let { title, description, media, action, avatar, meta, status, details, children, open = $bindable(), defaultOpen = false, onOpenChange, class: className, style, classNames, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur, ease, spring, stagger } = motionTokens;
  const grow = { ...spring.smooth, visualDuration: 0.3 };
  const settle = { ...spring.smooth, visualDuration: 0.26 };
  /** The photo drifts in slowly while the card is pointed at, and eases back a little faster. */
  const ZOOM = 1.04;
  let internal = $state(defaultOpen);
  let hovered = $state(false);
  let hidden = $state(false);
  let card: HTMLElement;
  let zoom = $state<HTMLElement>();
  const isOpen = $derived(details ? (open ?? internal) : false);

  function setOpen(next: boolean) {
    internal = next;
    open = next;
    onOpenChange?.(next);
  }
  function hover(on: boolean) {
    hovered = on;
    if (reduced) return;
    animate(card, { y: on ? -2 : 0 } as never, spring.snappy as never);
    if (zoom) animate(zoom, { scale: on ? ZOOM : 1 } as never, { duration: on ? duration.considered * 2 : duration.considered, ease: [...ease.standard] } as never);
  }

  // The quick look grows out of the card's box: the surface travels on one critically damped spring, and the details settle in beneath it.
  const radiusOf = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  let origin: DOMRect | undefined;
  function panelIn(node: HTMLElement) {
    const from = origin ?? card.getBoundingClientRect();
    hidden = true;
    if (reduced) return poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.instant })(node);
    queueMicrotask(() => {
      const target = node.getBoundingClientRect();
      const radius = radiusOf(node);
      const cardRadius = radiusOf(card);
      node.style.setProperty("--card-measure", `${card.querySelector("p")?.getBoundingClientRect().width ?? 0}px`);
      Object.assign(node.style, { inset: "auto", margin: "0", maxHeight: "none", overflow: "hidden", top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: `${cardRadius}px` });
      animate(node, { top: [from.top, target.top], left: [from.left, target.left], width: [from.width, target.width], height: [from.height, target.height], borderRadius: [cardRadius, radius] } as never, grow as never).finished.then(() => {
        for (const key of ["inset", "margin", "max-height", "overflow", "top", "left", "width", "height", "border-radius"]) node.style.removeProperty(key);
      });
      const detailsEl = node.querySelector<HTMLElement>("[data-details]");
      if (detailsEl) animate(detailsEl, { opacity: [0, 1], y: [6, 0] } as never, { duration: duration.standard, ease: [...ease.enter], delay: duration.instant } as never);
      const closeSlot = node.querySelector<HTMLElement>("[data-close-slot]");
      if (closeSlot) animate(closeSlot, { opacity: [0, 1], scale: [0.9, 1] } as never, { duration: duration.fast, ease: [...ease.enter], delay: duration.instant } as never);
    });
    return { duration: 0 };
  }
  function panelOut(node: HTMLElement) {
    const to = card.getBoundingClientRect();
    if (reduced) {
      hidden = false;
      return { duration: duration.instant * 1000 };
    }
    const from = node.getBoundingClientRect();
    const radius = radiusOf(node);
    const cardRadius = radiusOf(card);
    Object.assign(node.style, { inset: "auto", margin: "0", maxHeight: "none", overflow: "hidden", top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px` });
    node.dataset.returning = "";
    animate(node, { top: [from.top, to.top], left: [from.left, to.left], width: [from.width, to.width], height: [from.height, to.height], borderRadius: [radius, cardRadius] } as never, settle as never).finished.then(() => (hidden = false));
    return { duration: 300 };
  }
  const overlayIn = poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" });
  const overlayOut = poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: duration.instant } : { duration: duration.exit, ease: "standard" });

  // A new status replaces the whole line: the old one lifts away quickly while the new words rise in one after another.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  function lineIn(node: HTMLElement) {
    if (!reduced) {
      node.querySelectorAll<HTMLElement>("[data-word]").forEach((word) => {
        const order = Number(word.dataset.word);
        word.style.opacity = "0";
        animate(word, { opacity: [0, 1], y: [em(word, 0.3), 0], filter: [`blur(${blur.soft}px)`, "blur(0px)"] } as never, { duration: duration.standard, ease: [...ease.enter], delay: order * stagger.word } as never);
      });
    }
    return { duration: 0 };
  }
  const lineOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
</script>

{#snippet footer(extra: boolean)}
  {#if avatar || meta || status || action}
    <div class={["mc-card__footer", classNames?.footer]}>
      {#if avatar || meta || status}
        <div class={["mc-card__byline", classNames?.byline]}>
          {#if avatar}<span class={["mc-card__avatar", classNames?.avatar]}>{@render avatar()}</span>{/if}
          <span class="mc-card__bylineText">
            {#if meta}<span class={["mc-card__meta", classNames?.meta]}>{@render meta()}</span>{/if}
            {#if status}
              {#if extra}
                <span class="mc-card__status" role="status">
                  <span class="mc-card__srOnly">{status}</span>
                  <span class="mc-card__roll" aria-hidden="true">{#key status}<span class="mc-card__line" in:lineIn out:lineOut>{#each status.split(/(\s+)/) as part, index (index)}<span class="mc-card__word" data-word={index / 2}>{part}</span>{/each}</span>{/key}</span>
                </span>
              {:else}
                <span class="mc-card__status"><span class="mc-card__roll">{status}</span></span>
              {/if}
            {/if}
          </span>
        </div>
      {/if}
      {#if action}<div class={["mc-card__action", classNames?.action]}>{@render action()}</div>{/if}
    </div>
  {/if}
{/snippet}

<Dialog.Root open={isOpen} onOpenChange={setOpen}>
  <article bind:this={card} {...rest} class={["mc-card__card", className, classNames?.card]} data-hover={hovered || undefined} style={`${style ?? ""}${hidden ? ";visibility: hidden" : ""}`} onpointerenter={() => hover(true)} onpointerleave={() => hover(false)}>
    {#if media}<div class={["mc-card__media", classNames?.media]}><div bind:this={zoom} class={["mc-card__zoom", classNames?.zoom]}>{@render media()}</div></div>{/if}
    <div class={["mc-card__content", classNames?.content]}>
      <h3 class={["mc-card__title", classNames?.title]}>
        {#if details}
          <Dialog.Trigger>
            {#snippet child({ props })}<button {...props} type="button" class="mc-card__trigger" onclick={(event) => { origin = card.getBoundingClientRect(); props.onclick?.(event); }}>{title}</button>{/snippet}
          </Dialog.Trigger>
        {:else}{title}{/if}
      </h3>
      {#if description}<p class={["mc-card__description", classNames?.description]}>{description}</p>{/if}
      {@render children?.()}
      {@render footer(true)}
    </div>
  </article>
  {#if details}
    <Dialog.Portal>
      {#if isOpen}
        <Dialog.Overlay forceMount>
          {#snippet child({ props })}<div {...props} class="mc-card__overlay" in:overlayIn out:overlayOut></div>{/snippet}
        </Dialog.Overlay>
        <Dialog.Content forceMount aria-describedby={description ? undefined : undefined}>
          {#snippet child({ props })}
            <div {...props} class={["mc-card__panel", classNames?.panel]} in:panelIn out:panelOut>
              {#if media}<div class={["mc-card__media", classNames?.media]}><div class={["mc-card__zoom", classNames?.zoom]}>{@render media()}</div></div>{/if}
              <span data-close-slot class={["mc-card__closeSlot", classNames?.closeSlot]}><Dialog.Close class={["mc-card__close", classNames?.close]} aria-label="Close quick look"><X size={16} strokeWidth={1.75} aria-hidden="true" /></Dialog.Close></span>
              <div class={["mc-card__content", classNames?.content]}>
                <Dialog.Title><h2 class="mc-card__title">{title}</h2></Dialog.Title>
                {#if description}<Dialog.Description><p class="mc-card__description">{description}</p></Dialog.Description>{/if}
                {@render children?.()}
                {@render footer(false)}
                <div data-details class={["mc-card__details", classNames?.details]}>{@render details()}</div>
              </div>
            </div>
          {/snippet}
        </Dialog.Content>
      {/if}
    </Dialog.Portal>
  {/if}
</Dialog.Root>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Isolation keeps the rounded clip on the media while the card lifts on its own layer (Safari drops it otherwise).
   Motion drives the lift and the quick look morph, so transform never gets a CSS transition here. */
.mc-card__card { position: relative; min-width: 0; overflow: hidden; isolation: isolate; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
/* A pointed-at card floats a little, so the shadow arrives with the lift. Touch and pen never lift. */
.mc-card__card[data-hover] { border-color: var(--border-strong); box-shadow: var(--shadow-raised); }
.mc-card__card:has(.mc-card__trigger:focus-visible) { border-color: var(--border-strong); }
.mc-card__media { position: relative; overflow: hidden; background: var(--surface-muted); }
.mc-card__zoom { display: grid; min-height: 112px; place-items: center; }
.mc-card__content { padding: var(--space-5); }
/* Fit-content width keeps the title's box the shape of its text, so it scales evenly when it grows into the quick look. */
.mc-card__title { width: fit-content; max-width: 100%; margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); line-height: 1.3; text-wrap: balance; }
.mc-card__trigger { padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* The title's hit area stretches over the whole card, so pointing anywhere opens the quick look while the action stays on top. */
.mc-card__trigger::after { content: ""; position: absolute; inset: 0; }
.mc-card__trigger:focus-visible { outline: none; }
.mc-card__description { max-width: 34ch; margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); text-wrap: pretty; }
.mc-card__footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-5); }
.mc-card__byline { display: flex; flex: 1 1 auto; align-items: center; gap: var(--space-3); min-width: 0; }
.mc-card__avatar { display: grid; flex: none; width: var(--space-8); height: var(--space-8); overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-card__avatar > * { width: 100%; height: 100%; object-fit: cover; }
/* A shrinkable column, so a narrow footer truncates the byline instead of sliding it under the action. */
.mc-card__bylineText { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-card__meta { overflow: hidden; color: var(--foreground); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.mc-card__status { position: relative; overflow: clip visible; color: var(--text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* The line clips sideways only, so a status too long for its column ends in an ellipsis while its words still rise in unclipped. */
.mc-card__roll { position: relative; display: block; }
.mc-card__line { display: block; overflow: clip visible; text-overflow: ellipsis; }
.mc-card__word { display: inline-block; white-space: pre; }
.mc-card__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-card__action { position: relative; z-index: 1; display: flex; flex: none; flex-wrap: wrap; gap: var(--space-3); }

.mc-card__overlay { position: fixed; inset: 0; z-index: 50; background: oklch(10% 0 0 / .46); backdrop-filter: blur(7px); }
/* Centered with auto margins, so transform stays free for the morph. */
.mc-card__panel { position: fixed; inset: 0; z-index: 51; width: min(calc(100vw - var(--space-8)), 30rem); height: fit-content; max-height: calc(100dvh - var(--space-8)); margin: auto; overflow: hidden auto; overscroll-behavior: contain; border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); transition: background-color var(--duration-standard) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
.mc-card__panel:focus { outline: none; }
/* Closing: the panel takes the card's box and look, so it lands exactly where the card sits and hands back without a seam. */
.mc-card__panel[data-returning] { inset: auto; top: var(--landing-top); left: var(--landing-left); width: var(--landing-width); height: var(--landing-height); max-height: none; margin: 0; overflow: hidden; border-color: var(--border); background: var(--surface); box-shadow: none; pointer-events: none; }
.mc-card__panel[data-returning] .mc-card__content { padding: var(--space-5); }
.mc-card__panel[data-returning] .mc-card__title { font-size: var(--text-lg); }
.mc-card__panel .mc-card__content { padding: var(--space-6); }
.mc-card__panel .mc-card__title { font-size: var(--text-xl); }
.mc-card__panel .mc-card__description { max-width: var(--card-measure, 34ch); }
/* The slot carries the entrance, so the button's own press answers instantly. */
.mc-card__closeSlot { position: absolute; top: var(--space-4); right: var(--space-4); z-index: 2; display: grid; }
.mc-card__close { display: grid; width: var(--space-8); height: var(--space-8); place-items: center; padding: 0; border: 1px solid color-mix(in oklab, var(--border) 70%, transparent); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--surface-raised) 74%, transparent); backdrop-filter: blur(12px); color: var(--foreground); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-card__close:hover { background: var(--surface-raised); } }
.mc-card__details { margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--border); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }

@media (prefers-reduced-motion: reduce) {
  .mc-card__card, .mc-card__close { transition-duration: var(--duration-instant); }
}
}
</style>
