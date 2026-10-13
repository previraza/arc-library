<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount } from "svelte";
  import { X } from "@lucide/svelte";
  import { curveOf, poseTransition, popOut } from "@/lib/motion-dom";
  import { createHeightFrame, createSwipe } from "@/lib/toast";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    title: string;
    description?: string;
    /** Whether the toast is showing. Bind it with `bind:open`. */
    open?: boolean;
    /** Called when the toast closes itself or is dismissed. */
    onOpenChange?: (open: boolean) => void;
    /** Milliseconds before it closes itself. Pass 0 to keep it until dismissed. */
    duration?: number;
    class?: string;
    /** Extend the inner, named parts of the toast: icon, frame, copy, title, line, description or close. */
    classNames?: { icon?: string; frame?: string; copy?: string; title?: string; line?: string; description?: string; close?: string };
    [key: string]: unknown;
  }

  let { title, description, open = $bindable(true), onOpenChange, duration = 4500, class: className, classNames, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration: length, blur } = motionTokens;
  let dismissed = $state(false);
  let throwX = 0;
  let releaseVelocity = 0;
  const visible = $derived(open && !dismissed);
  let frame = $state<HTMLElement>();
  let content = $state<HTMLElement>();
  let surface = $state<HTMLElement>();
  let heightFrame: ReturnType<typeof createHeightFrame> | undefined;
  let swiper: ReturnType<typeof createSwipe> | undefined;
  let wasOpen = open;
  $effect.pre(() => {
    if (open && !wasOpen) {
      dismissed = false;
      throwX = 0;
    }
    wasOpen = open;
  });

  /** Closing tells the parent at once, while the exit plays out here, so a new toast can be raised mid-exit and simply turns back. */
  function dismiss(to: number) {
    throwX = to;
    dismissed = true;
    open = false;
    onOpenChange?.(false);
  }

  $effect(() => {
    if (!visible || !onOpenChange || duration <= 0) return;
    const timer = setTimeout(() => {
      throwX = 0;
      dismissed = true;
      open = false;
      onOpenChange?.(false);
    }, duration);
    return () => clearTimeout(timer);
  });

  // The copy column follows its content height, so a longer message grows the toast instead of snapping it.
  $effect.pre(() => {
    title;
    description;
    heightFrame?.changed();
  });
  $effect(() => {
    if (!surface || !frame || !content) return;
    heightFrame = createHeightFrame(frame, content, reduced);
    swiper = createSwipe(surface, { reduced: () => reduced, onThrow: (to, velocity) => { releaseVelocity = velocity; dismiss(to); } });
    const path = surface.querySelector("path");
    if (path && !reduced) animate(path, { pathLength: [0, 1] }, { duration: length.standard, ease: [...motionTokens.ease.enter], delay: 0.12 });
    return () => {
      heightFrame?.destroy();
      swiper?.destroy();
    };
  });

  // Toasts rise in from their edge; a thrown one keeps going the way it was thrown, a closed one sinks back toward the edge it came from.
  const rise = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, x: 0, y: 16, scale: 0.96 }, { opacity: 1, x: 0, y: 0, scale: 1 }, reduced ? { duration: length.instant } : { spring: "morph", fade: length.standard });
  const sink = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, reduced ? { duration: length.instant } : { duration: length.exit, ease: "standard" });
  function leave(node: HTMLElement) {
    if (!throwX || reduced) return sink(node);
    const from = swiper?.offset() ?? 0;
    const to = throwX;
    const { duration: span, easing } = curveOf({ spring: { type: "spring", visualDuration: 0.3, bounce: 0, restDelta: 2, restSpeed: 40 } });
    return { duration: span, easing, css: (t: number, u: number) => `transform: translateX(${from + (to - from) * u}px); opacity: ${Math.max(0, 1 - (u * span) / (length.exit * 1000))};` };
  }

  // Changed copy rises in and the old copy lifts away, so the live region reads only the current text.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const textIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: length.instant } : { duration: length.standard, ease: "enter" })(node);
  function textOut(node: HTMLElement) {
    node.setAttribute("aria-hidden", "true");
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: length.instant } : { duration: length.fast, ease: "standard" }, { pop: true })(node);
  }
</script>

{#if visible}
  <div {...rest} bind:this={surface} class={["mc-toast__toast", className]} role="status" aria-live="polite" aria-atomic="true" in:rise out:leave>
    <span class={["mc-toast__icon", classNames?.icon]} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
    </span>
    <!-- The copy column follows its content height, so a longer message grows the toast instead of snapping it. -->
    <div bind:this={frame} class={["mc-toast__frame", classNames?.frame]}>
      <div bind:this={content} class={["mc-toast__copy", classNames?.copy]}>
        <strong class={["mc-toast__title", classNames?.title]}>{#key title}<span class={["mc-toast__line", classNames?.line]} in:textIn out:textOut>{title}</span>{/key}</strong>
        {#if description}{#key description}<span class={["mc-toast__description", classNames?.description]} in:textIn out:textOut>{description}</span>{/key}{/if}
      </div>
    </div>
    <button class={["mc-toast__close", classNames?.close]} type="button" aria-label="Dismiss notification" onclick={() => dismiss(0)}><X size={16} strokeWidth={2} aria-hidden="true" /></button>
  </div>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-toast__toast {
  display: flex;
  width: min(100%, 26rem);
  min-width: 0;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: color-mix(in oklab, var(--surface) 94%, var(--background));
  color: var(--foreground);
  letter-spacing: var(--tracking-body);
  box-shadow: var(--shadow-floating);
}

.mc-toast__icon {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in oklab, var(--success) 24%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--success) 10%, var(--surface));
  color: var(--success);
}

.mc-toast__frame {
  display: block;
  min-width: 0;
  flex: 1;
}

.mc-toast__copy {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 0.125rem;
  /* Centers the title's first line on the 30px status icon. */
  padding-top: 0.3125rem;
}

.mc-toast__title {
  position: relative;
  display: block;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: var(--leading-body);
}

.mc-toast__line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-toast__description {
  display: block;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
}

.mc-toast__close {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  margin: -0.0625rem -0.125rem 0 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: transform var(--duration-spring) var(--ease-spring),
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .mc-toast__close:hover {
    background: var(--surface-muted);
    color: var(--foreground);
  }
}

/* Quick press, spring release. */
.mc-toast__close:active {
  transform: scale(0.96);
  transition-duration: var(--duration-instant);
  transition-timing-function: var(--ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  .mc-toast__close { transition: none; }
  .mc-toast__close:active { transform: none; }
}
}
</style>
