<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    confirmedLabel?: string;
    /** Milliseconds the press must last. */
    duration?: number;
    tone?: "accent" | "danger" | "neutral";
    confirmed?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the button: fill or label. */
    classNames?: { fill?: string; label?: string };
  }>(),
  { confirmedLabel: "Done", duration: 1200, tone: "accent", disabled: false },
);

const emit = defineEmits<{ confirm: []; holdChange: [holding: boolean] }>();
const progress = ref(0);
const done = ref(false);
const finished = computed(() => props.confirmed ?? done.value);
let frame = 0;
let started = 0;
let holding = false;

function tick(now: number) {
  progress.value = Math.min(1, (now - started) / props.duration);
  if (progress.value >= 1) {
    holding = false;
    done.value = true;
    emit("holdChange", false);
    emit("confirm");
  } else frame = requestAnimationFrame(tick);
}

function start() {
  if (props.disabled || finished.value || holding) return;
  holding = true;
  emit("holdChange", true);
  started = performance.now() - progress.value * props.duration;
  frame = requestAnimationFrame(tick);
}

function cancel() {
  if (!holding) return;
  holding = false;
  cancelAnimationFrame(frame);
  emit("holdChange", false);
  progress.value = 0;
}

// Holding Space or Enter works like a press, so the control is not pointer-only.
function onKeydown(event: KeyboardEvent) {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
    event.preventDefault();
    start();
  }
}

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <button
    type="button"
    :class="['mc-hold', `mc-hold--${tone}`]"
    :disabled="disabled"
    :data-done="finished || undefined"
    :aria-label="finished ? confirmedLabel : `${label}, press and hold`"
    @pointerdown="start"
    @pointerup="cancel"
    @pointerleave="cancel"
    @pointercancel="cancel"
    @keydown="onKeydown"
    @keyup="cancel"
    @blur="cancel"
  >
    <span :class="['mc-hold__fill', classNames?.fill]" :style="{ transform: `scaleX(${finished ? 1 : progress})` }" aria-hidden="true" />
    <span :class="['mc-hold__label', classNames?.label]">{{ finished ? confirmedLabel : label }}</span>
  </button>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-hold { --mc-tone: var(--accent); position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: var(--control-height-md); padding: 0 var(--space-4); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; user-select: none; touch-action: none; -webkit-tap-highlight-color: transparent; }
.mc-hold--danger { --mc-tone: var(--danger); } .mc-hold--neutral { --mc-tone: var(--text-secondary); }
.mc-hold__fill { position: absolute; inset: 0; background: color-mix(in oklab, var(--mc-tone) 15%, transparent); transform: scaleX(0); transform-origin: left; }
.mc-hold__label { position: relative; }
.mc-hold[data-done] { border-color: var(--mc-tone); color: var(--mc-tone); cursor: default; }
.mc-hold:disabled { opacity: .52; cursor: not-allowed; }
</style>
