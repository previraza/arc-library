<script lang="ts" module>
  export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
  export type ButtonSize = "sm" | "md" | "lg";
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { createLabelSwap, createPresence, loaderMotion, pressable } from "@/lib/motion-dom";
  import type { LabelSwap, Presence } from "@/lib/motion-dom";

  interface Props extends Omit<HTMLButtonAttributes, "class"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children?: Snippet;
    /** Extend the inner, named parts of the button: loader, spinner, labelSlot, labelContent or labelPhase. */
    classNames?: { loader?: string; spinner?: string; labelSlot?: string; labelContent?: string; labelPhase?: string };
  }

  let { variant = "primary", size = "md", loading = false, disabled = false, type = "button", onclick, children, classNames, ...rest }: Props = $props();

  let button: HTMLButtonElement;
  let loaderHost: HTMLElement;
  let labelSlot: HTMLElement;
  let labelContent: HTMLElement;
  let labelPhase: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let loader: Presence | undefined;

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

  onMount(() => {
    loader = createPresence(
      loaderHost,
      () => {
        const node = Object.assign(document.createElement("span"), { className: cn("mc-button__loader", classNames?.loader) });
        node.setAttribute("aria-hidden", "true");
        node.append(Object.assign(document.createElement("span"), { className: cn("mc-button__spinner", classNames?.spinner) }));
        return node;
      },
      loaderMotion(reduced),
    );
    loader.set(loading, false);
    const swap: LabelSwap = createLabelSwap(labelSlot, labelContent, labelPhase, { reduced });
    // A trigger that anchors a menu, popover or dialog keeps its rect still while pressed, so the layer never measures a scaled anchor.
    const release = pressable(button, {
      reduced,
      enabled: () => {
        const popup = (rest as Record<string, unknown>)["aria-haspopup"];
        const anchorsLayer = (popup !== undefined && popup !== false && popup !== "false") || rest.role === "combobox" || (rest as Record<string, unknown>)["data-state"] !== undefined;
        const inert = disabled || loading || (rest as Record<string, unknown>)["aria-disabled"] === true || (rest as Record<string, unknown>)["aria-disabled"] === "true";
        return !(anchorsLayer || inert);
      },
    });
    return () => {
      swap.destroy();
      loader?.destroy();
      release();
    };
  });

  $effect(() => loader?.set(loading));

  // Loading keeps the button focusable (a disabled one drops keyboard focus mid-action) and swallows presses instead.
  function press(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (loading) return event.preventDefault();
    onclick?.(event);
  }
</script>

<button bind:this={button} {...rest} class={["mc-button__button", `mc-button__${variant}`, `mc-button__${size}`]} {type} {disabled} aria-busy={loading || undefined} aria-disabled={loading || undefined} onclick={press}>
  <span bind:this={loaderHost} style="display: contents"></span>
  <span bind:this={labelSlot} class={["mc-button__labelSlot", loading && "mc-button__loadingLabel", classNames?.labelSlot]}>
    <span bind:this={labelContent} class={["mc-button__labelContent", classNames?.labelContent]}>
      <span bind:this={labelPhase} class={["mc-button__labelPhase", classNames?.labelPhase]}>{@render children?.()}</span>
    </span>
  </span>
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Press scale is driven by Motion (whileTap) alone, so transform never gets a CSS transition here. */
.mc-button__button { position: relative; display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; gap: var(--space-2); border: 1px solid transparent; border-radius: var(--radius-control); padding: 0 var(--space-4); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-button__button:disabled { cursor: not-allowed; opacity: .52; }
.mc-button__button[aria-busy="true"] { cursor: progress; }
/* Anchors of floating layers never scale: Radix opens on pointerdown and would measure a shrunken trigger. */
.mc-button__button:is([aria-haspopup]:not([aria-haspopup="false"]), [data-state], [role="combobox"]) { transform: none !important; }
/* The slot's width follows the incoming label on a spring. The label stays centered and may overflow evenly while the slot catches up;
   the outgoing label pops out of flow against the slot itself, so it keeps its place instead of following the new content box. */
.mc-button__labelSlot { position: relative; display: inline-flex; min-width: 0; align-items: center; justify-content: center; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-button__labelSlot[data-morphing] { clip-path: inset(-50% calc(var(--space-3) * -1)); }
.mc-button__labelContent { display: inline-flex; flex: none; align-items: center; }
.mc-button__labelPhase { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); white-space: nowrap; }
.mc-button__labelPhase svg { flex: none; }
.mc-button__primary { color: var(--background); background: var(--foreground); border-color: var(--foreground); }
.mc-button__secondary { color: var(--foreground); background: var(--surface); border-color: var(--border); }
.mc-button__ghost { color: var(--text-secondary); background: transparent; border-color: transparent; }
.mc-button__danger { color: var(--danger); background: var(--surface); border-color: var(--border); }
@media (hover: hover) and (pointer: fine) {
  .mc-button__primary:hover:not(:disabled) { opacity: .91; box-shadow: var(--shadow-resting); }
  .mc-button__secondary:hover:not(:disabled) { background: var(--surface-muted); box-shadow: var(--shadow-resting); }
  .mc-button__ghost:hover:not(:disabled) { color: var(--foreground); background: var(--surface-muted); }
  .mc-button__danger:hover:not(:disabled) { border-color: var(--danger); background: var(--surface-muted); }
}
/* Color feedback on press, so touch and menu triggers (which never scale) still answer the finger. */
.mc-button__primary:active:not(:disabled) { opacity: .84; }
.mc-button__secondary:active:not(:disabled), .mc-button__ghost:active:not(:disabled) { color: var(--foreground); background: var(--surface-muted); }
.mc-button__danger:active:not(:disabled) { border-color: var(--danger); background: var(--surface-muted); }
.mc-button__sm { min-height: var(--control-height-sm); padding-inline: var(--space-3); font-size: var(--text-sm); }
.mc-button__md { min-height: var(--control-height-md); }
.mc-button__lg { min-height: var(--control-height-lg); padding-inline: var(--space-5); font-size: var(--text-sm); }
.mc-button__loader { position: absolute; left: 50%; top: 50%; display: grid; width: var(--space-4); height: var(--space-4); margin: calc(var(--space-4) / -2); }
.mc-button__spinner { border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: mc-button-spin .7s linear infinite; }
.mc-button__loadingLabel { opacity: 0; }
@keyframes mc-button-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-button__button { transition: none; } .mc-button__labelSlot { transition: opacity var(--duration-instant) linear; } .mc-button__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
}
</style>
