<script setup lang="ts">
import { ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    length?: number;
    label: string;
    description?: string;
    error?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    inputMode?: "numeric" | "text";
    /** Extend the inner, named parts of the OTP input: row, cell or hint. */
    classNames?: { row?: string; cell?: string; hint?: string };
  }>(),
  { length: 6, autoFocus: false, disabled: false, inputMode: "numeric" },
);

/** `v-model` binds the code. One hidden input holds it, so paste and SMS autofill work; the cells only draw it. */
const model = defineModel<string>({ default: "" });
const id = useId();
const input = ref<HTMLInputElement>();
const focused = ref(false);

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  model.value = (props.inputMode === "numeric" ? raw.replace(/\D/g, "") : raw).slice(0, props.length);
  (event.target as HTMLInputElement).value = model.value;
}
</script>

<template>
  <div class="mc-otp">
    <label :for="id" class="mc-otp__label">{{ label }}</label>
    <div :class="['mc-otp__row', classNames?.row]" @click="input?.focus()">
      <span
        v-for="index in length"
        :key="index"
        :class="['mc-otp__cell', classNames?.cell]"
        :data-active="(focused && index - 1 === Math.min(model.length, length - 1)) || undefined"
        :data-invalid="error ? '' : undefined"
        aria-hidden="true"
      >{{ model[index - 1] ?? "" }}</span>
      <input
        :id="id"
        ref="input"
        class="mc-otp__input"
        :value="model"
        :maxlength="length"
        :disabled="disabled"
        :autofocus="autoFocus"
        :inputmode="inputMode"
        autocomplete="one-time-code"
        :aria-invalid="error ? true : undefined"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>
    <span v-if="error" role="alert" :class="['mc-otp__hint', 'mc-otp__hint--error', classNames?.hint]">{{ error }}</span>
    <span v-else-if="description" :class="['mc-otp__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
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
</style>
