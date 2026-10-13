<script setup lang="ts">
import { computed, useId } from "vue";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  items: TabItem[];
  /** Extend the inner, named parts of the tabs: list, trigger, label or content. */
  classNames?: { list?: string; trigger?: string; label?: string; content?: string };
}>();

/** `v-model` binds the active tab's value. Each panel is a slot named after the item's value. */
const model = defineModel<string>();
const id = useId();
const active = computed(() => model.value ?? props.items[0]?.value);

function move(event: KeyboardEvent, index: number) {
  const enabled = props.items.map((item, position) => ({ item, position })).filter(({ item }) => !item.disabled);
  const at = enabled.findIndex(({ position }) => position === index);
  const next = event.key === "ArrowRight" ? enabled[(at + 1) % enabled.length] : event.key === "ArrowLeft" ? enabled[(at - 1 + enabled.length) % enabled.length] : event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1) : undefined;
  if (!next) return;
  event.preventDefault();
  model.value = next.item.value;
  (document.getElementById(`${id}-tab-${next.position}`) as HTMLElement | null)?.focus();
}
</script>

<template>
  <div class="mc-tabs">
    <div :class="['mc-tabs__list', classNames?.list]" role="tablist">
      <button
        v-for="(item, index) in items"
        :id="`${id}-tab-${index}`"
        :key="item.value"
        type="button"
        role="tab"
        :class="['mc-tabs__trigger', classNames?.trigger]"
        :aria-selected="active === item.value"
        :aria-controls="`${id}-panel-${index}`"
        :tabindex="active === item.value ? 0 : -1"
        :data-state="active === item.value ? 'active' : 'inactive'"
        :disabled="item.disabled"
        @click="model = item.value"
        @keydown="move($event, index)"
      >
        <span :class="['mc-tabs__label', classNames?.label]">{{ item.label }}</span>
      </button>
    </div>
    <template v-for="(item, index) in items" :key="item.value">
      <div
        v-if="active === item.value"
        :id="`${id}-panel-${index}`"
        role="tabpanel"
        tabindex="0"
        :aria-labelledby="`${id}-tab-${index}`"
        :class="['mc-tabs__content', classNames?.content]"
      >
        <slot :name="item.value" />
      </div>
    </template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tabs { position: relative; }
.mc-tabs__list { display: inline-flex; max-width: 100%; align-items: center; gap: var(--space-1); padding: var(--space-1); overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); scrollbar-width: none; }
.mc-tabs__trigger { display: inline-grid; min-width: 5.5rem; min-height: var(--control-height-sm); flex: 0 0 auto; place-items: center; padding: 0 var(--space-3); border: 1px solid transparent; border-radius: calc(var(--radius-control) - 3px); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-tabs__trigger:hover { color: var(--foreground); } }
.mc-tabs__trigger[data-state="active"] { border-color: var(--border); background: var(--surface); color: var(--accent-strong); box-shadow: var(--shadow-resting); }
.mc-tabs__trigger:disabled { cursor: not-allowed; opacity: .5; }
.mc-tabs__trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-tabs__content { margin-top: var(--space-4); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); animation: mc-tabs-in .24s var(--ease-enter) both; }
.mc-tabs__content:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; border-radius: var(--radius-control); }
@keyframes mc-tabs-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-tabs__trigger { transition: none; } .mc-tabs__content { animation: none; } }
</style>
