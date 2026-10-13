<script setup lang="ts">
import { computed } from "vue";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    /** Extend the inner, named parts of the button: loader, spinner or label. */
    classNames?: { loader?: string; spinner?: string; label?: string };
  }>(),
  { variant: "primary", size: "md", loading: false, disabled: false, type: "button" },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

// Loading keeps the button focusable (a disabled one drops keyboard focus mid-action) and swallows presses instead.
const classes = computed(() => ["mc-button", `mc-button--${props.variant}`, `mc-button--${props.size}`]);

function onClick(event: MouseEvent) {
  if (props.loading) return event.preventDefault();
  emit("click", event);
}
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled"
    :aria-busy="loading || undefined"
    :aria-disabled="loading || undefined"
    @click="onClick"
  >
    <span v-if="loading" :class="['mc-button__loader', classNames?.loader]" aria-hidden="true">
      <span :class="['mc-button__spinner', classNames?.spinner]" />
    </span>
    <span :class="['mc-button__label', { 'mc-button__label--hidden': loading }, classNames?.label]">
      <slot />
    </span>
  </button>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-button { position: relative; display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; gap: var(--space-2); border: 1px solid transparent; border-radius: var(--radius-control); padding: 0 var(--space-4); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform var(--duration-instant) var(--ease-standard), color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-button:active:not(:disabled):not([aria-busy="true"]) { transform: scale(.97); }
.mc-button:disabled { cursor: not-allowed; opacity: .52; }
.mc-button[aria-busy="true"] { cursor: progress; }
.mc-button--primary { color: var(--background); background: var(--foreground); border-color: var(--foreground); }
.mc-button--secondary { color: var(--foreground); background: var(--surface); border-color: var(--border); }
.mc-button--ghost { color: var(--text-secondary); background: transparent; border-color: transparent; }
.mc-button--danger { color: var(--danger); background: var(--surface); border-color: var(--border); }
@media (hover: hover) and (pointer: fine) {
  .mc-button--primary:hover:not(:disabled) { opacity: .91; box-shadow: var(--shadow-resting); }
  .mc-button--secondary:hover:not(:disabled) { background: var(--surface-muted); box-shadow: var(--shadow-resting); }
  .mc-button--ghost:hover:not(:disabled) { color: var(--foreground); background: var(--surface-muted); }
  .mc-button--danger:hover:not(:disabled) { border-color: var(--danger); background: var(--surface-muted); }
}
.mc-button--primary:active:not(:disabled) { opacity: .84; }
.mc-button--secondary:active:not(:disabled), .mc-button--ghost:active:not(:disabled) { color: var(--foreground); background: var(--surface-muted); }
.mc-button--danger:active:not(:disabled) { border-color: var(--danger); background: var(--surface-muted); }
.mc-button--sm { min-height: var(--control-height-sm); padding-inline: var(--space-3); }
.mc-button--lg { min-height: var(--control-height-lg); padding-inline: var(--space-5); }
.mc-button__label { display: inline-flex; align-items: center; gap: var(--space-2); transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-button__label--hidden { opacity: 0; }
.mc-button__loader { position: absolute; left: 50%; top: 50%; display: grid; width: var(--space-4); height: var(--space-4); margin: calc(var(--space-4) / -2); }
.mc-button__spinner { border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: mc-button-spin .7s linear infinite; }
@keyframes mc-button-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-button { transition: none; } .mc-button__spinner { animation-duration: .01ms; animation-iteration-count: 1; } }
</style>
