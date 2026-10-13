<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLInputAttributes, "class"> {
    label: string;
    description?: string;
    error?: string;
    /** Extend the inner, named parts of the input: label, input, description or error. */
    classNames?: { label?: string; input?: string; description?: string; error?: string };
  }

  let { label, description, error, value = $bindable(""), classNames, ...rest }: Props = $props();
  const id = $props.id();
</script>

<div class="mc-field">
  <label for={id} class={["mc-field__label", classNames?.label]}>{label}</label>
  <input
    {...rest}
    {id}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={error || description ? `${id}-message` : undefined}
    class={["mc-input", classNames?.input]}
  />
  {#if error}
    <span id={`${id}-message`} role="alert" class={["mc-field__message", "mc-field__message--error", classNames?.error]}>{error}</span>
  {:else if description}
    <span id={`${id}-message`} class={["mc-field__message", classNames?.description]}>{description}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-field { display: grid; min-width: 0; }
.mc-field__label { margin-bottom: var(--space-2); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-input { width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-input::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-input:hover:not(:disabled, [aria-invalid="true"]) { border-color: var(--foreground); } }
.mc-input:focus-visible { border-color: var(--foreground); outline: none; }
.mc-input[aria-invalid="true"] { border-color: var(--danger); }
.mc-input:disabled { cursor: not-allowed; opacity: .5; background: var(--surface-muted); }
.mc-field__message { display: block; padding-top: var(--space-2); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-field__message--error { color: var(--danger); }
@media (prefers-reduced-motion: reduce) { .mc-input { transition-duration: .01ms; } }
}
</style>
