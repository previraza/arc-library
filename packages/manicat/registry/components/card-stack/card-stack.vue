<script setup lang="ts" generic="T">
import { computed, ref, shallowRef } from "vue";

export type CardDecision = "left" | "right";

const props = withDefaults(
  defineProps<{
    items: T[];
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    labels?: { left: string; right: string };
    outcomes?: { left: string; right: string };
    label?: string;
    /** Extend the inner, named parts of the stack: card, button or status. */
    classNames?: { card?: string; button?: string; status?: string };
  }>(),
  { labels: () => ({ left: "Skip", right: "Keep" }), outcomes: () => ({ left: "skipped", right: "kept" }), label: "Cards" },
);

/** The `card` slot draws a card from its item; the `empty` slot receives `reset`. */
const emit = defineEmits<{ decide: [item: T, decision: CardDecision]; undo: [item: T, decision: CardDecision]; reset: [] }>();
const history = shallowRef<{ item: T; decision: CardDecision }[]>([]);
const dx = ref(0);
const dragging = ref(false);
let startX = 0;

const queue = computed(() => {
  const done = new Set(history.value.map((entry) => props.getKey(entry.item)));
  return props.items.filter((item) => !done.has(props.getKey(item)));
});
const top = computed(() => queue.value[0]);
const last = computed(() => history.value[history.value.length - 1]);

function decide(decision: CardDecision) {
  const item = top.value;
  if (!item) return;
  dx.value = decision === "right" ? 420 : -420;
  setTimeout(() => {
    history.value = [...history.value, { item, decision }];
    dx.value = 0;
    emit("decide", item, decision);
  }, 180);
}

function undo() {
  const entry = last.value;
  if (!entry) return;
  history.value = history.value.slice(0, -1);
  emit("undo", entry.item, entry.decision);
}

function reset() {
  history.value = [];
  emit("reset");
}

function down(event: PointerEvent) {
  dragging.value = true;
  startX = event.clientX;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function move(event: PointerEvent) {
  if (dragging.value) dx.value = event.clientX - startX;
}

function up() {
  if (!dragging.value) return;
  dragging.value = false;
  if (dx.value > 90) decide("right");
  else if (dx.value < -90) decide("left");
  else dx.value = 0;
}

// Arrow keys decide and Backspace undoes, so the deck is not pointer-only.
function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowRight") decide("right");
  else if (event.key === "ArrowLeft") decide("left");
  else if (event.key === "Backspace") undo();
  else return;
  event.preventDefault();
}
</script>

<template>
  <section class="mc-deck" :aria-label="label" tabindex="0" @keydown="onKeydown">
    <div class="mc-deck__stage">
      <slot v-if="!top" name="empty" :reset="reset"><button type="button" class="mc-deck__empty" @click="reset">All done. Start over</button></slot>
      <template v-else>
        <div v-if="queue[1]" :class="['mc-deck__card', 'mc-deck__card--behind', classNames?.card]"><slot name="card" :item="queue[1]" /></div>
        <div :key="getKey(top)" :class="['mc-deck__card', classNames?.card]" :data-dragging="dragging || undefined" :style="{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)` }" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
          <slot name="card" :item="top" />
        </div>
      </template>
    </div>
    <div class="mc-deck__buttons">
      <button type="button" :class="['mc-deck__button', classNames?.button]" :disabled="!top" @click="decide('left')">← {{ labels.left }}</button>
      <button type="button" :class="['mc-deck__button', classNames?.button]" :disabled="!top" @click="decide('right')">{{ labels.right }} →</button>
      <button type="button" class="mc-deck__undo" :disabled="!last" @click="undo">Undo</button>
    </div>
    <p :class="['mc-deck__status', classNames?.status]" aria-live="polite">{{ last ? `${getLabel(last.item)} ${outcomes[last.decision]}` : " " }}</p>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-deck { display: grid; gap: var(--space-3); outline: none; }
.mc-deck__stage { position: relative; display: grid; min-height: 200px; align-items: center; }
.mc-deck__card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); touch-action: pan-y; cursor: grab; transition: transform .22s var(--ease-standard); }
.mc-deck__card[data-dragging] { transition: none; cursor: grabbing; }
.mc-deck__card--behind { position: absolute; inset: 8px 10px auto; opacity: .6; transform: scale(.97); pointer-events: none; }
.mc-deck__empty { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-deck__buttons { display: flex; align-items: center; justify-content: center; gap: var(--space-3); }
.mc-deck__button { min-height: var(--control-height-sm); padding: 0 var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-deck__button:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-deck__button:disabled, .mc-deck__undo:disabled { opacity: .4; cursor: not-allowed; }
.mc-deck__undo { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-deck__status { min-height: 1.2em; margin: 0; color: var(--text-muted); font-size: var(--text-xs); text-align: center; }
@media (prefers-reduced-motion: reduce) { .mc-deck__card { transition: none; } }
</style>
