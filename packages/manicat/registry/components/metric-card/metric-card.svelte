<script lang="ts">
  interface Props {
    label: string;
    value: number;
    suffix?: string;
    /** One line of context under the number, such as the previous period. */
    context: string;
    /** Change since the previous period, such as "+15.2%". A leading minus reads as a decrease. */
    change?: string;
    /** Extend the inner, named parts of the metric card: label, value, change or context. */
    classNames?: { label?: string; value?: string; change?: string; context?: string };
  }

  let { label, value, suffix, context, change, classNames }: Props = $props();

  const down = $derived(/^[-−]/.test(change?.trim() ?? ""));
</script>

<div class="mc-metric" role="group" aria-label={`${label}: ${value.toLocaleString()}${suffix ?? ""}${change ? `, ${change}` : ""}. ${context}`}>
  <span class={["mc-metric__label", classNames?.label]}>{label}</span>
  <div class="mc-metric__row">
    <span class={["mc-metric__value", classNames?.value]}>{value.toLocaleString()}{#if suffix}<small>{suffix}</small>{/if}</span>
    {#if change}<span class={["mc-metric__change", down && "mc-metric__change--down", classNames?.change]}>{change}</span>{/if}
  </div>
  <span class={["mc-metric__context", classNames?.context]}>{context}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-metric { display: inline-grid; gap: var(--space-2); min-width: 200px; padding: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-metric__label { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-metric__row { display: flex; align-items: baseline; gap: var(--space-3); }
.mc-metric__value { font-size: 1.875rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-display); }
.mc-metric__value small { margin-left: 2px; color: var(--text-muted); font-size: var(--text-sm); font-weight: 400; }
.mc-metric__change { padding: 2px 8px; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--success) 10%, var(--surface)); color: var(--success); font-size: var(--text-xs); font-weight: 500; }
.mc-metric__change--down { background: color-mix(in oklab, var(--danger) 10%, var(--surface)); color: var(--danger); }
.mc-metric__context { color: var(--text-muted); font-size: var(--text-xs); }
}
</style>
