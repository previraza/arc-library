<script lang="ts" module>
  export type AlertTone = "info" | "success" | "warning" | "danger";
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { tick } from "svelte";
  import type { Snippet } from "svelte";
  import { Check, CircleX, Info, TriangleAlert, X } from "@lucide/svelte";
  import { createAutoSize, createLabelSwap, curveOf, poseTransition } from "@/lib/motion-dom";
  import type { LabelSwap } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    tone?: AlertTone;
    title: string;
    /** Controls presence. Hiding the alert collapses its height and fades it out. */
    open?: boolean;
    /** Shows a dismiss button. An uncontrolled alert collapses first, then calls `ondismiss`. */
    dismissible?: boolean;
    ondismiss?: () => void;
    /** The details under the title. */
    children?: Snippet;
    /** Extend the inner, named parts of the alert: presence, icon, glyph, copy, content, title, line, description or dismiss. */
    classNames?: { presence?: string; icon?: string; glyph?: string; copy?: string; content?: string; title?: string; line?: string; description?: string; dismiss?: string };
  }

  let { tone = "info", title, open = $bindable(), dismissible = false, ondismiss, children, classNames }: Props = $props();

  const icons = { info: Info, success: Check, warning: TriangleAlert, danger: CircleX };
  const Icon = $derived(icons[tone]);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dismissed = $state(false);
  const isOpen = $derived(open ?? !dismissed);

  let frame: HTMLElement | undefined = $state();
  let content: HTMLElement | undefined = $state();
  let glyph: HTMLElement | undefined = $state();
  let titleLine: HTMLElement | undefined = $state();
  let descriptionLine: HTMLElement | undefined = $state();

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

  // The copy column follows its content height, and the icon, title and message morph in place when they change.
  $effect(() => {
    if (!frame || !content) return;
    const size = createAutoSize(frame, content, { axis: "height", reduced });
    const follower = { arm: () => size.changed(), destroy: () => undefined };
    const swaps: LabelSwap[] = [];
    if (glyph?.parentElement) swaps.push(createLabelSwap(glyph.parentElement, glyph.parentElement, glyph, { reduced, icon: true, width: false, variant: "badge" }));
    for (const line of [titleLine, descriptionLine]) {
      const box = line?.parentElement;
      if (line && box) swaps.push(createLabelSwap(box, box, line, { reduced, follower, variant: "badge" }));
    }
    return () => {
      swaps.forEach((swap) => swap.destroy());
      size.destroy();
    };
  });
  void tick;

  // Presence collapses the height with the fade, so the content below closes the gap instead of jumping.
  function presence(node: HTMLElement) {
    const natural = node.offsetHeight;
    const timing = reduced ? { duration: 0 } : ({ spring: "smooth" } as const);
    const { duration, easing } = curveOf(timing);
    node.style.overflow = "hidden";
    return { duration, easing, css: (t: number) => `height: ${natural * t}px; opacity: ${t}; overflow: hidden;` };
  }
  const detailsIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: 4, blur: motionTokens.blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.standard, ease: "enter" });
  const detailsOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -4, blur: motionTokens.blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: "standard" }, { pop: true });

  function dismiss() {
    if (open === undefined) dismissed = true;
    else {
      open = false;
      ondismiss?.();
    }
  }
</script>

{#if isOpen}
  <div class={["mc-alert__presence", classNames?.presence]} transition:presence onoutroend={() => open === undefined && dismissible && ondismiss?.()}>
    <div class={["mc-alert__alert", `mc-alert__${tone}`]} role={tone === "danger" ? "alert" : "status"}>
      <!-- A new tone morphs its icon in place. -->
      <span class={["mc-alert__icon", classNames?.icon]}><span bind:this={glyph} class={["mc-alert__glyph", classNames?.glyph]}><Icon size={18} aria-hidden="true" /></span></span>
      <!-- The copy column follows its content height, so longer or shorter messages never snap the alert. -->
      <div bind:this={frame} class={["mc-alert__copy", classNames?.copy]}>
        <div bind:this={content} class={["mc-alert__content", classNames?.content]}>
          <strong class={["mc-alert__title", classNames?.title]}><span bind:this={titleLine} class={["mc-alert__line", classNames?.line]}>{title}</span></strong>
          {#if children}
            <p class={["mc-alert__description", classNames?.description]} in:detailsIn out:detailsOut><span bind:this={descriptionLine} class={["mc-alert__line", classNames?.line]}>{@render children()}</span></p>
          {/if}
        </div>
      </div>
      {#if dismissible}<button type="button" class={["mc-alert__dismiss", classNames?.dismiss]} aria-label={`Dismiss: ${title}`} onclick={dismiss}><X size={16} strokeWidth={1.75} aria-hidden="true" /></button>{/if}
    </div>
  </div>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-alert__presence { min-width: 0; }
.mc-alert__alert { display: flex; align-items: start; gap: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); padding: var(--space-4); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-alert__icon, .mc-alert__glyph { position: relative; display: grid; flex: 0 0 auto; place-items: center; }
.mc-alert__icon { width: 18px; height: 18px; margin-top: 1px; }
.mc-alert__icon svg { display: block; }
.mc-alert__copy { flex: 1; min-width: 0; }
.mc-alert__content { position: relative; }
.mc-alert__title { position: relative; display: block; font-size: var(--text-sm); font-weight: 500; }
.mc-alert__line { display: block; }
.mc-alert__description { position: relative; margin: var(--space-1) 0 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-alert__info .mc-alert__icon { color: var(--accent); } .mc-alert__success .mc-alert__icon { color: var(--success); } .mc-alert__warning .mc-alert__icon { color: var(--warning); } .mc-alert__danger .mc-alert__icon { color: var(--danger); }
.mc-alert__dismiss { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; margin: -5px -6px -5px 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-alert__dismiss:active { transform: scale(.96); transition-duration: var(--duration-instant); transition-timing-function: var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-alert__dismiss:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-alert__dismiss { transition: none; } .mc-alert__dismiss:active { transform: none; } }
}
</style>
