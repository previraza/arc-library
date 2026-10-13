<script setup lang="ts">
export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

withDefaults(
  defineProps<{
    tone?: BadgeTone;
    size?: BadgeSize;
    /** Extend the inner, named parts of the badge: icon or label. */
    classNames?: { icon?: string; label?: string };
  }>(),
  { tone: "neutral", size: "md" },
);
</script>

<template>
  <span :class="['mc-badge', `mc-badge--${tone}`, `mc-badge--${size}`]">
    <span v-if="$slots.icon" :class="['mc-badge__icon', classNames?.icon]" aria-hidden="true"><slot name="icon" /></span>
    <span :class="['mc-badge__label', classNames?.label]"><slot /></span>
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-badge { display: inline-flex; min-height: 26px; align-items: center; gap: 5px; border: 1px solid var(--badge-border, var(--border)); border-radius: var(--radius-pill); padding: 0 10px; color: var(--badge-foreground, var(--foreground)); background: var(--badge-background, var(--surface)); font-size: var(--text-xs); font-weight: 500; letter-spacing: -.01em; line-height: 1; white-space: nowrap; transition: border-color var(--duration-standard) var(--ease-standard), background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) {
  .mc-badge:hover { border-color: color-mix(in oklab, var(--badge-color, var(--foreground)) 32%, var(--border)); background: color-mix(in oklab, var(--badge-color, var(--foreground)) 10%, var(--surface)); }
}
.mc-badge--sm { min-height: 22px; gap: 4px; padding: 0 8px; font-size: 11px; }
.mc-badge__icon { display: inline-flex; align-items: center; justify-content: center; color: var(--badge-color, var(--foreground)); line-height: 1; }
.mc-badge__label { display: inline-flex; align-items: center; }
.mc-badge--neutral { --badge-color: var(--text-secondary); --badge-foreground: var(--text-secondary); --badge-background: var(--surface-muted); --badge-border: var(--border); }
.mc-badge--success { --badge-color: var(--success); --badge-foreground: var(--success); --badge-background: color-mix(in oklab, var(--success) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--success) 25%, var(--border)); }
.mc-badge--info { --badge-color: var(--accent); --badge-foreground: var(--accent-strong); --badge-background: var(--accent-subtle); --badge-border: color-mix(in oklab, var(--accent) 24%, var(--border)); }
.mc-badge--warning { --badge-color: var(--warning); --badge-foreground: var(--warning); --badge-background: color-mix(in oklab, var(--warning) 11%, var(--surface)); --badge-border: color-mix(in oklab, var(--warning) 27%, var(--border)); }
.mc-badge--danger { --badge-color: var(--danger); --badge-foreground: var(--danger); --badge-background: color-mix(in oklab, var(--danger) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--danger) 26%, var(--border)); }
@media (prefers-reduced-motion: reduce) { .mc-badge { transition-duration: var(--duration-instant); } }
</style>
