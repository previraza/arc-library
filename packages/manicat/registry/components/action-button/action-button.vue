<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { arrowRightIcon, createMorphText, createPhaseSlot, drawnCheckIcon, pressable } from "@/lib/motion-dom";
import type { MorphText, PhaseSlot } from "@/lib/motion-dom";

const props = withDefaults(
  defineProps<{
    label: string;
    successLabel?: string;
    pendingLabel?: string;
    /** Runs when pressed. A promise drives the pending and success states. */
    onAction: () => void | Promise<void>;
    resetAfterMs?: number;
    onActionError?: (error: unknown) => void;
    disabled?: boolean;
    /** Extend the inner, named parts of the action button: content, morph, glyphs, glyph, iconSlot, phase, spinner, statusIcon or arrow. */
    classNames?: { content?: string; morph?: string; glyphs?: string; glyph?: string; iconSlot?: string; phase?: string; spinner?: string; statusIcon?: string; arrow?: string };
  }>(),
  { successLabel: "Saved", pendingLabel: "Saving", resetAfterMs: 2400, disabled: false },
);

const state = ref<"idle" | "pending" | "success">("idle");
const text = computed(() => (state.value === "pending" ? props.pendingLabel : state.value === "success" ? props.successLabel : props.label));
const button = ref<HTMLButtonElement>();
const textHost = ref<HTMLElement>();
const iconSlot = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let timer: ReturnType<typeof setTimeout> | undefined;
let morph: MorphText | undefined;
let phase: PhaseSlot | undefined;
let release: (() => void) | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

function showPhase() {
  const parts = props.classNames;
  if (state.value === "pending") {
    phase?.show("pending", "icon", () => Object.assign(document.createElement("span"), { className: cn("mc-action-button__spinner", parts?.spinner) }));
  } else if (state.value === "success") {
    phase?.show("success", "icon", () => drawnCheckIcon(cn("mc-action-button__statusIcon", parts?.statusIcon), reduced));
  } else {
    phase?.show("idle", "arrow", () => arrowRightIcon(cn("mc-action-button__arrow", parts?.arrow)));
  }
}

onMounted(() => {
  const parts = props.classNames;
  morph = createMorphText(textHost.value!, {
    text: text.value,
    reduced,
    classes: { morph: cn("mc-action-button__morph", parts?.morph), glyphs: cn("mc-action-button__glyphs", parts?.glyphs), glyph: cn("mc-action-button__glyph", parts?.glyph) },
  });
  phase = createPhaseSlot(iconSlot.value!, { reduced, phaseClass: cn("mc-action-button__phase", parts?.phase) });
  showPhase();
  release = pressable(button.value!, { reduced, enabled: () => !props.disabled && state.value !== "pending" });
});

watch(text, (next) => morph?.set(next));
watch(state, showPhase);

onBeforeUnmount(() => {
  clearTimeout(timer);
  morph?.destroy();
  phase?.destroy();
  release?.();
});

async function run() {
  if (state.value === "pending") return;
  clearTimeout(timer);
  state.value = "pending";
  try {
    await props.onAction();
    state.value = "success";
    if (props.resetAfterMs > 0) timer = setTimeout(() => (state.value = "idle"), props.resetAfterMs);
  } catch (error) {
    state.value = "idle";
    props.onActionError?.(error);
  }
}
</script>

<template>
  <!-- Pending stays focusable (aria-disabled instead of disabled), so a keyboard user keeps focus through the whole save. -->
  <button
    ref="button"
    type="button"
    class="mc-action-button__button"
    :disabled="disabled"
    :aria-disabled="state === 'pending' || undefined"
    :aria-busy="state === 'pending'"
    :data-state="state"
    @click="run"
  >
    <span :class="['mc-action-button__content', classNames?.content]" aria-hidden="true">
      <span ref="textHost" style="display: contents" />
      <span ref="iconSlot" :class="['mc-action-button__iconSlot', classNames?.iconSlot]" />
    </span>
    <span class="mc-action-button__visuallyHidden">{{ label }}</span>
    <span class="mc-action-button__visuallyHidden" role="status">{{ state === "pending" ? pendingLabel : state === "success" ? successLabel : "" }}</span>
  </button>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The button hugs its label: text morphs in place and the width follows on a spring, so no state ever snaps the layout. */
.mc-action-button__button { position: relative; display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; overflow: hidden; padding: 0 var(--space-5); border: 1px solid var(--foreground); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-action-button__button:hover:not(:disabled) { box-shadow: var(--shadow-resting); } }
.mc-action-button__button:disabled { cursor: not-allowed; }
.mc-action-button__button:disabled:not([data-state="pending"]) { opacity: .7; }
.mc-action-button__button[data-state="pending"] { cursor: progress; }
.mc-action-button__content { display: inline-flex; min-height: 1.25rem; align-items: center; justify-content: center; gap: var(--space-2); white-space: nowrap; }
.mc-action-button__morph { display: inline-flex; min-width: 0; }
.mc-action-button__morph[data-morphing] { clip-path: inset(-.6em 0 -.6em -.3em); }
.mc-action-button__glyphs { position: relative; display: inline-flex; flex: none; white-space: pre; }
.mc-action-button__glyph { display: inline-block; }
.mc-action-button__iconSlot { display: grid; width: 17px; height: 17px; flex: 0 0 17px; place-items: center; }
.mc-action-button__phase { grid-area: 1 / 1; display: grid; width: 17px; height: 17px; place-items: center; }
.mc-action-button__arrow { flex: none; }
.mc-action-button__statusIcon { color: currentColor; }
.mc-action-button__spinner { display: inline-block; width: var(--space-4); height: var(--space-4); border: 1.5px solid currentColor; border-right-color: transparent; border-radius: var(--radius-pill); animation: mc-action-button-spin .7s linear infinite; }
.mc-action-button__visuallyHidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes mc-action-button-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-action-button__button { transition: none; } .mc-action-button__spinner { animation: none; } }
</style>
