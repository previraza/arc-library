<script setup lang="ts">
import { computed, ref } from "vue";
import { linePath } from "@/lib/chart";

export type InkColor = "black" | "blue" | "violet";
export type InkWidth = "fine" | "medium" | "bold";

export interface InkPoint {
  x: number;
  y: number;
}

export interface InkStroke {
  id: string;
  points: InkPoint[];
  color: InkColor;
  width: InkWidth;
}

const props = withDefaults(
  defineProps<{
    signer?: string;
    hint?: string;
    defaultColor?: InkColor;
    defaultWidth?: InkWidth;
    height?: number;
    /** Extend the inner, named parts of the pad: surface, hint or action. */
    classNames?: { surface?: string; hint?: string; action?: string };
  }>(),
  { hint: "Sign above the line", defaultColor: "black", defaultWidth: "medium", height: 180 },
);

/** `v-model` binds the strokes as plain points, so you can store them or render them yourself. */
const strokes = defineModel<InkStroke[]>({ default: () => [] });
const color = ref(props.defaultColor);
const width = ref(props.defaultWidth);
const surface = ref<HTMLElement>();
const drawing = ref(false);
const boxWidth = ref(560);

const ink: Record<InkColor, string> = { black: "var(--foreground)", blue: "#1f5fd1", violet: "#6d3cc9" };
const thickness: Record<InkWidth, number> = { fine: 1.5, medium: 2.5, bold: 4 };
const paths = computed(() => strokes.value.map((stroke) => ({ stroke, d: linePath(stroke.points.map((point): [number, number] => [point.x, point.y]), "smooth") || `M${stroke.points[0].x},${stroke.points[0].y}` })));

function point(event: PointerEvent): InkPoint {
  const box = surface.value!.getBoundingClientRect();
  boxWidth.value = box.width;
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function down(event: PointerEvent) {
  drawing.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  strokes.value = [...strokes.value, { id: `s-${strokes.value.length}-${Date.now()}`, color: color.value, width: width.value, points: [point(event)] }];
}

function move(event: PointerEvent) {
  if (!drawing.value) return;
  const last = strokes.value[strokes.value.length - 1];
  strokes.value = [...strokes.value.slice(0, -1), { ...last, points: [...last.points, point(event)] }];
}
</script>

<template>
  <div class="mc-sign">
    <div ref="surface" :class="['mc-sign__surface', classNames?.surface]" role="img" :aria-label="`Signature pad${signer ? ` for ${signer}` : ''}`" :style="{ height: `${height}px` }" @pointerdown="down" @pointermove="move" @pointerup="drawing = false" @pointercancel="drawing = false">
      <svg class="mc-sign__svg" :width="'100%'" :height="height">
        <path v-for="{ stroke, d } in paths" :key="stroke.id" :d="d" fill="none" :stroke="ink[stroke.color]" :stroke-width="thickness[stroke.width]" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="mc-sign__line" />
      <span v-if="strokes.length === 0" :class="['mc-sign__hint', classNames?.hint]">{{ hint }}</span>
    </div>
    <div class="mc-sign__actions">
      <button v-for="name in (['black', 'blue', 'violet'] as const)" :key="name" type="button" class="mc-sign__swatch" :aria-label="`${name} ink`" :aria-pressed="color === name" :style="{ background: ink[name] }" @click="color = name" />
      <button v-for="name in (['fine', 'medium', 'bold'] as const)" :key="name" type="button" class="mc-sign__pen" :aria-label="`${name} pen`" :aria-pressed="width === name" @click="width = name"><span :style="{ height: `${thickness[name]}px` }" /></button>
      <span class="mc-sign__spacer" />
      <button type="button" :class="['mc-sign__action', classNames?.action]" :disabled="strokes.length === 0" @click="strokes = strokes.slice(0, -1)">Undo</button>
      <button type="button" :class="['mc-sign__action', classNames?.action]" :disabled="strokes.length === 0" @click="strokes = []">Clear</button>
    </div>
    <span v-if="signer" class="mc-sign__signer">{{ signer }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-sign { display: grid; gap: var(--space-2); }
.mc-sign__surface { position: relative; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); touch-action: none; cursor: crosshair; }
.mc-sign__svg { position: absolute; inset: 0; pointer-events: none; }
.mc-sign__line { position: absolute; left: 24px; right: 24px; bottom: 36px; height: 1px; background: var(--border-strong); pointer-events: none; }
.mc-sign__hint { position: absolute; left: 0; right: 0; bottom: 12px; color: var(--text-muted); font-size: var(--text-xs); text-align: center; pointer-events: none; }
.mc-sign__actions { display: flex; align-items: center; gap: var(--space-3); }
.mc-sign__swatch { width: 22px; height: 22px; padding: 0; border: 2px solid transparent; border-radius: 50%; cursor: pointer; } .mc-sign__swatch[aria-pressed="true"] { border-color: var(--foreground); }
.mc-sign__pen { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; } .mc-sign__pen[aria-pressed="true"] { background: var(--surface-muted); } .mc-sign__pen span { display: block; width: 18px; border-radius: 2px; background: var(--foreground); }
.mc-sign__spacer { flex: 1; }
.mc-sign__action { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; } .mc-sign__action:disabled { opacity: .4; cursor: not-allowed; }
.mc-sign__signer { color: var(--text-muted); font-size: var(--text-xs); }
</style>
