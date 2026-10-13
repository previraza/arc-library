<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";

export type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";

const props = withDefaults(
  defineProps<{
    label: string;
    prompt?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    pendingLabel?: string;
    doneLabel?: string;
    errorLabel?: string;
    retryLabel?: string;
    undoLabel?: string;
    tone?: "danger" | "neutral";
    onConfirm?: () => void | Promise<unknown>;
    onUndo?: () => void | Promise<unknown>;
    /** Milliseconds the confirmation waits before backing out on its own. */
    confirmTimeout?: number;
    /** Milliseconds the result shows before returning to idle. */
    resultTimeout?: number;
    disabled?: boolean;
    /** Extend the inner, named parts of the button: label or action. */
    classNames?: { label?: string; action?: string };
  }>(),
  {
    prompt: "Are you sure?",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    pendingLabel: "Working…",
    doneLabel: "Done",
    errorLabel: "Something went wrong",
    retryLabel: "Retry",
    undoLabel: "Undo",
    tone: "neutral",
    confirmTimeout: 5000,
    resultTimeout: 4000,
    disabled: false,
  },
);

const emit = defineEmits<{ cancel: [] }>();
/** `v-model:state` binds the step the control is on. The `icon` slot draws its leading icon. */
const state = defineModel<ConfirmMorphState>("state", { default: "idle" });
let timer: ReturnType<typeof setTimeout> | undefined;
const root = ref<HTMLElement>();

watch(
  state,
  (value) => {
    clearTimeout(timer);
    if (value === "confirming") timer = setTimeout(() => (state.value = "idle"), props.confirmTimeout);
    if (value === "done" || value === "error") timer = setTimeout(() => (state.value = "idle"), props.resultTimeout);
  },
  { immediate: true },
);

async function confirm() {
  state.value = "pending";
  try {
    await props.onConfirm?.();
    state.value = "done";
  } catch {
    state.value = "error";
  }
}

async function undo() {
  state.value = "pending";
  try {
    await props.onUndo?.();
    state.value = "idle";
  } catch {
    state.value = "error";
  }
}

function cancel() {
  state.value = "idle";
  emit("cancel");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && state.value === "confirming") cancel();
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div ref="root" :class="['mc-confirm', `mc-confirm--${tone}`]" :data-state="state" aria-live="polite" @keydown="onKeydown">
    <button v-if="state === 'idle'" type="button" class="mc-confirm__main" :disabled="disabled" @click="state = 'confirming'">
      <slot name="icon" /><span :class="classNames?.label">{{ label }}</span>
    </button>
    <template v-else-if="state === 'confirming'">
      <span class="mc-confirm__text">{{ prompt }}</span>
      <button type="button" :class="['mc-confirm__action', classNames?.action]" @click="cancel">{{ cancelLabel }}</button>
      <button type="button" :class="['mc-confirm__action', 'mc-confirm__action--strong', classNames?.action]" autofocus @click="confirm">{{ confirmLabel }}</button>
    </template>
    <template v-else-if="state === 'pending'">
      <span class="mc-confirm__spinner" aria-hidden="true" /><span class="mc-confirm__text">{{ pendingLabel }}</span>
    </template>
    <template v-else-if="state === 'done'">
      <span class="mc-confirm__done">✓ {{ doneLabel }}</span>
      <button v-if="onUndo" type="button" :class="['mc-confirm__action', classNames?.action]" @click="undo">{{ undoLabel }}</button>
    </template>
    <template v-else>
      <span class="mc-confirm__error">{{ errorLabel }}</span>
      <button type="button" :class="['mc-confirm__action', classNames?.action]" @click="confirm">{{ retryLabel }}</button>
    </template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-confirm { --mc-accent: var(--foreground); display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); font-size: var(--text-sm); animation: mc-confirm-in .24s var(--ease-enter) both; }
.mc-confirm--danger { --mc-accent: var(--danger); }
.mc-confirm[data-state="error"] { border-color: var(--danger); }
.mc-confirm__main { display: inline-flex; align-items: center; gap: var(--space-2); border: 0; background: transparent; color: var(--mc-accent); font: inherit; font-weight: 500; cursor: pointer; }
.mc-confirm__main:disabled { opacity: .5; cursor: not-allowed; }
.mc-confirm__action { padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-confirm__action--strong { border-color: var(--mc-accent); background: var(--mc-accent); color: var(--background); }
@media (hover: hover) and (pointer: fine) { .mc-confirm__action:not(.mc-confirm__action--strong):hover { background: var(--surface-muted); } }
.mc-confirm__text { color: var(--text-secondary); }
.mc-confirm__done { color: var(--success); font-weight: 500; }
.mc-confirm__error { color: var(--danger); }
.mc-confirm__spinner { width: 14px; height: 14px; border: 1.5px solid var(--mc-accent); border-right-color: transparent; border-radius: 50%; animation: mc-confirm-spin .7s linear infinite; }
@keyframes mc-confirm-in { from { opacity: .6; transform: scale(.98); } to { opacity: 1; transform: none; } }
@keyframes mc-confirm-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-confirm { animation: none; } .mc-confirm__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
</style>
