<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { squarify } from "@/lib/chart";

export interface TreemapNode {
  id: string;
  label: string;
  value?: number;
  /** A second measure drawn as colour, such as growth. Negative reads red, positive green. */
  color?: number;
  children?: TreemapNode[];
}

const props = withDefaults(
  defineProps<{
    data: TreemapNode;
    label: string;
    formatValue?: (value: number) => string;
    colorLabel?: string;
    formatColor?: (value: number) => string;
    colorDomain?: [number, number];
    height?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the treemap: cell, crumb or readout. */
    classNames?: { cell?: string; crumb?: string; readout?: string };
  }>(),
  { colorLabel: "Change", colorDomain: () => [-50, 100], height: 240, emptyLabel: "No data yet" },
);

const trail = ref<TreemapNode[]>([props.data]);
const active = ref<string | null>(null);
const box = ref<HTMLElement>();
const width = ref(0);

const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : n.toLocaleString());
const fmtColor = (n: number) => (props.formatColor ? props.formatColor(n) : `${n > 0 ? "+" : ""}${n}%`);
const sum = (node: TreemapNode): number => node.value ?? (node.children ?? []).reduce((total, child) => total + sum(child), 0);
const current = computed(() => trail.value[trail.value.length - 1]);
const children = computed(() => (current.value.children ?? []).filter((child) => sum(child) > 0));
const rects = computed(() => squarify(children.value.map(sum), { x: 0, y: 0, width: width.value || 600, height: props.height }));
const picked = computed(() => children.value.find((child) => child.id === active.value));

function tone(value?: number) {
  if (value === undefined) return undefined;
  const [lo, hi] = props.colorDomain;
  const amount = Math.round(Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value >= 0 ? hi : lo))) * 70) + 10;
  return `color-mix(in oklab, var(${value >= 0 ? "--success" : "--danger"}) ${amount}%, var(--surface))`;
}

function open(child: TreemapNode) {
  if (child.children?.length) trail.value = [...trail.value, child];
  else active.value = active.value === child.id ? null : child.id;
}

// Track the width so cells scale with the container.
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (box.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(([entry]) => (width.value = entry.contentRect.width));
    observer.observe(box.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure class="mc-treemap">
    <nav class="mc-treemap__crumbs" aria-label="Treemap path">
      <button v-for="(node, index) in trail" :key="node.id" type="button" :class="['mc-treemap__crumb', classNames?.crumb]" :aria-current="index === trail.length - 1 ? 'location' : undefined" :disabled="index === trail.length - 1" @click="trail = trail.slice(0, index + 1)">{{ index === 0 ? label : node.label }}</button>
    </nav>
    <p :class="['mc-treemap__readout', classNames?.readout]" aria-live="polite">{{ picked ? `${picked.label}: ${fmt(sum(picked))}${picked.color !== undefined ? ` · ${colorLabel} ${fmtColor(picked.color)}` : ""}` : `${fmt(sum(current))} total` }}</p>
    <p v-if="children.length === 0" class="mc-treemap__empty">{{ emptyLabel }}</p>
    <div v-else ref="box" class="mc-treemap__box" :style="{ height: `${height}px` }">
      <button v-for="(child, index) in children" :key="child.id" type="button" :class="['mc-treemap__cell', classNames?.cell]" :aria-label="`${child.label}, ${fmt(sum(child))}${child.color !== undefined ? `, ${colorLabel} ${fmtColor(child.color)}` : ''}`" :data-active="active === child.id || undefined" :style="{ left: `${rects[index].x}px`, top: `${rects[index].y}px`, width: `${Math.max(0, rects[index].width - 2)}px`, height: `${Math.max(0, rects[index].height - 2)}px`, background: tone(child.color) ?? `color-mix(in oklab, var(--series-${(index % 4) + 1}) 20%, var(--surface))` }" @click="open(child)" @pointerenter="active = child.id" @pointerleave="active = null">
        <span v-if="rects[index].width > 54 && rects[index].height > 32">{{ child.label }}</span>
      </button>
    </div>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-treemap { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-treemap__crumbs { display: flex; flex-wrap: wrap; gap: 6px; }
.mc-treemap__crumb { padding: 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-treemap__crumb:not(:last-child)::after { content: "›"; margin-left: 6px; color: var(--text-muted); }
.mc-treemap__crumb[aria-current] { color: var(--foreground); font-weight: 600; cursor: default; }
.mc-treemap__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-treemap__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-treemap__box { position: relative; }
.mc-treemap__cell { position: absolute; display: flex; align-items: flex-start; padding: 6px; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; color: var(--foreground); font: inherit; font-size: 11px; font-weight: 500; text-align: left; cursor: pointer; transition: left .4s var(--ease-standard), top .4s var(--ease-standard), width .4s var(--ease-standard), height .4s var(--ease-standard); }
.mc-treemap__cell[data-active], .mc-treemap__cell:focus-visible { border-color: var(--foreground); outline: none; }
@media (prefers-reduced-motion: reduce) { .mc-treemap__cell { transition: none; } }
</style>
