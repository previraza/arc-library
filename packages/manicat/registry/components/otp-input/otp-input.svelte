<script lang="ts">
  interface Props {
    length?: number;
    label: string;
    description?: string;
    error?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    inputMode?: "numeric" | "text";
    /** The code. Bind it with `bind:value`. One hidden input holds it, so paste and SMS autofill work; the cells only draw it. */
    value?: string;
    /** Extend the inner, named parts of the OTP input: row, cell or hint. */
    classNames?: { row?: string; cell?: string; hint?: string };
  }

  let { length = 6, label, description, error, autoFocus = false, disabled = false, inputMode = "numeric", value = $bindable(""), classNames }: Props = $props();

  const id = $props.id();
  let input = $state<HTMLInputElement>();
  let focused = $state(false);

  function onInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    value = (inputMode === "numeric" ? raw.replace(/\D/g, "") : raw).slice(0, length);
    (event.target as HTMLInputElement).value = value;
  }
</script>

<div class="mc-otp">
  <label for={id} class="mc-otp__label">{label}</label>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class={["mc-otp__row", classNames?.row]} onclick={() => input?.focus()}>
    {#each { length } as _, index (index)}
      <span class={["mc-otp__cell", classNames?.cell]} data-active={(focused && index === Math.min(value.length, length - 1)) || undefined} data-invalid={error ? "" : undefined} aria-hidden="true">{value[index] ?? ""}</span>
    {/each}
    <!-- svelte-ignore a11y_autofocus -->
    <input
      {id}
      bind:this={input}
      class="mc-otp__input"
      {value}
      maxlength={length}
      {disabled}
      autofocus={autoFocus}
      inputmode={inputMode}
      autocomplete="one-time-code"
      aria-invalid={error ? true : undefined}
      oninput={onInput}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
    />
  </div>
  {#if error}
    <span role="alert" class={["mc-otp__hint", "mc-otp__hint--error", classNames?.hint]}>{error}</span>
  {:else if description}
    <span class={["mc-otp__hint", classNames?.hint]}>{description}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-otp { display: grid; gap: var(--space-2); justify-items: start; }
.mc-otp__label { font-size: var(--text-sm); font-weight: 500; }
.mc-otp__row { position: relative; display: flex; gap: 8px; }
.mc-otp__cell { display: grid; place-items: center; width: 44px; height: 52px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); font-size: var(--text-xl); font-weight: 500; font-variant-numeric: tabular-nums; transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-otp__cell[data-active] { border-color: var(--foreground); }
.mc-otp__cell[data-invalid] { border-color: var(--danger); }
.mc-otp__input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: text; }
.mc-otp__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-otp__hint--error { color: var(--danger); }
@media (prefers-reduced-motion: reduce) { .mc-otp__cell { transition: none; } }
}
</style>
