<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

export interface ExpandingButtonGroupItem {
  id: string;
  label: string;
  /** Return false to cancel. A promise keeps the button pending. */
  onSelect?: () => void | boolean | Promise<void | boolean>;
  /** Shown briefly after the action succeeds, such as "Archived". */
  doneLabel?: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: readonly ExpandingButtonGroupItem[];
    label: string;
    size?: "sm" | "md";
    /** Milliseconds the done label shows. */
    confirmDuration?: number;
    /** Extend the inner, named parts of the group: button or label. */
    classNames?: { button?: string; label?: string };
  }>(),
  { size: "md", confirmDuration: 1400 },
);

/** An `icon-<id>` slot draws each button's icon. Hover or focus expands one; clicking runs it. */
const emit = defineEmits<{ action: [id: string] }>();
const expanded = ref<string | null>(null);
const done = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

async function run(item: ExpandingButtonGroupItem) {
  const result = await item.onSelect?.();
  if (result === false) return;
  emit("action", item.id);
  done.value = item.id;
  clearTimeout(timer);
  timer = setTimeout(() => (done.value = null), props.confirmDuration);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div :class="['mc-xgroup', `mc-xgroup--${size}`]" role="toolbar" :aria-label="label" @pointerleave="expanded = null">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :class="['mc-xgroup__button', classNames?.button]"
      :aria-label="item.label"
      :data-open="expanded === item.id || done === item.id || undefined"
      :data-tone="item.tone"
      :disabled="item.disabled"
      @pointerenter="expanded = item.id"
      @focus="expanded = item.id"
      @blur="expanded = null"
      @click="run(item)"
    >
      <slot :name="`icon-${item.id}`" />
      <span :class="['mc-xgroup__label', classNames?.label]"><span>{{ done === item.id ? (item.doneLabel ?? item.label) : item.label }}</span></span>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-xgroup { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-xgroup__button { display: inline-flex; align-items: center; gap: 0; min-width: 40px; height: 40px; padding: 0 10px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-xgroup--sm .mc-xgroup__button { height: 32px; min-width: 32px; }
.mc-xgroup__button[data-tone="danger"] { color: var(--danger); }
.mc-xgroup__button[data-open] { background: var(--surface); box-shadow: var(--shadow-resting); }
/* The label opens through grid columns, so the button grows to fit without measuring. */
.mc-xgroup__label { display: grid; grid-template-columns: 0fr; transition: grid-template-columns .28s var(--ease-standard), margin .28s var(--ease-standard); }
.mc-xgroup__label > span { overflow: hidden; white-space: nowrap; }
.mc-xgroup__button[data-open] .mc-xgroup__label { grid-template-columns: 1fr; margin-left: 6px; }
.mc-xgroup__button:disabled { opacity: .45; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .mc-xgroup__label, .mc-xgroup__button { transition: none; } }
</style>
