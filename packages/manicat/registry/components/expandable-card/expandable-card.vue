<script setup lang="ts">
import { ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    defaultExpanded?: boolean;
    /** Extend the inner, named parts of the card: header, title, description, chevron or body. */
    classNames?: { header?: string; title?: string; description?: string; chevron?: string; body?: string };
  }>(),
  { defaultExpanded: false },
);

const expanded = ref(props.defaultExpanded);
const id = useId();
</script>

<template>
  <article class="mc-expandable" :data-expanded="expanded || undefined">
    <h3 class="mc-expandable__heading">
      <button type="button" :id="`${id}-trigger`" :class="['mc-expandable__header', classNames?.header]" :aria-expanded="expanded" :aria-controls="`${id}-panel`" @click="expanded = !expanded">
        <span class="mc-expandable__copy">
          <span :class="['mc-expandable__title', classNames?.title]">{{ title }}</span>
          <span v-if="description" :class="['mc-expandable__description', classNames?.description]">{{ description }}</span>
        </span>
        <svg :class="['mc-expandable__chevron', classNames?.chevron]" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
      </button>
    </h3>
    <div :id="`${id}-panel`" role="region" :aria-labelledby="`${id}-trigger`" class="mc-expandable__panel">
      <div class="mc-expandable__clip"><div :class="['mc-expandable__body', classNames?.body]"><slot /></div></div>
    </div>
  </article>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-expandable { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-expandable[data-expanded] { border-color: var(--border-strong); box-shadow: var(--shadow-raised); }
.mc-expandable__heading { margin: 0; }
.mc-expandable__header { display: flex; width: 100%; align-items: center; gap: var(--space-3); padding: var(--space-5); border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.mc-expandable__copy { display: grid; flex: 1; gap: 4px; }
.mc-expandable__title { font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); }
.mc-expandable__description { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-expandable__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform .3s var(--ease-standard); }
.mc-expandable[data-expanded] .mc-expandable__chevron { transform: rotate(180deg); }
.mc-expandable__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s var(--ease-standard); }
.mc-expandable[data-expanded] .mc-expandable__panel { grid-template-rows: 1fr; }
.mc-expandable__clip { min-height: 0; overflow: hidden; }
.mc-expandable__body { padding: var(--space-5); border-top: 1px solid var(--border); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-expandable, .mc-expandable__chevron, .mc-expandable__panel { transition: none; } }
</style>
