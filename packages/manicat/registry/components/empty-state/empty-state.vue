<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  /** Extend the inner, named parts of the empty state: icon, title, description or action. */
  classNames?: { icon?: string; title?: string; description?: string; action?: string };
}>();
</script>

<template>
  <section class="mc-empty">
    <div v-if="$slots.icon" :class="['mc-empty__icon', classNames?.icon]"><slot name="icon" /></div>
    <h3 :class="['mc-empty__title', classNames?.title]">{{ title }}</h3>
    <p :class="['mc-empty__description', classNames?.description]">{{ description }}</p>
    <div v-if="$slots.action" :class="['mc-empty__action', classNames?.action]"><slot name="action" /></div>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-empty { display: grid; justify-items: center; gap: var(--space-2); padding: var(--space-6) var(--space-5); text-align: center; }
.mc-empty__icon { display: grid; place-items: center; min-width: 48px; height: 48px; padding: 0 12px; margin-bottom: var(--space-2); border: 1px solid var(--border); border-radius: 16px; background: var(--surface-muted); }
.mc-empty__title { margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); }
.mc-empty__description { max-width: 34ch; margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); text-wrap: pretty; }
.mc-empty__action { margin-top: var(--space-3); }
</style>
