<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical";
    labels?: [string, string] | false;
    label?: string;
    /** Any CSS aspect ratio, such as "16/10". */
    aspectRatio?: string;
    /** Extend the inner, named parts of the comparison: handle or tag. */
    classNames?: { handle?: string; tag?: string };
  }>(),
  { orientation: "horizontal", labels: () => ["Before", "After"], label: "Image comparison", aspectRatio: "16/10" },
);

/** `v-model` binds the divider's position, 0 to 100. Fill the `before` and `after` slots with any content. */
const position = defineModel<number>({ default: 50 });
const root = ref<HTMLElement>();
const dragging = ref(false);

function update(event: PointerEvent) {
  const box = root.value!.getBoundingClientRect();
  const ratio = props.orientation === "horizontal" ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height;
  position.value = Math.max(0, Math.min(100, ratio * 100));
}

function down(event: PointerEvent) {
  dragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  update(event);
}

function onKeydown(event: KeyboardEvent) {
  const forward = props.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  const backward = props.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  if (event.key === forward) position.value = Math.min(100, position.value + 5);
  else if (event.key === backward) position.value = Math.max(0, position.value - 5);
  else if (event.key === "Home") position.value = 0;
  else if (event.key === "End") position.value = 100;
  else return;
  event.preventDefault();
}
</script>

<template>
  <div ref="root" :class="['mc-compare', `mc-compare--${orientation}`]" :style="{ aspectRatio, '--mc-pos': `${position}%` }">
    <div class="mc-compare__layer"><slot name="after" /></div>
    <div class="mc-compare__layer mc-compare__before"><slot name="before" /></div>
    <div class="mc-compare__surface" @pointerdown="down" @pointermove="dragging && update($event)" @pointerup="dragging = false" @pointercancel="dragging = false" />
    <div
      class="mc-compare__line"
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-orientation="orientation"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(position)"
      @keydown="onKeydown"
    >
      <span :class="['mc-compare__handle', classNames?.handle]" aria-hidden="true">{{ orientation === "horizontal" ? "↔" : "↕" }}</span>
    </div>
    <template v-if="labels"><span :class="['mc-compare__tag', 'mc-compare__tag--start', classNames?.tag]">{{ labels[0] }}</span><span :class="['mc-compare__tag', 'mc-compare__tag--end', classNames?.tag]">{{ labels[1] }}</span></template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-compare { position: relative; width: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); user-select: none; }
.mc-compare__layer { position: absolute; inset: 0; } .mc-compare__layer > * { width: 100%; height: 100%; object-fit: cover; }
.mc-compare--horizontal .mc-compare__before { clip-path: inset(0 calc(100% - var(--mc-pos)) 0 0); } .mc-compare--vertical .mc-compare__before { clip-path: inset(0 0 calc(100% - var(--mc-pos)) 0); }
.mc-compare__surface { position: absolute; inset: 0; touch-action: none; cursor: ew-resize; } .mc-compare--vertical .mc-compare__surface { cursor: ns-resize; }
.mc-compare__line { position: absolute; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .15); outline: none; }
.mc-compare--horizontal .mc-compare__line { top: 0; bottom: 0; left: var(--mc-pos); width: 2px; margin-left: -1px; } .mc-compare--vertical .mc-compare__line { left: 0; right: 0; top: var(--mc-pos); height: 2px; margin-top: -1px; }
.mc-compare__handle { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--text-secondary); font-size: 12px; box-shadow: var(--shadow-raised); }
.mc-compare__line:focus-visible .mc-compare__handle { border-color: var(--foreground); }
.mc-compare__tag { position: absolute; padding: 2px 8px; border-radius: var(--radius-pill); background: rgb(0 0 0 / .5); color: #fff; font-size: var(--text-xs); pointer-events: none; }
.mc-compare__tag--start { top: 8px; left: 8px; } .mc-compare__tag--end { right: 8px; bottom: 8px; }
</style>
