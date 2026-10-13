<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { createEyeMorph } from "@/lib/motion-dom";
import { createFieldMessage } from "@/lib/field-message";
import type { FieldMessage } from "@/lib/field-message";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  description?: string;
  /** Extend the inner, named parts of the password field: input. */
  classNames?: { input?: string };
}>();

const model = defineModel<string>();
const attrs = useAttrs();
const generated = useId();
const controlId = () => (attrs.id as string | undefined) ?? generated;
const visible = ref(false);
const toggled = ref(false);
const eyeHost = ref<HTMLElement>();
const hintHost = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let eye: ReturnType<typeof createEyeMorph> | undefined;
let hint: FieldMessage | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

onMounted(() => {
  eye = createEyeMorph(eyeHost.value!, { slashed: visible.value, reduced });
  hint = createFieldMessage(hintHost.value!, {
    id: props.description ? `${controlId()}-description` : undefined,
    classes: { messageSlot: "mc-password-field__messageSlot", copy: "mc-password-field__hint", srOnly: "mc-password-field__srOnly", words: "mc-password-field__words", word: "mc-password-field__word", column: "mc-password-field__column" },
    reduced,
  });
  hint.set(props.description);
});
watch(visible, (value) => eye?.set(value));
watch(() => props.description, (text) => hint?.set(text));
onBeforeUnmount(() => hint?.destroy());

function toggle() {
  visible.value = !visible.value;
  toggled.value = true;
}
</script>

<template>
  <div class="mc-password-field__field">
    <label :for="controlId()">{{ label }}</label>
    <div class="mc-password-field__shell">
      <!-- data-reveal only appears after the first toggle, so the value resolves on each change but never on mount. -->
      <input
        v-bind="{ ...attrs, class: undefined }"
        :id="controlId()"
        :type="visible ? 'text' : 'password'"
        :value="model"
        :data-reveal="toggled ? (visible ? 'shown' : 'hidden') : undefined"
        :aria-describedby="[attrs['aria-describedby'], description ? `${controlId()}-description` : undefined].filter(Boolean).join(' ') || undefined"
        :class="cn('mc-password-field__input', attrs.class as string | undefined, classNames?.input)"
        @input="model = ($event.target as HTMLInputElement).value"
      />
      <button type="button" :aria-label="visible ? 'Hide password' : 'Show password'" :aria-pressed="visible" @click="toggle"><span ref="eyeHost" style="display: contents" /></button>
    </div>
    <span ref="hintHost" style="display: contents" />
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
.mc-password-field__field { display: grid; min-width: 0; }
.mc-password-field__field label { margin-bottom: var(--space-2); font-size: var(--text-sm); font-weight: 500; }
/* Focus shows as a darker border only; the shell never changes size. The toggle sits with an even inset on top, bottom and right. */
.mc-password-field__shell { display: flex; min-height: var(--control-height-md); align-items: center; border: 1px solid var(--border-strong); border-radius: var(--radius-control); padding: 0 calc((var(--control-height-md) - 2px - 30px) / 2) 0 var(--space-3); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-password-field__shell:hover:not(:focus-within) { border-color: var(--foreground); } }
.mc-password-field__shell:focus-within { border-color: var(--foreground); }
.mc-password-field__shell:has(.mc-password-field__input[aria-invalid="true"]) { border-color: var(--danger); }
.mc-password-field__input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); outline: 0; }
.mc-password-field__input::placeholder { color: var(--text-muted); }
/* Switching between dots and characters resolves in place instead of snapping. Swapping the keyframe name restarts it. */
.mc-password-field__input[data-reveal="shown"] { animation: mc-password-field-resolve-shown var(--duration-standard) var(--ease-enter); }
.mc-password-field__input[data-reveal="hidden"] { animation: mc-password-field-resolve-hidden var(--duration-standard) var(--ease-enter); }
@keyframes mc-password-field-resolve-shown { from { opacity: .35; filter: blur(2px); } }
@keyframes mc-password-field-resolve-hidden { from { opacity: .35; filter: blur(2px); } }
.mc-password-field__shell button { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-password-field__shell button:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-password-field__shell button:active { transform: scale(.96); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform 100ms var(--ease-standard); }
.mc-password-field__shell button[aria-pressed="true"] { color: var(--foreground); }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-password-field__messageSlot { display: block; overflow: hidden; }
.mc-password-field__hint { display: block; padding-top: var(--space-2); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-password-field__words { position: relative; display: block; }
.mc-password-field__word { display: inline-block; white-space: pre; }
.mc-password-field__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-password-field__shell, .mc-password-field__shell button { transition: none; } .mc-password-field__shell button:active { transform: none; } .mc-password-field__input[data-reveal] { animation: none; } }
</style>
