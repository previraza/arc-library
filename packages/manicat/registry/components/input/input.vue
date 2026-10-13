<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { createFieldMessage } from "@/lib/field-message";
import type { FieldMessage } from "@/lib/field-message";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  description?: string;
  error?: string;
  /** Extend the inner, named parts of the input: label or input. */
  classNames?: { label?: string; input?: string };
}>();

const model = defineModel<string | number>();
const attrs = useAttrs();
const generated = useId();
const controlId = () => (attrs.id as string | undefined) ?? generated;
const hintHost = ref<HTMLElement>();
const errorHost = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let hint: FieldMessage | undefined;
let problem: FieldMessage | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const classes = (copy: string) => ({
  messageSlot: "mc-input__messageSlot",
  copy,
  srOnly: "mc-input__srOnly",
  words: "mc-input__words",
  word: "mc-input__word",
  column: "mc-input__column",
});

onMounted(() => {
  hint = createFieldMessage(hintHost.value!, { id: props.description ? `${controlId()}-description` : undefined, classes: classes("mc-input__description"), reduced });
  problem = createFieldMessage(errorHost.value!, { id: props.error ? `${controlId()}-error` : undefined, classes: classes("mc-input__error"), alert: true, reduced });
  hint.set(props.description);
  problem.set(props.error);
});
watch(() => props.description, (text) => hint?.set(text));
watch(() => props.error, (text) => problem?.set(text));
onBeforeUnmount(() => {
  hint?.destroy();
  problem?.destroy();
});
</script>

<template>
  <div class="mc-input__field">
    <label :class="cn('mc-input__label', classNames?.label)" :for="controlId()">{{ label }}</label>
    <input
      v-bind="{ ...attrs, class: undefined }"
      :id="controlId()"
      :value="model"
      :class="cn('mc-input__input', attrs.class as string | undefined, classNames?.input)"
      :aria-invalid="error ? true : (attrs['aria-invalid'] as boolean | undefined)"
      :aria-describedby="[attrs['aria-describedby'], description ? `${controlId()}-description` : undefined, error ? `${controlId()}-error` : undefined].filter(Boolean).join(' ') || undefined"
      @input="model = ($event.target as HTMLInputElement).value"
    />
    <span ref="hintHost" style="display: contents" />
    <span ref="errorHost" style="display: contents" />
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
.mc-input__field { display: grid; min-width: 0; }
.mc-input__label { margin-bottom: var(--space-2); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
/* Focus answers with the border colour alone (no rings or halos); the field itself never changes size. */
.mc-input__input { width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); outline: none; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-input__input::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-input__input:hover:not(:disabled, [aria-invalid="true"]) { border-color: var(--foreground); } }
.mc-input__input:focus-visible { border-color: var(--foreground); }
.mc-input__input[aria-invalid="true"] { border-color: var(--danger); }
.mc-input__input:disabled { cursor: not-allowed; opacity: .5; background: var(--surface-muted); }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-input__messageSlot { display: block; overflow: hidden; }
.mc-input__description, .mc-input__error { display: block; padding-top: var(--space-2); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-input__description { color: var(--text-muted); } .mc-input__error { color: var(--danger); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-input__words { position: relative; display: block; }
.mc-input__word { display: inline-block; white-space: pre; }
/* One column per character of a count. Tabular digits keep columns equal, so only a gained or lost digit changes the width. */
.mc-input__column { position: relative; display: inline-flex; justify-content: center; font-variant-numeric: tabular-nums; }
.mc-input__column > span { display: inline-block; }
.mc-input__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-input__input { transition-duration: .01ms; } }
</style>
