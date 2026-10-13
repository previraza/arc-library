<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CircleAlert, Copy } from "lucide-vue-next";
import { createMorphText, drawPath, playPose } from "@/lib/motion-dom";
import type { MorphText } from "@/lib/motion-dom";
import { createCopyFeedback } from "@/lib/copy-feedback";
import type { CopyFeedbackState } from "@/lib/copy-feedback";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    value: string;
    label?: string;
    iconOnly?: boolean;
    variant?: "outline" | "plain";
    disabled?: boolean;
    /** Extend the inner, named parts of the copy button: icon, iconInner or label. */
    classNames?: { icon?: string; iconInner?: string; label?: string };
  }>(),
  { label: "Copy", iconOnly: false, variant: "outline" },
);

const emit = defineEmits<{ copied: [] }>();

const state = ref<CopyFeedbackState>("idle");
const feedback = createCopyFeedback((next) => (state.value = next));
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const glyphHost = ref<HTMLElement>();
let morph: MorphText | undefined;

const cn = (base: string, ...extra: (string | false | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const text = () => (state.value === "copied" ? "Copied" : state.value === "error" ? "Failed" : props.label);

async function copy() {
  if (await feedback.copy(props.value)) emit("copied");
}

onMounted(() => {
  if (glyphHost.value) morph = createMorphText(glyphHost.value, { text: text(), reduced, arm: () => undefined, classes: { morph: "", glyphs: "mc-copy-button__glyphs", glyph: "mc-copy-button__glyph" } });
});
watch([state, () => props.label], () => morph?.set(text()));
onBeforeUnmount(() => {
  feedback.destroy();
  morph?.destroy();
});

// Copy feedback is deliberately unhurried: a slow, almost critically damped spring and long, soft crossfades read as calm, never busy.
const settle = { type: "spring", visualDuration: 0.5, bounce: 0.06 } as const;
const soft = motionTokens.blur.soft;
const iconAway = { opacity: 0, scale: 0.6, blur: soft };
const iconRest = { opacity: 1, scale: 1, blur: 0 };
function enter(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: motionTokens.duration.instant }).finished.then(done);
  else playPose(el, iconAway, iconRest, { spring: settle, fade: 0.36, fadeDelay: 0.03 }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  playPose(el, iconRest, reduced ? { opacity: 0 } : iconAway, { duration: reduced ? motionTokens.duration.instant : 0.24, ease: "standard" }).finished.then(done);
}
function draw(el: Element | null) {
  if (el) drawPath(el, { reduced, duration: 0.5, ease: "standard" });
}
</script>

<template>
  <button
    type="button"
    :class="cn('mc-copy-button__button', iconOnly && 'mc-copy-button__iconOnly', variant === 'plain' && 'mc-copy-button__plain')"
    :aria-label="label"
    :data-copy-state="state"
    :disabled="disabled"
    @click="copy"
  >
    <span :class="cn('mc-copy-button__icon', classNames?.icon)" aria-hidden="true">
      <Transition :css="false" @enter="enter" @leave="leave">
        <span :key="state" :class="cn('mc-copy-button__iconInner', classNames?.iconInner)" :data-state="state">
          <svg v-if="state === 'copied'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path :ref="(el) => draw(el as Element | null)" d="M4 12l5 5L20 6" /></svg>
          <CircleAlert v-else-if="state === 'error'" :size="16" :stroke-width="1.75" />
          <Copy v-else :size="16" :stroke-width="1.75" />
        </span>
      </Transition>
    </span>
    <span v-if="!iconOnly" :class="cn('mc-copy-button__label', classNames?.label)" aria-hidden="true">
      <span class="mc-copy-button__measure">{{ label }}</span><span class="mc-copy-button__measure">Copied</span><span class="mc-copy-button__measure">Failed</span>
      <span ref="glyphHost" style="display: contents" />
    </span>
  </button>
  <span class="mc-copy-button__srOnly" role="status" aria-live="polite">{{ state === "idle" ? "" : state === "error" ? `${label}: Could not copy` : `${label}: Copied` }}</span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Width never changes: the label cell reserves its widest state while icon and letters crossfade inside it. Press releases on the spring curve. */
.mc-copy-button__button { display: inline-flex; width: max-content; max-width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: center; gap: var(--space-2); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-copy-button__button:active:not(:disabled) { transform: scale(.97); transition-duration: var(--duration-fast), var(--duration-fast), var(--duration-fast), var(--duration-instant); transition-timing-function: var(--ease-standard); }
.mc-copy-button__iconOnly:active:not(:disabled) { transform: scale(.96); }
@media (hover: hover) and (pointer: fine) { .mc-copy-button__button:hover:not(:disabled) { background: var(--surface-muted); border-color: var(--border-strong); } .mc-copy-button__plain:hover:not(:disabled) { border-color: transparent; background: var(--surface-muted); color: var(--foreground); } }
.mc-copy-button__button:disabled { cursor: not-allowed; opacity: .5; }
/* Each icon carries its own color, so the outgoing glyph never tints on its way out. */
.mc-copy-button__icon { position: relative; display: grid; width: 16px; height: 16px; flex: none; }
.mc-copy-button__iconInner { position: absolute; inset: 0; display: grid; place-items: center; }
.mc-copy-button__iconInner[data-state="copied"] { color: var(--success); }
.mc-copy-button__iconInner[data-state="error"] { color: var(--danger); }
/* The inline padding gives blurred edge letters room before the horizontal clip; the negative margin keeps the box the same size. */
.mc-copy-button__label { display: grid; min-width: 0; margin-inline: calc(var(--space-1) * -1); padding-inline: var(--space-1); overflow-x: clip; text-align: left; white-space: nowrap; }
.mc-copy-button__measure, .mc-copy-button__glyphs { grid-area: 1 / 1; }
.mc-copy-button__measure { visibility: hidden; }
.mc-copy-button__glyphs { position: relative; display: inline-flex; justify-self: start; white-space: pre; }
.mc-copy-button__glyph { display: inline-block; }
.mc-copy-button__iconOnly { width: var(--control-height-sm); padding: 0; }
.mc-copy-button__plain { border-color: transparent; background: transparent; color: var(--text-secondary); }
.mc-copy-button__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-copy-button__button { transition: none; } .mc-copy-button__button:active:not(:disabled) { transform: none; } }
</style>
