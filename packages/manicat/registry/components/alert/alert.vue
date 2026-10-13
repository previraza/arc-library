<script setup lang="ts">
export type AlertTone = "info" | "success" | "warning" | "danger";

withDefaults(
  defineProps<{
    tone?: AlertTone;
    title: string;
    /** Controls visibility. Leave it out for an alert that is always shown. */
    open?: boolean;
    /** Shows a dismiss button that emits `dismiss`. */
    dismissible?: boolean;
    /** Extend the inner, named parts of the alert: icon, copy, title, description or dismiss. */
    classNames?: { icon?: string; copy?: string; title?: string; description?: string; dismiss?: string };
  }>(),
  { tone: "info", open: true, dismissible: false },
);

defineEmits<{ dismiss: [] }>();
</script>

<template>
  <div v-if="open" role="alert" :class="['mc-alert', `mc-alert--${tone}`]">
    <span :class="['mc-alert__icon', classNames?.icon]" aria-hidden="true">
      <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="9" r="7.5" />
        <path v-if="tone === 'info'" d="M9 8.2v4M9 5.6v.01" />
        <path v-else-if="tone === 'success'" d="m5.8 9.2 2.2 2.2 4.2-4.6" />
        <path v-else-if="tone === 'warning'" d="M9 5.4v4.2M9 12.2v.01" />
        <path v-else d="m6.4 6.4 5.2 5.2M11.6 6.4l-5.2 5.2" />
      </svg>
    </span>
    <div :class="['mc-alert__copy', classNames?.copy]">
      <span :class="['mc-alert__title', classNames?.title]">{{ title }}</span>
      <p v-if="$slots.default" :class="['mc-alert__description', classNames?.description]"><slot /></p>
    </div>
    <button v-if="dismissible" type="button" :class="['mc-alert__dismiss', classNames?.dismiss]" aria-label="Dismiss" @click="$emit('dismiss')">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-alert { display: flex; align-items: start; gap: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); padding: var(--space-4); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-alert__icon { display: grid; flex: 0 0 auto; place-items: center; width: 18px; height: 18px; margin-top: 1px; }
.mc-alert__copy { flex: 1; min-width: 0; }
.mc-alert__title { display: block; font-size: var(--text-sm); font-weight: 500; }
.mc-alert__description { margin: var(--space-1) 0 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-alert--info .mc-alert__icon { color: var(--accent); } .mc-alert--success .mc-alert__icon { color: var(--success); } .mc-alert--warning .mc-alert__icon { color: var(--warning); } .mc-alert--danger .mc-alert__icon { color: var(--danger); }
.mc-alert__dismiss { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; margin: -5px -6px -5px 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: transform var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-alert__dismiss:active { transform: scale(.96); }
@media (hover: hover) and (pointer: fine) { .mc-alert__dismiss:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-alert__dismiss { transition: none; } .mc-alert__dismiss:active { transform: none; } }
</style>
