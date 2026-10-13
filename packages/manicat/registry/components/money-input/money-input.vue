<script setup lang="ts">
import { computed, ref, useId } from "vue";

export interface MoneyInputDetails {
  currency: string;
  major: number | null;
  formatted: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    currencies?: string[];
    min?: number;
    max?: number;
    locale?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
    /** Extend the inner, named parts of the money input: shell, input, currency or hint. */
    classNames?: { shell?: string; input?: string; currency?: string; hint?: string };
  }>(),
  { currencies: () => ["USD", "EUR", "GBP"], locale: "en-US", disabled: false },
);

const emit = defineEmits<{ change: [details: MoneyInputDetails] }>();
/** `v-model` binds the amount in major units (12.5 is twelve dollars fifty), or null when empty. */
const model = defineModel<number | null>({ default: null });
/** `v-model:currency` binds the ISO currency code. */
const currency = defineModel<string>("currency", { default: "USD" });
const id = useId();
const draft = ref<string | null>(null);

const symbol = computed(() => new Intl.NumberFormat(props.locale, { style: "currency", currency: currency.value, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency.value);
const format = (n: number) => new Intl.NumberFormat(props.locale, { style: "currency", currency: currency.value }).format(n);

function onInput(event: Event) {
  draft.value = (event.target as HTMLInputElement).value;
  const parsed = draft.value.trim() === "" ? null : Number(draft.value.replace(/[^0-9.]/g, ""));
  if (parsed !== null && !Number.isFinite(parsed)) return;
  model.value = parsed === null ? null : Math.min(props.max ?? Infinity, Math.max(props.min ?? 0, parsed));
  emit("change", { currency: currency.value, major: model.value, formatted: model.value === null ? "" : format(model.value) });
}

function cycle() {
  currency.value = props.currencies[(props.currencies.indexOf(currency.value) + 1) % props.currencies.length];
}
</script>

<template>
  <div class="mc-money" :data-disabled="disabled || undefined">
    <label :for="id" class="mc-money__label">{{ label }}</label>
    <div :class="['mc-money__shell', classNames?.shell]" :data-invalid="error ? '' : undefined">
      <span class="mc-money__symbol">{{ symbol }}</span>
      <input :id="id" :value="draft ?? (model === null ? '' : String(model))" inputmode="decimal" placeholder="0.00" :disabled="disabled" :aria-invalid="error ? true : undefined" :class="['mc-money__input', classNames?.input]" @input="onInput" @blur="draft = null" />
      <button type="button" :class="['mc-money__currency', classNames?.currency]" :aria-label="`Currency, ${currency}`" :disabled="disabled || currencies.length < 2" @click="cycle">{{ currency }}</button>
    </div>
    <span v-if="error" role="alert" :class="['mc-money__hint', 'mc-money__hint--error', classNames?.hint]">{{ error }}</span>
    <span v-else-if="description" :class="['mc-money__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
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
</style>
