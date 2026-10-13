<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLInputAttributes, "class" | "type"> {
    label: string;
    description?: string;
    /** Extend the inner, named parts of the password field: shell, input, toggle or hint. */
    classNames?: { shell?: string; input?: string; toggle?: string; hint?: string };
  }

  let { label, description, value = $bindable(""), classNames, ...rest }: Props = $props();
  let shown = $state(false);
  const id = $props.id();
</script>

<div class="mc-password">
  <label for={id}>{label}</label>
  <div class={["mc-password__shell", classNames?.shell]}>
    <input {...rest} {id} bind:value type={shown ? "text" : "password"} autocapitalize="none" spellcheck="false" class={["mc-password__input", classNames?.input]} />
    <button type="button" class={["mc-password__toggle", classNames?.toggle]} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onclick={() => (shown = !shown)}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
        {#if !shown}<path d="M2 2l20 20" />{/if}
      </svg>
    </button>
  </div>
  {#if description}<span class={["mc-password__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-password { display: grid; gap: var(--space-2); min-width: 0; }
.mc-password label { font-size: var(--text-sm); font-weight: 500; }
.mc-password__shell { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-password__shell:hover { border-color: var(--foreground); } }
.mc-password__shell:focus-within { border-color: var(--foreground); }
.mc-password__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-password__input::placeholder { color: var(--text-muted); }
.mc-password__toggle { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-password__toggle:hover { color: var(--foreground); background: var(--surface-muted); } }
.mc-password__hint { color: var(--text-muted); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-password__shell { transition: none; } }
}
</style>
