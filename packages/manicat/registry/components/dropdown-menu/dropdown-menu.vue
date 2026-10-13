<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface DropdownItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
}

const props = defineProps<{
  /** Accessible name of the trigger and the menu. */
  label: string;
  items: DropdownItem[];
  /** Extend the inner, named parts of the menu: trigger, content, item or separator. */
  classNames?: { trigger?: string; content?: string; item?: string; separator?: string };
}>();

/** Also emitted on every choice, with the item's index, for code that prefers listening over `onSelect` callbacks. */
const emit = defineEmits<{ select: [index: number] }>();

const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(-1);

function focusItem(index: number) {
  active.value = index;
  nextTick(() => document.getElementById(`${id}-item-${index}`)?.focus());
}

function show(index = 0) {
  open.value = true;
  const first = props.items.findIndex((item, at) => at >= index && !item.disabled);
  nextTick(() => focusItem(Math.max(0, first)));
}

function hide(refocus = false) {
  open.value = false;
  active.value = -1;
  if (refocus) root.value?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
}

function choose(index: number) {
  const item = props.items[index];
  if (!item || item.disabled) return;
  hide(true);
  item.onSelect?.();
  emit("select", index);
}

function step(from: number, direction: number) {
  const length = props.items.length;
  for (let tries = 1; tries <= length; tries += 1) {
    const next = (from + direction * tries + length * tries) % length;
    if (!props.items[next].disabled) return next;
  }
  return from;
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") focusItem(step(active.value, 1));
  else if (event.key === "ArrowUp") focusItem(step(active.value, -1));
  else if (event.key === "Home") focusItem(step(-1, 1));
  else if (event.key === "End") focusItem(step(props.items.length, -1));
  else if (event.key === "Escape") hide(true);
  else if (event.key === "Tab") hide();
  else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) hide();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-menu">
    <button
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="`${id}-menu`"
      :aria-label="$slots.icon ? label : undefined"
      :data-state="open ? 'open' : 'closed'"
      :class="['mc-menu__trigger', classNames?.trigger]"
      @click="open ? hide() : show()"
      @keydown.down.prevent="show()"
    >
      <slot name="icon">{{ label }}</slot>
    </button>
    <div v-if="open" :id="`${id}-menu`" role="menu" :aria-label="label" :class="['mc-menu__content', classNames?.content]" @keydown="onMenuKeydown">
      <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <div v-if="item.separatorBefore" role="separator" :class="['mc-menu__separator', classNames?.separator]" />
        <button
          :id="`${id}-item-${index}`"
          type="button"
          role="menuitem"
          :tabindex="active === index ? 0 : -1"
          :disabled="item.disabled"
          :data-destructive="item.destructive || undefined"
          :class="['mc-menu__item', classNames?.item]"
          @click="choose(index)"
          @pointermove="!item.disabled && focusItem(index)"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-menu { position: relative; display: inline-block; }
.mc-menu__trigger { display: inline-flex; max-width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: center; gap: var(--space-2); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-menu__trigger:hover { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-menu__trigger[data-state="open"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-menu__trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-menu__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-menu-in .18s var(--ease-enter) both; transform-origin: top left; }
.mc-menu__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-menu__item:focus, .mc-menu__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-menu__item[data-destructive] { color: var(--danger); }
.mc-menu__item:disabled { opacity: .45; cursor: not-allowed; }
.mc-menu__separator { height: 1px; margin: 4px var(--space-2); background: var(--border); }
@keyframes mc-menu-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-menu__trigger { transition: none; } .mc-menu__content { animation: none; } }
</style>
