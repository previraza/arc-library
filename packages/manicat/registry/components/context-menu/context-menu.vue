<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface ContextMenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  checked?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: ContextMenuItem[];
    label?: string;
    /** Extend the inner, named parts of the menu: content or item. */
    classNames?: { content?: string; item?: string };
  }>(),
  { label: "Context menu" },
);

const emit = defineEmits<{ select: [id: string] }>();
const id = useId();
const host = ref<HTMLElement>();
const menu = ref<HTMLElement>();
const open = ref(false);
const point = ref({ x: 0, y: 0 });
const active = ref(-1);

async function show(x: number, y: number) {
  point.value = { x, y };
  open.value = true;
  await nextTick();
  // Keep the menu on screen near the edges.
  const box = menu.value?.getBoundingClientRect();
  if (box) point.value = { x: Math.min(x, window.innerWidth - box.width - 8), y: Math.min(y, window.innerHeight - box.height - 8) };
  focusItem(props.items.findIndex((item) => !item.disabled));
}

function focusItem(index: number) {
  active.value = index;
  nextTick(() => document.getElementById(`${id}-item-${index}`)?.focus());
}

function hide(refocus = false) {
  open.value = false;
  active.value = -1;
  if (refocus) host.value?.focus();
}

function choose(index: number) {
  const item = props.items[index];
  if (!item || item.disabled) return;
  hide(true);
  item.onSelect?.();
  emit("select", item.id);
}

function onContextmenu(event: MouseEvent) {
  event.preventDefault();
  show(event.clientX, event.clientY);
}

// The menu key and Shift+F10 open it at the element, so it is not pointer-only.
function onHostKeydown(event: KeyboardEvent) {
  if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
    event.preventDefault();
    const box = host.value?.getBoundingClientRect();
    if (box) show(box.left + 16, box.top + 16);
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const count = props.items.length;
  const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
  if (step) {
    let next = active.value;
    for (let tries = 0; tries < count; tries += 1) {
      next = (next + step + count) % count;
      if (!props.items[next].disabled) break;
    }
    focusItem(next);
  } else if (event.key === "Escape") hide(true);
  else if (event.key === "Tab") hide();
  else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (open.value && menu.value && !menu.value.contains(event.target as Node)) hide();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="host" class="mc-context" tabindex="0" @contextmenu="onContextmenu" @keydown="onHostKeydown">
    <slot />
    <div v-if="open" ref="menu" role="menu" :aria-label="label" :class="['mc-context__content', classNames?.content]" :style="{ left: `${point.x}px`, top: `${point.y}px` }" @keydown="onMenuKeydown">
      <button
        v-for="(item, index) in items"
        :id="`${id}-item-${index}`"
        :key="item.id"
        type="button"
        :role="item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'"
        :aria-checked="item.checked"
        :tabindex="active === index ? 0 : -1"
        :disabled="item.disabled"
        :data-destructive="item.destructive || undefined"
        :class="['mc-context__item', classNames?.item]"
        @click="choose(index)"
        @pointermove="!item.disabled && focusItem(index)"
      >
        <span>{{ item.label }}</span>
        <svg v-if="item.checked" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </button>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-context { outline: none; }
.mc-context__content { position: fixed; z-index: 1000; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-context-in .14s var(--ease-enter) both; transform-origin: top left; }
.mc-context__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: space-between; gap: var(--space-3); padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-context__item:focus, .mc-context__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-context__item[data-destructive] { color: var(--danger); }
.mc-context__item:disabled { opacity: .45; cursor: not-allowed; }
@keyframes mc-context-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-context__content { animation: none; } }
</style>
