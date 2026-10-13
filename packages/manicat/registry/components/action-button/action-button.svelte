<script lang="ts">
  interface Props {
    label: string;
    successLabel?: string;
    pendingLabel?: string;
    /** Runs when clicked. A promise drives the pending and success states. */
    onAction: () => void | Promise<void>;
    /** Called with the error when the action rejects. */
    onerror?: (error: unknown) => void;
    /** Milliseconds the success state shows before the button returns to idle. */
    resetAfterMs?: number;
    disabled?: boolean;
    /** Extend the inner, named parts of the action button: spinner or label. */
    classNames?: { spinner?: string; label?: string };
  }

  let { label, successLabel = "Done", pendingLabel, onAction, onerror, resetAfterMs = 1600, disabled = false, classNames }: Props = $props();

  let phase = $state<"idle" | "pending" | "success">("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function press() {
    if (phase !== "idle") return;
    phase = "pending";
    try {
      await onAction();
      phase = "success";
      timer = setTimeout(() => (phase = "idle"), resetAfterMs);
    } catch (error) {
      phase = "idle";
      onerror?.(error);
    }
  }

  $effect(() => () => clearTimeout(timer));
</script>

<button type="button" class="mc-action" data-phase={phase} {disabled} aria-busy={phase === "pending" || undefined} onclick={press}>
  {#if phase === "pending"}
    <span class={["mc-action__spinner", classNames?.spinner]} aria-hidden="true"></span>
  {:else if phase === "success"}
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
  {/if}
  <span class={["mc-action__label", classNames?.label]}>{phase === "success" ? successLabel : phase === "pending" ? (pendingLabel ?? label) : label}</span>
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: var(--control-height-md); padding: 0 var(--space-4); border: 1px solid var(--foreground); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard), border-color var(--duration-standard) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-action:active:not(:disabled) { transform: scale(.97); }
.mc-action[data-phase="pending"] { cursor: progress; }
.mc-action[data-phase="success"] { border-color: var(--success); background: var(--surface); color: var(--success); }
.mc-action:disabled { opacity: .52; cursor: not-allowed; }
.mc-action__spinner { width: 14px; height: 14px; border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: mc-action-spin .7s linear infinite; }
@keyframes mc-action-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-action { transition: none; } .mc-action:active:not(:disabled) { transform: none; } .mc-action__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
}
</style>
