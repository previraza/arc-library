<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { arrowRightIcon, createMorphText, createPhaseSlot, drawnCheckIcon, pressable } from "@/lib/motion-dom";
  import type { MorphText, PhaseSlot } from "@/lib/motion-dom";

  interface Props {
    label: string;
    successLabel?: string;
    pendingLabel?: string;
    /** Runs when pressed. A promise drives the pending and success states. */
    onAction: () => void | Promise<void>;
    resetAfterMs?: number;
    onActionError?: (error: unknown) => void;
    disabled?: boolean;
    /** Extend the inner, named parts of the action button: content, morph, glyphs, glyph, iconSlot, phase, spinner, statusIcon or arrow. */
    classNames?: { content?: string; morph?: string; glyphs?: string; glyph?: string; iconSlot?: string; phase?: string; spinner?: string; statusIcon?: string; arrow?: string };
  }

  let { label, successLabel = "Saved", pendingLabel = "Saving", onAction, resetAfterMs = 2400, onActionError, disabled = false, classNames }: Props = $props();

  let state = $state<"idle" | "pending" | "success">("idle");
  const text = $derived(state === "pending" ? pendingLabel : state === "success" ? successLabel : label);
  let button: HTMLButtonElement;
  let textHost: HTMLElement;
  let iconSlot: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let morph: MorphText | undefined;
  let phase: PhaseSlot | undefined;

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

  function showPhase(current: typeof state) {
    if (current === "pending") {
      phase?.show("pending", "icon", () => Object.assign(document.createElement("span"), { className: cn("mc-action-button__spinner", classNames?.spinner) }));
    } else if (current === "success") {
      phase?.show("success", "icon", () => drawnCheckIcon(cn("mc-action-button__statusIcon", classNames?.statusIcon), reduced));
    } else {
      phase?.show("idle", "arrow", () => arrowRightIcon(cn("mc-action-button__arrow", classNames?.arrow)));
    }
  }

  onMount(() => {
    morph = createMorphText(textHost, {
      text,
      reduced,
      classes: { morph: cn("mc-action-button__morph", classNames?.morph), glyphs: cn("mc-action-button__glyphs", classNames?.glyphs), glyph: cn("mc-action-button__glyph", classNames?.glyph) },
    });
    phase = createPhaseSlot(iconSlot, { reduced, phaseClass: cn("mc-action-button__phase", classNames?.phase) });
    showPhase(state);
    const release = pressable(button, { reduced, enabled: () => !disabled && state !== "pending" });
    return () => {
      clearTimeout(timer);
      morph?.destroy();
      phase?.destroy();
      release();
    };
  });

  $effect(() => morph?.set(text));
  $effect(() => showPhase(state));

  async function run() {
    if (state === "pending") return;
    clearTimeout(timer);
    state = "pending";
    try {
      await onAction();
      state = "success";
      if (resetAfterMs > 0) timer = setTimeout(() => (state = "idle"), resetAfterMs);
    } catch (error) {
      state = "idle";
      onActionError?.(error);
    }
  }
</script>

<!-- Pending stays focusable (aria-disabled instead of disabled), so a keyboard user keeps focus through the whole save. -->
<button bind:this={button} type="button" class="mc-action-button__button" {disabled} aria-disabled={state === "pending" ? true : undefined} aria-busy={state === "pending"} data-state={state} onclick={run}>
  <span class={["mc-action-button__content", classNames?.content]} aria-hidden="true">
    <span bind:this={textHost} style="display: contents"></span>
    <span bind:this={iconSlot} class={["mc-action-button__iconSlot", classNames?.iconSlot]}></span>
  </span>
  <span class="mc-action-button__visuallyHidden">{label}</span>
  <span class="mc-action-button__visuallyHidden" role="status">{state === "pending" ? pendingLabel : state === "success" ? successLabel : ""}</span>
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The button hugs its label: text morphs in place and the width follows on a spring, so no state ever snaps the layout. */
.mc-action-button__button { position: relative; display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; overflow: hidden; padding: 0 var(--space-5); border: 1px solid var(--foreground); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-action-button__button:hover:not(:disabled) { box-shadow: var(--shadow-resting); } }
.mc-action-button__button:disabled { cursor: not-allowed; }
.mc-action-button__button:disabled:not([data-state="pending"]) { opacity: .7; }
.mc-action-button__button[data-state="pending"] { cursor: progress; }
.mc-action-button__content { display: inline-flex; min-height: 1.25rem; align-items: center; justify-content: center; gap: var(--space-2); white-space: nowrap; }
.mc-action-button__morph { display: inline-flex; min-width: 0; }
.mc-action-button__morph[data-morphing] { clip-path: inset(-.6em 0 -.6em -.3em); }
.mc-action-button__glyphs { position: relative; display: inline-flex; flex: none; white-space: pre; }
.mc-action-button__glyph { display: inline-block; }
.mc-action-button__iconSlot { display: grid; width: 17px; height: 17px; flex: 0 0 17px; place-items: center; }
.mc-action-button__phase { grid-area: 1 / 1; display: grid; width: 17px; height: 17px; place-items: center; }
.mc-action-button__arrow { flex: none; }
.mc-action-button__statusIcon { color: currentColor; }
.mc-action-button__spinner { display: inline-block; width: var(--space-4); height: var(--space-4); border: 1.5px solid currentColor; border-right-color: transparent; border-radius: var(--radius-pill); animation: mc-action-button-spin .7s linear infinite; }
.mc-action-button__visuallyHidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes mc-action-button-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-action-button__button { transition: none; } .mc-action-button__spinner { animation: none; } }
}
</style>
