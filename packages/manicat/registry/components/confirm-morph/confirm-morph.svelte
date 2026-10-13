<script lang="ts" module>
  export type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    prompt?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    pendingLabel?: string;
    doneLabel?: string;
    errorLabel?: string;
    retryLabel?: string;
    undoLabel?: string;
    tone?: "danger" | "neutral";
    onConfirm?: () => void | Promise<unknown>;
    onUndo?: () => void | Promise<unknown>;
    oncancel?: () => void;
    /** Milliseconds the confirmation waits before backing out on its own. */
    confirmTimeout?: number;
    /** Milliseconds the result shows before returning to idle. */
    resultTimeout?: number;
    disabled?: boolean;
    /** The step the control is on. Bind it with `bind:state`. */
    state?: ConfirmMorphState;
    /** Draws its leading icon. */
    icon?: Snippet;
    /** Extend the inner, named parts of the button: label or action. */
    classNames?: { label?: string; action?: string };
  }

  let {
    label,
    prompt = "Are you sure?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    pendingLabel = "Working…",
    doneLabel = "Done",
    errorLabel = "Something went wrong",
    retryLabel = "Retry",
    undoLabel = "Undo",
    tone = "neutral",
    onConfirm,
    onUndo,
    oncancel,
    confirmTimeout = 5000,
    resultTimeout = 4000,
    disabled = false,
    state = $bindable("idle"),
    icon,
    classNames,
  }: Props = $props();

  // Each step with a time limit backs out to idle on its own.
  $effect(() => {
    const value = state;
    const wait = value === "confirming" ? confirmTimeout : value === "done" || value === "error" ? resultTimeout : 0;
    if (!wait) return;
    const timer = setTimeout(() => (state = "idle"), wait);
    return () => clearTimeout(timer);
  });

  async function confirm() {
    state = "pending";
    try {
      await onConfirm?.();
      state = "done";
    } catch {
      state = "error";
    }
  }

  async function undo() {
    state = "pending";
    try {
      await onUndo?.();
      state = "idle";
    } catch {
      state = "error";
    }
  }

  function cancel() {
    state = "idle";
    oncancel?.();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && state === "confirming") cancel();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class={["mc-confirm", `mc-confirm--${tone}`]} role="group" data-state={state} aria-live="polite" onkeydown={onKeydown}>
  {#if state === "idle"}
    <button type="button" class="mc-confirm__main" {disabled} onclick={() => (state = "confirming")}>
      {@render icon?.()}<span class={classNames?.label}>{label}</span>
    </button>
  {:else if state === "confirming"}
    <span class="mc-confirm__text">{prompt}</span>
    <button type="button" class={["mc-confirm__action", classNames?.action]} onclick={cancel}>{cancelLabel}</button>
    <!-- svelte-ignore a11y_autofocus -->
    <button type="button" class={["mc-confirm__action", "mc-confirm__action--strong", classNames?.action]} autofocus onclick={confirm}>{confirmLabel}</button>
  {:else if state === "pending"}
    <span class="mc-confirm__spinner" aria-hidden="true"></span><span class="mc-confirm__text">{pendingLabel}</span>
  {:else if state === "done"}
    <span class="mc-confirm__done">✓ {doneLabel}</span>
    {#if onUndo}<button type="button" class={["mc-confirm__action", classNames?.action]} onclick={undo}>{undoLabel}</button>{/if}
  {:else}
    <span class="mc-confirm__error">{errorLabel}</span>
    <button type="button" class={["mc-confirm__action", classNames?.action]} onclick={confirm}>{retryLabel}</button>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-confirm { --mc-accent: var(--foreground); display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); font-size: var(--text-sm); animation: mc-confirm-in .24s var(--ease-enter) both; }
.mc-confirm--danger { --mc-accent: var(--danger); }
.mc-confirm[data-state="error"] { border-color: var(--danger); }
.mc-confirm__main { display: inline-flex; align-items: center; gap: var(--space-2); border: 0; background: transparent; color: var(--mc-accent); font: inherit; font-weight: 500; cursor: pointer; }
.mc-confirm__main:disabled { opacity: .5; cursor: not-allowed; }
.mc-confirm__action { padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-confirm__action--strong { border-color: var(--mc-accent); background: var(--mc-accent); color: var(--background); }
@media (hover: hover) and (pointer: fine) { .mc-confirm__action:not(.mc-confirm__action--strong):hover { background: var(--surface-muted); } }
.mc-confirm__text { color: var(--text-secondary); }
.mc-confirm__done { color: var(--success); font-weight: 500; }
.mc-confirm__error { color: var(--danger); }
.mc-confirm__spinner { width: 14px; height: 14px; border: 1.5px solid var(--mc-accent); border-right-color: transparent; border-radius: 50%; animation: mc-confirm-spin .7s linear infinite; }
@keyframes mc-confirm-in { from { opacity: .6; transform: scale(.98); } to { opacity: 1; transform: none; } }
@keyframes mc-confirm-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-confirm { animation: none; } .mc-confirm__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
}
</style>
