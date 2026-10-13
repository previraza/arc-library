<script lang="ts">
  interface Props {
    value: string;
    label?: string;
    iconOnly?: boolean;
    variant?: "outline" | "plain";
    disabled?: boolean;
    oncopied?: () => void;
    /** Extend the inner, named parts of the copy button: icon or label. */
    classNames?: { icon?: string; label?: string };
  }

  let { value, label = "Copy", iconOnly = false, variant = "outline", disabled = false, oncopied, classNames }: Props = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      oncopied?.();
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }

  $effect(() => () => clearTimeout(timer));
</script>

<button type="button" class={["mc-copy", `mc-copy--${variant}`]} {disabled} aria-label={copied ? "Copied" : label} onclick={copy}>
  <span class={["mc-copy__icon", classNames?.icon]} aria-hidden="true">
    {#if copied}
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
    {:else}
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="2" /><path d="M10.5 5.5v-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1" /></svg>
    {/if}
  </span>
  {#if !iconOnly}<span class={["mc-copy__label", classNames?.label]}>{copied ? "Copied" : label}</span>{/if}
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-copy { display: inline-flex; align-items: center; gap: 6px; min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
.mc-copy--outline { border-color: var(--border); background: var(--surface); }
@media (hover: hover) and (pointer: fine) { .mc-copy:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-copy:disabled { opacity: .5; cursor: not-allowed; }
.mc-copy__icon { display: grid; place-items: center; color: var(--text-secondary); }
.mc-copy[aria-label="Copied"] .mc-copy__icon { color: var(--success); }
@media (prefers-reduced-motion: reduce) { .mc-copy { transition: none; } }
}
</style>
