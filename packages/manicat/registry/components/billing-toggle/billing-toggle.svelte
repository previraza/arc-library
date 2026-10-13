<script lang="ts" module>
  export interface BillingToggleOption {
    value: string;
    label: string;
    badge?: string;
  }
</script>

<script lang="ts">
  interface Props {
    options?: BillingToggleOption[];
    label?: string;
    /** The selected period. Bind it with `bind:value`. Pair it with a price you compute from the value. */
    value?: string;
    /** Extend the inner, named parts of the toggle: track, button or badge. */
    classNames?: { track?: string; button?: string; badge?: string };
  }

  let {
    options = [
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly", badge: "Save 20%" },
    ],
    label = "Billing period",
    value = $bindable(),
    classNames,
  }: Props = $props();
  const id = $props.id();

  function onKeydown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    value = options[next].value;
    document.getElementById(`${id}-${next}`)?.focus();
  }
</script>

<div class={["mc-billing", classNames?.track]} role="radiogroup" aria-label={label}>
  {#each options as option, index (option.value)}
    <button
      id="{id}-{index}"
      type="button"
      role="radio"
      class={["mc-billing__button", classNames?.button]}
      aria-checked={value === option.value}
      tabindex={value === option.value || (value === undefined && index === 0) ? 0 : -1}
      data-state={value === option.value ? "checked" : "unchecked"}
      onclick={() => (value = option.value)}
      onkeydown={(event) => onKeydown(event, index)}
    >
      {option.label}
      {#if option.badge}<span class={["mc-billing__badge", classNames?.badge]}>{option.badge}</span>{/if}
    </button>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-billing { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-billing__button { display: inline-flex; align-items: center; gap: 6px; min-height: var(--control-height-sm); padding: 0 var(--space-4); border: 1px solid transparent; border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-billing__button:hover { color: var(--foreground); } }
.mc-billing__button[data-state="checked"] { border-color: var(--border); background: var(--surface); color: var(--accent-strong); box-shadow: var(--shadow-resting); }
.mc-billing__badge { color: var(--success); font-size: 11px; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .mc-billing__button { transition: none; } }
}
</style>
