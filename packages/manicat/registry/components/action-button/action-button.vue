<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    successLabel?: string;
    pendingLabel?: string;
    /** Runs when clicked. A promise drives the pending and success states. */
    onAction: () => void | Promise<void>;
    /** Milliseconds the success state shows before the button returns to idle. */
    resetAfterMs?: number;
    disabled?: boolean;
    /** Extend the inner, named parts of the action button: spinner or label. */
    classNames?: { spinner?: string; label?: string };
  }>(),
  { successLabel: "Done", resetAfterMs: 1600, disabled: false },
);

const emit = defineEmits<{ error: [error: unknown] }>();
const phase = ref<"idle" | "pending" | "success">("idle");
let timer: ReturnType<typeof setTimeout> | undefined;

async function press() {
  if (phase.value !== "idle") return;
  phase.value = "pending";
  try {
    await props.onAction();
    phase.value = "success";
    timer = setTimeout(() => (phase.value = "idle"), props.resetAfterMs);
  } catch (error) {
    phase.value = "idle";
    emit("error", error);
  }
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button type="button" class="mc-action" :data-phase="phase" :disabled="disabled" :aria-busy="phase === 'pending' || undefined" @click="press">
    <span v-if="phase === 'pending'" :class="['mc-action__spinner', classNames?.spinner]" aria-hidden="true" />
    <svg v-else-if="phase === 'success'" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
    <span :class="['mc-action__label', classNames?.label]">{{ phase === "success" ? successLabel : phase === "pending" ? (pendingLabel ?? label) : label }}</span>
  </button>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: var(--control-height-md); padding: 0 var(--space-4); border: 1px solid var(--foreground); border-radius: var(--radius-control); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard), border-color var(--duration-standard) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-action:active:not(:disabled) { transform: scale(.97); }
.mc-action[data-phase="pending"] { cursor: progress; }
.mc-action[data-phase="success"] { border-color: var(--success); background: var(--surface); color: var(--success); }
.mc-action:disabled { opacity: .52; cursor: not-allowed; }
.mc-action__spinner { width: 14px; height: 14px; border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: mc-action-spin .7s linear infinite; }
@keyframes mc-action-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-action { transition: none; } .mc-action:active:not(:disabled) { transform: none; } .mc-action__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
</style>
