<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Dialog } from "bits-ui";
  import type { DialogRootProps } from "bits-ui";

  let { open = $bindable(false), children, ...rest }: DialogRootProps = $props();
</script>

<Dialog.Root bind:open {...rest}>{@render children?.()}</Dialog.Root>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-dialog__overlay { position: fixed; inset: 0; z-index: 50; background: oklch(10% 0 0 / .46); backdrop-filter: blur(7px); }
/* Centered with auto margins (like a native modal dialog) so transform stays free for the entrance spring. */
.mc-dialog__content { position: fixed; z-index: 51; inset: 0; width: min(calc(100vw - var(--space-8)), 440px); height: fit-content; max-height: calc(100vh - var(--space-8)); max-height: calc(100dvh - var(--space-8)); margin: auto; overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); }
/* Motion animates both layers. Keyframes only run when DialogContent sits under a bare Radix root. */
.mc-dialog__keyframes.mc-dialog__overlay[data-state="open"] { animation: mc-dialog-overlay-in var(--duration-standard) var(--ease-enter) both; }
.mc-dialog__keyframes.mc-dialog__overlay[data-state="closed"] { animation: mc-dialog-overlay-out var(--duration-fast) var(--ease-standard) both; }
.mc-dialog__keyframes.mc-dialog__content[data-state="open"] { animation: mc-dialog-content-fade-in var(--duration-fast) var(--ease-enter) both, mc-dialog-content-rise-in var(--duration-spring) var(--ease-spring) both; }
.mc-dialog__keyframes.mc-dialog__content[data-state="closed"] { animation: mc-dialog-content-out var(--duration-fast) var(--ease-standard) both; }
.mc-dialog__content:focus { outline: none; }
/* While the layers leave, clicks pass through, so the trigger can reopen the dialog mid-exit. Radix sets pointer-events inline on the overlay. */
.mc-dialog__overlay[data-state="closed"], .mc-dialog__content[data-state="closed"] { pointer-events: none !important; }
.mc-dialog__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-5); padding: var(--space-6); border-bottom: 1px solid var(--border); }
.mc-dialog__title { margin: 0; font-family: var(--font-body); font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); }
.mc-dialog__description { margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-dialog__title, .mc-dialog__description { position: relative; overflow-wrap: anywhere; }
.mc-dialog__swap { display: block; }
/* Line height sits on the text itself, so a page-level heading reset cannot shrink the title and pull the close button off its line. */
.mc-dialog__title .mc-dialog__swap { line-height: var(--leading-body); }
/* A compact icon button: quick press, spring release. The negative margin centres it on the title's first line. */
.mc-dialog__close { flex: 0 0 auto; margin-block: calc((var(--text-lg) * var(--leading-body) - var(--space-8)) / 2); display: grid; place-items: center; width: var(--space-8); height: var(--space-8); border: 1px solid var(--border); border-radius: var(--radius-control); background: color-mix(in oklab, var(--surface-muted) 50%, transparent); color: var(--text-secondary); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-dialog__close:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-dialog__close:active { transform: scale(.96); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-dialog__body { padding: var(--space-6); font-size: var(--text-sm); line-height: var(--leading-body); }
@keyframes mc-dialog-overlay-in { from { opacity: 0; } }
@keyframes mc-dialog-overlay-out { to { opacity: 0; } }
@keyframes mc-dialog-content-fade-in { from { opacity: 0; } }
@keyframes mc-dialog-content-rise-in { from { transform: translateY(8px) scale(.96); } }
@keyframes mc-dialog-content-out { to { opacity: 0; transform: translateY(4px) scale(.98); } }
@keyframes mc-dialog-content-fade-out { to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .mc-dialog__keyframes.mc-dialog__overlay[data-state="open"], .mc-dialog__keyframes.mc-dialog__content[data-state="open"] { animation: mc-dialog-overlay-in var(--duration-instant) var(--ease-standard) both; }
  .mc-dialog__keyframes.mc-dialog__overlay[data-state="closed"] { animation: mc-dialog-overlay-out var(--duration-instant) var(--ease-standard) both; }
  .mc-dialog__keyframes.mc-dialog__content[data-state="closed"] { animation: mc-dialog-content-fade-out var(--duration-instant) var(--ease-standard) both; }
  .mc-dialog__close, .mc-dialog__close:active { transition: none; }
  .mc-dialog__close:active { transform: none; }
}
}
</style>
