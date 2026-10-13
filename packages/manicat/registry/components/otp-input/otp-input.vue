<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { createFieldMessage } from "@/lib/field-message";
import type { FieldMessage } from "@/lib/field-message";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    length?: number;
    label: string;
    description?: string;
    error?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    inputMode?: "numeric" | "text";
    /** Extend the inner, named parts of the OTP input: input. */
    classNames?: { input?: string };
  }>(),
  { length: 6, autoFocus: false, disabled: false, inputMode: "numeric" },
);

/** `v-model` binds the code typed so far. */
const value = defineModel<string>({ default: "" });
const generatedId = useId();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, stagger, blur, ease } = motionTokens;
const row = ref<HTMLElement>();
const ringEl = ref<HTMLElement>();
const inputs = ref<HTMLInputElement[]>([]);
const hintHost = ref<HTMLElement>();
const errorHost = ref<HTMLElement>();
let hint: FieldMessage | undefined;
let problem: FieldMessage | undefined;

const values = computed(() => Array.from({ length: props.length }, (_, index) => value.value[index] ?? ""));
const hintId = computed(() => (props.description ? `${generatedId}-description` : undefined));
const errorId = computed(() => (props.error ? `${generatedId}-error` : undefined));
const describedBy = computed(() => [hintId.value, errorId.value].filter(Boolean).join(" ") || undefined);
const focusAt = (index: number) => inputs.value[Math.max(0, Math.min(index, props.length - 1))]?.focus();
const sanitize = (next: string) => (props.inputMode === "numeric" ? next.replace(/\D/g, "") : next);
const commit = (next: string[]) => (value.value = next.join(""));

// One ring for the whole row. It glides between slots while focus stays inside, and fades in where focus lands when it arrives from outside.
const ring = ref({ x: 0, width: 0, shown: false, glide: false });
// A paste fills several slots in one update; those digits land as a short left to right wave.
const wave = ref(false);
watch(value, (next, previous) => (wave.value = Array.from({ length: props.length }, (_, index) => (previous[index] ?? "") !== (next[index] ?? "")).filter(Boolean).length > 1), { flush: "sync" });

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The ring moves to the focused slot, and fades when focus leaves the row.
watch(ring, (next) => {
  const el = ringEl.value;
  if (!el) return;
  const target = { x: next.x, width: next.width, opacity: next.shown ? 1 : 0, scale: next.shown ? 1 : 0.94 };
  if (reduced) return void animate(el, target as never, { duration: 0 });
  animate(el, target as never, { x: next.glide ? motionTokens.spring.snappy : { duration: 0 }, width: { duration: 0 }, scale: motionTokens.spring.snappy, opacity: { duration: duration.fast } } as never);
}, { deep: true, flush: "post" });

let observer: ResizeObserver | undefined;
let lastError = props.error;
onMounted(() => {
  if (props.autoFocus) inputs.value[0]?.focus();
  const node = row.value!;
  // Slots shrink at narrow widths; keep the ring on the focused slot when the row resizes.
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      const slot = (node.contains(document.activeElement) ? document.activeElement?.parentElement : null) as HTMLElement | null;
      if (slot && !(ring.value.x === slot.offsetLeft && ring.value.width === slot.offsetWidth)) ring.value = { ...ring.value, x: slot.offsetLeft, width: slot.offsetWidth, glide: false };
    });
    observer.observe(node);
  }
  const classes = (copy: string) => ({ messageSlot: "mc-otp-input__messageSlot", copy, srOnly: "mc-otp-input__srOnly", words: "mc-otp-input__words", word: "mc-otp-input__word", column: "mc-otp-input__column" });
  hint = createFieldMessage(hintHost.value!, { id: hintId.value, classes: classes("mc-otp-input__description"), reduced });
  problem = createFieldMessage(errorHost.value!, { id: errorId.value, classes: classes("mc-otp-input__error"), alert: true, reduced });
  hint.set(props.description);
  problem.set(props.error);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  hint?.destroy();
  problem?.destroy();
});
watch(() => props.description, (text) => hint?.set(text));
// A new error nudges the row side to side once, so a rejected code reads as a response to the attempt.
watch(() => props.error, (text) => {
  problem?.set(text);
  if (text && text !== lastError && !reduced && row.value) animate(row.value, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.36, ease: [...ease.standard] });
  lastError = text;
});

const updateAt = (index: number, raw: string) => {
  const next = values.value.slice();
  const clean = sanitize(raw).slice(-1);
  next[index] = clean;
  commit(next);
  if (clean && index < props.length - 1) focusAt(index + 1);
};
function onInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const raw = sanitize(input.value);
  if (raw.length <= 1) {
    updateAt(index, raw);
    input.value = values.value[index];
    return;
  }
  const next = values.value.slice();
  raw.slice(0, props.length - index).split("").forEach((character, offset) => { next[index + offset] = character; });
  commit(next);
  focusAt(Math.min(index + raw.length, props.length - 1));
}
function onPaste(index: number, event: ClipboardEvent) {
  event.preventDefault();
  const pasted = sanitize(event.clipboardData?.getData("text") ?? "").slice(0, props.length - index);
  if (!pasted) return;
  const next = values.value.slice();
  pasted.split("").forEach((character, offset) => { next[index + offset] = character; });
  commit(next);
  focusAt(Math.min(index + pasted.length, props.length - 1));
}
function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === "ArrowLeft") { event.preventDefault(); focusAt(index - 1); }
  if (event.key === "ArrowRight") { event.preventDefault(); focusAt(index + 1); }
  if (event.key === "Backspace" && !values.value[index] && index > 0) {
    event.preventDefault();
    const next = values.value.slice();
    next[index - 1] = "";
    commit(next);
    focusAt(index - 1);
  }
  if (event.key === "Delete" && values.value[index]) {
    const next = values.value.slice();
    next[index] = "";
    commit(next);
  }
}
function onFocus(event: FocusEvent) {
  const slot = (event.currentTarget as HTMLElement).parentElement as HTMLElement;
  ring.value = { x: slot.offsetLeft, width: slot.offsetWidth, shown: true, glide: ring.value.shown };
}
function onBlur(event: FocusEvent) {
  if (!row.value?.contains(event.relatedTarget as Node | null)) ring.value = { ...ring.value, shown: false, glide: false };
}

// The input text is transparent; this copy of the digit rises into the slot and unblurs.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterGlyph(el: Element, done: () => void) {
  const index = Number((el as HTMLElement).dataset.index ?? 0);
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter", delay: wave.value ? index * stagger.item : 0 }).finished.then(done);
}
function leaveGlyph(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.9, blur: blur.subtle }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div class="mc-otp-input__field">
    <span class="mc-otp-input__label">{{ label }}</span>
    <div ref="row" class="mc-otp-input__inputs" role="group" :aria-label="label" :data-invalid="error ? 'true' : undefined">
      <div v-for="(character, index) in values" :key="`${generatedId}-${index}`" class="mc-otp-input__slot">
        <input
          :ref="(el) => { if (el) inputs[index] = el as HTMLInputElement; }"
          :class="cn('mc-otp-input__input', classNames?.input)"
          :aria-label="`${label}, digit ${index + 1} of ${length}`"
          :aria-describedby="describedBy"
          :aria-invalid="error ? true : undefined"
          :value="character"
          :data-filled="character ? 'true' : undefined"
          maxlength="1"
          :inputmode="inputMode"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'"
          :disabled="disabled"
          @input="onInput(index, $event)"
          @paste="onPaste(index, $event)"
          @keydown="onKeydown(index, $event)"
          @focus="onFocus"
          @blur="onBlur"
        />
        <Transition :css="false" @enter="enterGlyph" @leave="leaveGlyph"><span v-if="character" :key="character" class="mc-otp-input__glyph" aria-hidden="true" :data-index="index">{{ character }}</span></Transition>
      </div>
      <span ref="ringEl" class="mc-otp-input__ring" aria-hidden="true" style="opacity: 0" />
    </div>
    <span ref="hintHost" style="display: contents" />
    <span ref="errorHost" style="display: contents" />
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
.mc-otp-input__field { display: grid; min-width: 0; }
.mc-otp-input__label { margin-bottom: 8px; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-otp-input__inputs { position: relative; display: flex; width: fit-content; max-width: 100%; gap: 8px; }
.mc-otp-input__slot { position: relative; display: grid; width: 42px; height: 48px; min-width: 0; flex: 0 1 42px; }
/* The native text is transparent (caret stays visible); .mc-otp-input__glyph draws the digit so it can rise in. */
.mc-otp-input__input { width: 100%; height: 100%; min-width: 0; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: transparent; caret-color: var(--accent); font: inherit; font-size: var(--text-lg); font-variant-numeric: tabular-nums; text-align: center; outline: none; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-otp-input__input:hover:not(:disabled, [data-filled="true"], [aria-invalid="true"]) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-otp-input__input[data-filled="true"] { border-color: var(--accent); background: var(--accent-subtle); }
.mc-otp-input__input:focus-visible { outline: none; }
.mc-otp-input__input[aria-invalid="true"] { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 7%, var(--surface)); }
.mc-otp-input__input:disabled { cursor: not-allowed; opacity: .48; background: var(--surface-muted); }
.mc-otp-input__glyph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--foreground); font-size: var(--text-lg); font-variant-numeric: tabular-nums; pointer-events: none; }
.mc-otp-input__input:disabled ~ .mc-otp-input__glyph { opacity: .48; }
/* One ring per field. It glides to the focused slot and morphs to the danger color with the error state. */
.mc-otp-input__ring { position: absolute; top: 0; left: 0; height: 100%; z-index: 2; border: 1px solid var(--accent-strong); border-radius: var(--radius-control); pointer-events: none; transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-otp-input__inputs[data-invalid="true"] .mc-otp-input__ring { border-color: var(--danger); }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-otp-input__messageSlot { display: block; overflow: hidden; }
.mc-otp-input__description, .mc-otp-input__error { display: block; padding-top: 8px; font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-otp-input__description { color: var(--text-muted); }.mc-otp-input__error { color: var(--danger); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-otp-input__words { position: relative; display: block; }
.mc-otp-input__word { display: inline-block; white-space: pre; }
.mc-otp-input__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 360px) { .mc-otp-input__inputs { gap: 6px; }.mc-otp-input__slot { height: 44px; } }
@media (forced-colors: active) { .mc-otp-input__ring { display: none; } .mc-otp-input__input:focus-visible { outline: 2px solid CanvasText; outline-offset: 2px; } .mc-otp-input__input { color: CanvasText; } .mc-otp-input__glyph { display: none; } }
@media (prefers-reduced-motion: reduce) { .mc-otp-input__input, .mc-otp-input__ring { transition: none; } }
</style>
