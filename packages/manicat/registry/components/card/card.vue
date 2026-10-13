<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  status?: string;
  /** Extend the inner, named parts of the card: media, content, title, description, footer, meta, status or action. */
  classNames?: { media?: string; content?: string; title?: string; description?: string; footer?: string; meta?: string; status?: string; action?: string };
}>();
</script>

<template>
  <article class="mc-card">
    <div v-if="$slots.media" :class="['mc-card__media', classNames?.media]"><slot name="media" /></div>
    <div :class="['mc-card__content', classNames?.content]">
      <h3 :class="['mc-card__title', classNames?.title]">{{ title }}</h3>
      <p v-if="description" :class="['mc-card__description', classNames?.description]">{{ description }}</p>
      <slot />
      <div v-if="$slots.avatar || $slots.meta || status || $slots.action" :class="['mc-card__footer', classNames?.footer]">
        <div class="mc-card__byline">
          <span v-if="$slots.avatar" class="mc-card__avatar"><slot name="avatar" /></span>
          <span class="mc-card__bylineText">
            <span v-if="$slots.meta" :class="['mc-card__meta', classNames?.meta]"><slot name="meta" /></span>
            <span v-if="status" :class="['mc-card__status', classNames?.status]">{{ status }}</span>
          </span>
        </div>
        <div v-if="$slots.action" :class="['mc-card__action', classNames?.action]"><slot name="action" /></div>
      </div>
    </div>
  </article>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-card { position: relative; min-width: 0; overflow: hidden; isolation: isolate; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-raised); } }
.mc-card__media { position: relative; display: grid; min-height: 112px; place-items: center; overflow: hidden; background: var(--surface-muted); }
.mc-card__content { padding: var(--space-5); }
.mc-card__title { width: fit-content; max-width: 100%; margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); line-height: 1.3; text-wrap: balance; }
.mc-card__description { max-width: 34ch; margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); text-wrap: pretty; }
.mc-card__footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-5); }
.mc-card__byline { display: flex; flex: 1 1 auto; align-items: center; gap: var(--space-3); min-width: 0; }
.mc-card__avatar { display: grid; flex: none; width: var(--space-8); height: var(--space-8); overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-card__avatar > * { width: 100%; height: 100%; object-fit: cover; }
.mc-card__bylineText { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-card__meta { overflow: hidden; color: var(--foreground); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.mc-card__status { overflow: hidden; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.mc-card__action { display: flex; flex: none; flex-wrap: wrap; gap: var(--space-3); }
@media (prefers-reduced-motion: reduce) { .mc-card { transition: none; } }
</style>
