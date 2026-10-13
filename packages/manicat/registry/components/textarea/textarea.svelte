<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label: string;
    description?: string;
    error?: string;
    rows?: number;
    /** Extend the inner, named parts of the textarea: label, control, hint or error. */
    classNames?: { label?: string; control?: string; hint?: string; error?: string };
  }

  let { label, description, error, rows = 4, value = $bindable(""), classNames, ...rest }: Props = $props();
  const id = $props.id();
</script>

<div class="mc-field">
  <label for={id} class={["mc-field__label", classNames?.label]}>{label}</label>
  <textarea
    {...rest}
    {id}
    {rows}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={error || description ? `${id}-message` : undefined}
    class={["mc-textarea", classNames?.control]}
  ></textarea>
  {#if error}
    <span id={`${id}-message`} role="alert" class={["mc-field__message", "mc-field__message--error", classNames?.error]}>{error}</span>
  {:else if description}
    <span id={`${id}-message`} class={["mc-field__message", classNames?.hint]}>{description}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-field { display: grid; min-width: 0; }
.mc-field__label { margin-bottom: var(--space-2); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-textarea { width: 100%; min-height: 110px; resize: vertical; padding: var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-textarea::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-textarea:hover:not(:disabled, [aria-invalid="true"]) { border-color: var(--foreground); } }
.mc-textarea:focus-visible { border-color: var(--foreground); outline: none; }
.mc-textarea[aria-invalid="true"] { border-color: var(--danger); }
.mc-textarea:disabled { cursor: not-allowed; background: var(--surface-muted); opacity: .6; }
.mc-field__message { display: block; padding-top: var(--space-2); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-field__message--error { color: var(--danger); }
@media (prefers-reduced-motion: reduce) { .mc-textarea { transition: none; } }
}
</style>
