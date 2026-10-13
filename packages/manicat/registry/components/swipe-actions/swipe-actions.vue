<script setup lang="ts">
import { computed, ref } from "vue";

export interface SwipeAction {
  label: string;
  tone?: "neutral" | "accent" | "danger";
  onSelect: () => void;
  /** Keep the row in place after the action runs instead of closing it. */
  keepRow?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    leading?: SwipeAction[];
    trailing?: SwipeAction[];
    /** Extend the inner, named parts of the row: row, content or action. */
    classNames?: { row?: string; content?: string; action?: string };
  }>(),
  { leading: () => [], trailing: () => [] },
);

const WIDTH = 84;
const x = ref(0);
const dragging = ref(false);
let startX = 0;
let startOffset = 0;

const maxLeft = computed(() => props.leading.length * WIDTH);
const maxRight = computed(() => props.trailing.length * WIDTH);

function down(event: PointerEvent) {
  dragging.value = true;
  startX = event.clientX;
  startOffset = x.value;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function move(event: PointerEvent) {
  if (!dragging.value) return;
  x.value = Math.max(-maxRight.value, Math.min(maxLeft.value, startOffset + event.clientX - startX));
}

function up() {
  if (!dragging.value) return;
  dragging.value = false;
  x.value = x.value > WIDTH / 2 && maxLeft.value ? maxLeft.value : x.value < -WIDTH / 2 && maxRight.value ? -maxRight.value : 0;
}

function run(action: SwipeAction) {
  action.onSelect();
  if (!action.keepRow) x.value = 0;
}

// Arrow keys reveal the actions, so the row is not pointer-only.
function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowLeft" && maxRight.value) x.value = -maxRight.value;
  else if (event.key === "ArrowRight" && maxLeft.value) x.value = maxLeft.value;
  else if (event.key === "Escape") x.value = 0;
  else return;
  event.preventDefault();
}
</script>

<template>
  <div :class="['mc-swipe', classNames?.row]" role="listitem" :aria-label="label">
    <div v-if="leading.length" class="mc-swipe__strip mc-swipe__strip--leading">
      <button v-for="action in leading" :key="action.label" type="button" :class="['mc-swipe__action', classNames?.action]" :data-tone="action.tone" @click="run(action)"><slot :name="`icon-${action.label}`" />{{ action.label }}</button>
    </div>
    <div v-if="trailing.length" class="mc-swipe__strip mc-swipe__strip--trailing">
      <button v-for="action in trailing" :key="action.label" type="button" :class="['mc-swipe__action', classNames?.action]" :data-tone="action.tone" @click="run(action)"><slot :name="`icon-${action.label}`" />{{ action.label }}</button>
    </div>
    <div
      :class="['mc-swipe__content', classNames?.content]"
      tabindex="0"
      :data-dragging="dragging || undefined"
      :style="{ transform: `translateX(${x}px)` }"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @keydown="onKeydown"
    >
      <slot />
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Wrap rows in an element with role="list". */
.mc-swipe { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
.mc-swipe__strip { position: absolute; top: 0; bottom: 0; display: flex; }
.mc-swipe__strip--leading { left: 0; } .mc-swipe__strip--trailing { right: 0; }
.mc-swipe__action { display: flex; width: 84px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 0; background: var(--text-secondary); color: #fff; font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-swipe__action[data-tone="accent"] { background: var(--accent); } .mc-swipe__action[data-tone="danger"] { background: var(--danger); }
.mc-swipe__content { position: relative; padding: var(--space-2) var(--space-4); background: var(--surface); touch-action: pan-y; transition: transform .28s var(--ease-standard); outline: none; }
.mc-swipe__content[data-dragging] { transition: none; cursor: grabbing; }
.mc-swipe__content:focus-visible { background: var(--surface-muted); }
@media (prefers-reduced-motion: reduce) { .mc-swipe__content { transition: none; } }
</style>
