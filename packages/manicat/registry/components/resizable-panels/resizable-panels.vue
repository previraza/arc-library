<script setup lang="ts">
import { ref, useId } from "vue";

export interface PanelDefinition {
  id: string;
  label: string;
  /** Share of the space it starts with, in percent. */
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
}

const props = withDefaults(
  defineProps<{
    /** The panels in order. Each one's content goes in the slot named after its `id`. */
    panels: PanelDefinition[];
    label?: string;
    direction?: "horizontal" | "vertical";
    /** Extend the inner, named parts of the panels: panel or handle. */
    classNames?: { panel?: string; handle?: string };
  }>(),
  { label: "Resizable panels", direction: "horizontal" },
);

/** `v-model` binds the sizes in percent; they always add up to 100. */
const sizes = defineModel<number[] | undefined>();
const current = ref(props.panels.map((panel) => panel.defaultSize));
const shown = () => sizes.value ?? current.value;
const root = ref<HTMLElement>();
const id = useId();
let origin: { pointer: number; sizes: number[] } | null = null;

function commit(next: number[]) {
  current.value = next;
  sizes.value = next;
}

function clampPair(index: number, first: number, base: number[]) {
  const a = props.panels[index];
  const b = props.panels[index + 1];
  const sum = base[index] + base[index + 1];
  const low = Math.max(a.minSize ?? 10, sum - (b.maxSize ?? 100));
  const high = Math.min(a.maxSize ?? 100, sum - (b.minSize ?? 10));
  const value = Math.max(low, Math.min(high, first));
  return base.map((size, at) => (at === index ? value : at === index + 1 ? sum - value : size));
}

function down(event: PointerEvent) {
  origin = { pointer: props.direction === "horizontal" ? event.clientX : event.clientY, sizes: [...shown()] };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function move(event: PointerEvent, index: number) {
  if (!origin || !root.value) return;
  const box = root.value.getBoundingClientRect();
  const total = props.direction === "horizontal" ? box.width : box.height;
  const delta = (((props.direction === "horizontal" ? event.clientX : event.clientY) - origin.pointer) / total) * 100;
  commit(clampPair(index, origin.sizes[index] + delta, origin.sizes));
}

function onKeydown(event: KeyboardEvent, index: number) {
  const step: Record<string, number> = props.direction === "horizontal" ? { ArrowLeft: -2, ArrowRight: 2 } : { ArrowUp: -2, ArrowDown: 2 };
  const delta = step[event.key];
  if (delta === undefined) return;
  event.preventDefault();
  commit(clampPair(index, shown()[index] + delta, shown()));
}
</script>

<template>
  <div ref="root" :class="['mc-panels', `mc-panels--${direction}`]" role="group" :aria-label="label" :style="{ gridTemplate: direction === 'horizontal' ? `100% / ${shown().map((size) => `minmax(0, ${size}fr)`).join(' ')}` : `${shown().map((size) => `minmax(0, ${size}fr)`).join(' ')} / 100%` }">
    <template v-for="(panel, index) in panels" :key="panel.id">
      <section :class="['mc-panels__panel', classNames?.panel]" :aria-label="panel.label"><slot :name="panel.id" /></section>
      <span
        v-if="index < panels.length - 1"
        :id="`${id}-${index}`"
        :class="['mc-panels__handle', classNames?.handle]"
        role="separator"
        tabindex="0"
        :aria-orientation="direction === 'horizontal' ? 'vertical' : 'horizontal'"
        :aria-label="`Resize ${panel.label}`"
        :aria-valuenow="Math.round(shown()[index])"
        :style="{ [direction === 'horizontal' ? 'left' : 'top']: `${shown().slice(0, index + 1).reduce((sum, size) => sum + size, 0)}%` }"
        @pointerdown="down"
        @pointermove="move($event, index)"
        @pointerup="origin = null"
        @keydown="onKeydown($event, index)"
      />
    </template>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Give the container a height. */
.mc-panels { position: relative; display: grid; overflow: hidden; }
.mc-panels__panel { min-width: 0; min-height: 0; overflow: auto; }
.mc-panels__handle { position: absolute; z-index: 2; display: block; outline: none; touch-action: none; }
.mc-panels--horizontal .mc-panels__handle { top: 0; bottom: 0; width: 14px; margin-left: -7px; cursor: col-resize; } .mc-panels--vertical .mc-panels__handle { left: 0; right: 0; height: 14px; margin-top: -7px; cursor: row-resize; }
.mc-panels__handle::after { content: ""; position: absolute; inset: 50% auto auto 50%; border-radius: 2px; background: var(--border-strong); transform: translate(-50%, -50%); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-panels--horizontal .mc-panels__handle::after { width: 4px; height: 28px; } .mc-panels--vertical .mc-panels__handle::after { width: 28px; height: 4px; }
.mc-panels__handle:hover::after, .mc-panels__handle:focus-visible::after { background: var(--foreground); }
@media (prefers-reduced-motion: reduce) { .mc-panels__handle::after { transition: none; } }
</style>
