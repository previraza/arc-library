<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface SplitButtonAction {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    actions: SplitButtonAction[];
    disabled?: boolean;
    variant?: "primary" | "secondary";
    /** Extend the inner, named parts of the split button: main, toggle, content or item. */
    classNames?: { main?: string; toggle?: string; content?: string; item?: string };
  }>(),
  { disabled: false, variant: "primary" },
);

const emit = defineEmits<{ click: [event: MouseEvent]; select: [index: number] }>();
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(-1);

function focusItem(index: number) {
  active.value = index;
  nextTick(() => document.getElementById(`${id}-item-${index}`)?.focus());
}

function show() {
  open.value = true;
  focusItem(Math.max(0, props.actions.findIndex((action) => !action.disabled)));
}

function hide(refocus = false) {
  open.value = false;
  active.value = -1;
  if (refocus) document.getElementById(`${id}-toggle`)?.focus();
}

function choose(index: number) {
  const action = props.actions[index];
  if (!action || action.disabled) return;
  hide(true);
  action.onSelect?.();
  emit("select", index);
}

function onMenuKeydown(event: KeyboardEvent) {
  const count = props.actions.length;
  const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
  if (step) {
    let next = active.value;
    for (let tries = 0; tries < count; tries += 1) {
      next = (next + step + count) % count;
      if (!props.actions[next].disabled) break;
    }
    focusItem(next);
  } else if (event.key === "Escape") hide(true);
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
  <div ref="root" :class="['mc-split', `mc-split--${variant}`]">
    <button type="button" :class="['mc-split__main', classNames?.main]" :disabled="disabled" @click="emit('click', $event)">{{ label }}</button>
    <button
      :id="`${id}-toggle`"
      type="button"
      :class="['mc-split__toggle', classNames?.toggle]"
      :disabled="disabled"
      :aria-label="`${label} options`"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open ? hide() : show()"
      @keydown.down.prevent="show()"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    <div v-if="open" role="menu" :aria-label="`${label} options`" :class="['mc-split__content', classNames?.content]" @keydown="onMenuKeydown">
      <button
        v-for="(action, index) in actions"
        :id="`${id}-item-${index}`"
        :key="`${action.label}-${index}`"
        type="button"
        role="menuitem"
        :tabindex="active === index ? 0 : -1"
        :disabled="action.disabled"
        :data-destructive="action.destructive || undefined"
        :class="['mc-split__item', classNames?.item]"
        @click="choose(index)"
        @pointermove="!action.disabled && focusItem(index)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-split { position: relative; display: inline-flex; }
.mc-split__main, .mc-split__toggle { display: inline-flex; align-items: center; justify-content: center; min-height: var(--control-height-md); border: 1px solid var(--foreground); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-split__main { padding: 0 var(--space-4); border-radius: var(--radius-control) 0 0 var(--radius-control); }
.mc-split__toggle { width: 40px; border-left-width: 0; border-radius: 0 var(--radius-control) var(--radius-control) 0; }
.mc-split--secondary .mc-split__main, .mc-split--secondary .mc-split__toggle { border-color: var(--border); background: var(--surface); color: var(--foreground); }
@media (hover: hover) and (pointer: fine) { .mc-split--primary button:hover:not(:disabled) { opacity: .91; } .mc-split--secondary button:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-split button:disabled { opacity: .52; cursor: not-allowed; }
.mc-split__content { position: absolute; z-index: 1000; top: calc(100% + 6px); right: 0; min-width: 13rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-split-in .18s var(--ease-enter) both; transform-origin: top right; }
.mc-split__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-split__item:focus, .mc-split__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-split__item[data-destructive] { color: var(--danger); }
.mc-split__item:disabled { opacity: .45; cursor: not-allowed; }
@keyframes mc-split-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-split__main, .mc-split__toggle { transition: none; } .mc-split__content { animation: none; } }
</style>
