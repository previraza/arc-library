<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export type ButtonGroupVariant = "outline" | "solid";
export type ButtonGroupSize = "sm" | "md";

export interface ButtonGroupItem {
  id: string;
  /** Visible text and the accessible name. */
  label: string;
  /** Shows only the `icon-<id>` slot; the label stays the accessible name. */
  iconOnly?: boolean;
  disabled?: boolean;
  href?: string;
}

export interface ButtonGroupMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

const props = withDefaults(
  defineProps<{
    items: ButtonGroupItem[];
    /** An overflow menu behind a chevron segment. `label` is its accessible name. */
    menu?: { label: string; items: ButtonGroupMenuItem[] };
    label: string;
    variant?: ButtonGroupVariant;
    size?: ButtonGroupSize;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    /** Extend the inner, named parts of the group: segment or menuContent. */
    classNames?: { segment?: string; menuContent?: string };
  }>(),
  { variant: "outline", size: "md", orientation: "horizontal", disabled: false },
);

const emit = defineEmits<{ select: [id: string] }>();
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(-1);

function focusItem(index: number) {
  active.value = index;
  nextTick(() => document.getElementById(`${id}-item-${index}`)?.focus());
}

function hide(refocus = false) {
  open.value = false;
  active.value = -1;
  if (refocus) document.getElementById(`${id}-menu-toggle`)?.focus();
}

function chooseMenu(index: number) {
  const entry = props.menu?.items[index];
  if (!entry || entry.disabled) return;
  hide(true);
  entry.onSelect?.();
  emit("select", entry.id);
}

function onMenuKeydown(event: KeyboardEvent) {
  const total = props.menu?.items.length ?? 0;
  if (event.key === "ArrowDown") focusItem((active.value + 1) % total);
  else if (event.key === "ArrowUp") focusItem((active.value - 1 + total) % total);
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
  <div ref="root" :class="['mc-bgroup', `mc-bgroup--${variant}`, `mc-bgroup--${size}`, `mc-bgroup--${orientation}`]" role="toolbar" :aria-label="label">
    <component
      :is="item.href ? 'a' : 'button'"
      v-for="item in items"
      :key="item.id"
      :href="item.href"
      :type="item.href ? undefined : 'button'"
      :class="['mc-bgroup__segment', classNames?.segment]"
      :aria-label="item.iconOnly ? item.label : undefined"
      :title="item.iconOnly ? item.label : undefined"
      :disabled="disabled || item.disabled || undefined"
      @click="emit('select', item.id)"
    >
      <slot :name="`icon-${item.id}`" />
      <span v-if="!item.iconOnly">{{ item.label }}</span>
    </component>
    <template v-if="menu">
      <button
        :id="`${id}-menu-toggle`"
        type="button"
        :class="['mc-bgroup__segment', 'mc-bgroup__toggle', classNames?.segment]"
        :aria-label="menu.label"
        aria-haspopup="menu"
        :aria-expanded="open"
        :disabled="disabled"
        @click="open ? hide() : (open = true, focusItem(0))"
        @keydown.down.prevent="open = true; focusItem(0)"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
      </button>
      <div v-if="open" role="menu" :aria-label="menu.label" :class="['mc-bgroup__menu', classNames?.menuContent]" @keydown="onMenuKeydown">
        <button v-for="(entry, index) in menu.items" :id="`${id}-item-${index}`" :key="entry.id" type="button" role="menuitem" :tabindex="active === index ? 0 : -1" :disabled="entry.disabled" @click="chooseMenu(index)" @pointermove="!entry.disabled && focusItem(index)">{{ entry.label }}</button>
      </div>
    </template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-bgroup { position: relative; display: inline-flex; }
.mc-bgroup--vertical { flex-direction: column; }
.mc-bgroup__segment { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; text-decoration: none; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-bgroup--sm .mc-bgroup__segment { min-height: var(--control-height-sm); }
.mc-bgroup--horizontal .mc-bgroup__segment + .mc-bgroup__segment { margin-left: -1px; }
.mc-bgroup--vertical .mc-bgroup__segment + .mc-bgroup__segment { margin-top: -1px; }
.mc-bgroup--horizontal .mc-bgroup__segment:first-child { border-radius: var(--radius-control) 0 0 var(--radius-control); } .mc-bgroup--horizontal .mc-bgroup__segment:last-of-type { border-radius: 0 var(--radius-control) var(--radius-control) 0; }
.mc-bgroup--horizontal .mc-bgroup__segment:only-of-type { border-radius: var(--radius-control); }
.mc-bgroup--vertical .mc-bgroup__segment:first-child { border-radius: var(--radius-control) var(--radius-control) 0 0; } .mc-bgroup--vertical .mc-bgroup__segment:last-of-type { border-radius: 0 0 var(--radius-control) var(--radius-control); }
.mc-bgroup--solid .mc-bgroup__segment { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
@media (hover: hover) and (pointer: fine) { .mc-bgroup--outline .mc-bgroup__segment:hover:not(:disabled) { background: var(--surface-muted); } .mc-bgroup--solid .mc-bgroup__segment:hover:not(:disabled) { opacity: .9; } }
.mc-bgroup__segment:disabled { opacity: .5; cursor: not-allowed; }
.mc-bgroup__toggle { min-width: var(--control-height-md); padding: 0; }
.mc-bgroup__menu { position: absolute; z-index: 1000; top: calc(100% + 6px); right: 0; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-bgroup-in .18s var(--ease-enter) both; transform-origin: top right; }
.mc-bgroup__menu button { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-bgroup__menu button:focus, .mc-bgroup__menu button:focus-visible { outline: none; background: var(--surface-muted); }
.mc-bgroup__menu button:disabled { opacity: .45; cursor: not-allowed; }
@keyframes mc-bgroup-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-bgroup__segment { transition: none; } .mc-bgroup__menu { animation: none; } }
</style>
