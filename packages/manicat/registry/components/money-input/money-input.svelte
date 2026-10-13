<script lang="ts" module>
  export interface MoneyInputDetails {
    currency: string;
    major: number | null;
    formatted: string;
  }
</script>

<script lang="ts">
  interface Props {
    label: string;
    currencies?: string[];
    min?: number;
    max?: number;
    locale?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
    /** The amount in major units (12.5 is twelve dollars fifty), or null when empty. Bind it with `bind:value`. */
    value?: number | null;
    /** The ISO currency code. Bind it with `bind:currency`. */
    currency?: string;
    onchange?: (details: MoneyInputDetails) => void;
    /** Extend the inner, named parts of the money input: shell, input, currency or hint. */
    classNames?: { shell?: string; input?: string; currency?: string; hint?: string };
  }

  let {
    label,
    currencies = ["USD", "EUR", "GBP"],
    min,
    max,
    locale = "en-US",
    description,
    error,
    disabled = false,
    value = $bindable(null),
    currency = $bindable("USD"),
    onchange,
    classNames,
  }: Props = $props();

  const id = $props.id();
  let draft = $state<string | null>(null);

  const symbol = $derived(new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency);
  const format = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);

  function onInput(event: Event) {
    draft = (event.target as HTMLInputElement).value;
    const parsed = draft.trim() === "" ? null : Number(draft.replace(/[^0-9.]/g, ""));
    if (parsed !== null && !Number.isFinite(parsed)) return;
    value = parsed === null ? null : Math.min(max ?? Infinity, Math.max(min ?? 0, parsed));
    onchange?.({ currency, major: value, formatted: value === null ? "" : format(value) });
  }

  function cycle() {
    currency = currencies[(currencies.indexOf(currency) + 1) % currencies.length];
  }
</script>

<div class="mc-money" data-disabled={disabled || undefined}>
  <label for={id} class="mc-money__label">{label}</label>
  <div class={["mc-money__shell", classNames?.shell]} data-invalid={error ? "" : undefined}>
    <span class="mc-money__symbol">{symbol}</span>
    <input {id} value={draft ?? (value === null ? "" : String(value))} inputmode="decimal" placeholder="0.00" {disabled} aria-invalid={error ? true : undefined} class={["mc-money__input", classNames?.input]} oninput={onInput} onblur={() => (draft = null)} />
    <button type="button" class={["mc-money__currency", classNames?.currency]} aria-label="Currency, {currency}" disabled={disabled || currencies.length < 2} onclick={cycle}>{currency}</button>
  </div>
  {#if error}
    <span role="alert" class={["mc-money__hint", "mc-money__hint--error", classNames?.hint]}>{error}</span>
  {:else if description}
    <span class={["mc-money__hint", classNames?.hint]}>{description}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-money { display: grid; gap: var(--space-2); min-width: 0; }
.mc-money[data-disabled] { opacity: .5; }
.mc-money__label { font-size: var(--text-sm); font-weight: 500; }
.mc-money__shell { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 6px 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-money__shell:focus-within { border-color: var(--foreground); }
.mc-money__shell[data-invalid] { border-color: var(--danger); }
.mc-money__symbol { color: var(--text-muted); font-size: var(--text-sm); }
.mc-money__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
.mc-money__currency { padding: 6px 10px; border: 0; border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--text-secondary); font: inherit; font-size: var(--text-xs); font-weight: 600; cursor: pointer; }
.mc-money__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-money__hint--error { color: var(--danger); }
@media (prefers-reduced-motion: reduce) { .mc-money__shell { transition: none; } }
}
</style>
