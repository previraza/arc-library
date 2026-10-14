<script setup lang="ts">
// @manicat-dependencies motion
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, watch } from "vue";
import WaffleChartRolling from "@/registry/components/waffle-chart/waffle-chart-rolling.vue";
import { SHADES, SHAPES, allocate, clamp, createWaffleMotion, grouped, reassign, GAP } from "@/lib/waffle-chart";
import type { Cell, WaffleCategory } from "@/lib/waffle-chart";
import { createTooltipFollow } from "@/lib/slope-chart";

export type { WaffleCategory };
type Pointer = { key: string; slot: number } | null;

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Categories in fill order. The first fills from the bottom-left corner, column by column. */
    data: WaffleCategory[];
    /** What the whole is, such as "Electricity generation, 2023". Names the chart for assistive technology. */
    label: string;
    /** Unit after each raw value in the tooltip and table, such as "TWh". */
    unit?: string;
    formatValue?: (value: number, category: WaffleCategory) => string;
    /** Grid rows. rows × columns cells make the whole; 10 × 10 means one cell per percent. */
    rows?: number;
    columns?: number;
    /** The category painted in the accent. Pass null to keep every category neutral. Defaults to the first category. */
    accentKey?: string | null;
    defaultActiveKey?: string | null;
    /** Category list with shares that roll to their new value. */
    legend?: boolean;
    /** Decimal places for shares. */
    decimals?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the waffle chart: body, board, grid, cell, tooltip, tipRow, tipSwatch, tipName, tipValue, tipMeta, message, legend, item, swatch, itemLabel or itemShare. */
    classNames?: Record<string, string | undefined>;
  }>(),
  { unit: "", rows: 10, columns: 10, accentKey: undefined, defaultActiveKey: null, legend: true, decimals: 0, emptyLabel: "No data" },
);

/** `v-model:active-key` binds the focused category. Others dim while one is focused. */
const activeModel = defineModel<string | null>("activeKey", { default: undefined });
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const figure = ref<HTMLElement>();
const grid = ref<HTMLElement>();
const tip = ref<HTMLElement>();
const seen = ref(reduced);
const side = ref(0);
let motion: ReturnType<typeof createWaffleMotion> | undefined;
let follow: ReturnType<typeof createTooltipFollow> | undefined;
let resize: ResizeObserver | undefined;
let observer: IntersectionObserver | undefined;

const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const count = computed(() => Math.max(1, props.rows * props.columns));
const total = computed(() => props.data.reduce((sum, item) => sum + Math.max(0, item.value), 0));
const empty = computed(() => !props.data.length || total.value <= 0);
const accent = computed(() => (props.accentKey === undefined ? (props.data[0]?.key ?? null) : props.accentKey));

// Cells are persistent objects; each data change reassigns them so they travel instead of repainting.
const signature = computed(() => `${count.value}|${props.data.map((item) => `${item.key}:${item.value}`).join(",")}`);
const counts = computed(() => allocate(props.data, total.value, count.value));
const layout = ref({ cells: reassign(Array.from({ length: count.value }, (_, id) => ({ id, key: null, slot: id })), props.data, counts.value), moved: new Set<number>(), version: 0 });
watch(signature, () => {
  const base = Array.from({ length: count.value }, (_, id) => layout.value.cells[id] ?? { id, key: null, slot: id });
  const next = reassign(base, props.data, counts.value);
  layout.value = { cells: next, moved: new Set(next.filter((cell) => base[cell.id].slot !== cell.slot || base[cell.id].key !== cell.key).map((cell) => cell.id)), version: layout.value.version + 1 };
}, { flush: "sync" });
const cells = computed(() => layout.value.cells);

const ownActive = ref<string | null>(props.defaultActiveKey);
const pinned = computed(() => (activeModel.value !== undefined ? activeModel.value : ownActive.value));
const setPinned = (key: string | null) => { ownActive.value = key; activeModel.value = key; };
const pointer = ref<Pointer>(null);
const preview = ref<string | null>(null);
const focusKey = computed(() => pointer.value?.key ?? preview.value ?? pinned.value);
const active = computed(() => (focusKey.value && props.data.some((item) => item.key === focusKey.value) ? focusKey.value : null));

const size = computed(() => (side.value ? (side.value - GAP * (props.columns - 1)) / props.columns : 0));
const height = computed(() => (size.value ? size.value * props.rows + GAP * (props.rows - 1) : 0));
const place = (slot: number) => ({ x: Math.floor(slot / props.rows) * (size.value + GAP), y: (props.rows - 1 - (slot % props.rows)) * (size.value + GAP) });

const colorOf = (key: string | null) => {
  if (key === null) return "transparent";
  const index = props.data.findIndex((item) => item.key === key);
  const item = props.data[index];
  if (!item) return "transparent";
  if (item.color) return item.color;
  if (key === accent.value) return "var(--series-1)";
  const rank = props.data.filter((entry) => entry.key !== accent.value).findIndex((entry) => entry.key === key);
  return rank < 3 ? `var(--series-${rank + 2})` : `color-mix(in oklab, var(--foreground) ${SHADES[(rank - 3) % SHADES.length]}%, var(--surface))`;
};
const shapeOf = (key: string | null) => {
  if (key === null || key === accent.value) return "square";
  const rank = props.data.filter((entry) => entry.key !== accent.value).findIndex((entry) => entry.key === key);
  return rank < 0 ? "square" : SHAPES[rank % SHAPES.length];
};

const format = (value: number, item: WaffleCategory) => `${props.formatValue ? props.formatValue(value, item) : grouped.format(value)}${props.unit ? ` ${props.unit}` : ""}`;
const share = (item: WaffleCategory) => (total.value > 0 ? (Math.max(0, item.value) / total.value) * 100 : 0);
const reading = computed(() => (pointer.value ? (props.data.find((item) => item.key === pointer.value!.key) ?? null) : null));
const announce = computed(() => (reading.value ? `${reading.value.label}, ${share(reading.value).toFixed(props.decimals)}%, ${format(reading.value.value, reading.value)}` : ""));
const summary = computed(() => (empty.value ? `${props.label}. ${props.emptyLabel}.` : `${props.label}. ${props.data.map((item) => `${item.label} ${share(item).toFixed(props.decimals)}%`).join(", ")}.`));

const slotAt = (clientX: number, clientY: number) => {
  const box = grid.value?.getBoundingClientRect();
  if (!box || !size.value) return null;
  const col = clamp(Math.floor((clientX - box.left) / (size.value + GAP)), 0, props.columns - 1);
  const row = clamp(Math.floor((clientY - box.top) / (size.value + GAP)), 0, props.rows - 1);
  return col * props.rows + (props.rows - 1 - row);
};
const pointAt = (slot: number | null): Pointer => {
  if (slot === null) return null;
  const cell = cells.value.find((item) => item.slot === slot);
  return cell?.key ? { key: cell.key, slot } : null;
};

// Arrows walk the grid cell by cell; Page keys jump between categories.
function onKeydown(event: KeyboardEvent) {
  if (empty.value) return;
  if (event.key === "Escape" && pointer.value) { event.preventDefault(); pointer.value = null; return; }
  const filled = cells.value.filter((cell) => cell.key !== null).length;
  const at = pointer.value?.slot ?? 0;
  const col = Math.floor(at / props.rows);
  const row = at % props.rows;
  const blocks = counts.value.map((blockSize, index) => ({ start: counts.value.slice(0, index).reduce((sum, value) => sum + value, 0), size: blockSize })).filter((block) => block.size > 0);
  const block = Math.max(0, blocks.findIndex((item) => at >= item.start && at < item.start + item.size));
  const moves: Record<string, () => number> = {
    ArrowUp: () => col * props.rows + Math.min(props.rows - 1, row + 1),
    ArrowDown: () => col * props.rows + Math.max(0, row - 1),
    ArrowRight: () => Math.min(props.columns - 1, col + 1) * props.rows + row,
    ArrowLeft: () => Math.max(0, col - 1) * props.rows + row,
    PageDown: () => blocks[Math.min(blocks.length - 1, block + 1)].start,
    PageUp: () => (at > blocks[block].start ? blocks[block].start : blocks[Math.max(0, block - 1)].start),
    Home: () => 0,
    End: () => filled - 1,
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  pointer.value = pointAt(clamp(pointer.value ? move() : 0, 0, Math.max(0, filled - 1)));
}

onMounted(() => {
  const node = grid.value!;
  const read = () => (side.value = node.clientWidth);
  read();
  resize = new ResizeObserver(read);
  resize.observe(node);
  motion = createWaffleMotion(node, { reduced, rows: props.rows });
  follow = createTooltipFollow(tip.value!, reduced, { stiffness: 520, damping: 44 });
  if (!reduced) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer?.disconnect();
      seen.value = true;
    }, { threshold: 0.35 });
    observer.observe(figure.value!);
  }
});
onBeforeUnmount(() => {
  resize?.disconnect();
  observer?.disconnect();
});

// Cells fly between blocks; the tooltip glides between cells on its own spring and stays inside the figure.
function sync() {
  if (size.value) motion?.update(cells.value, { size: size.value, visible: seen.value, moved: layout.value.moved, version: layout.value.version });
  const bubble = tip.value;
  const host = figure.value;
  const board = grid.value;
  if (!pointer.value || !bubble || !host || !board || !size.value) return follow?.hide();
  const hostBox = host.getBoundingClientRect();
  const boardBox = board.getBoundingClientRect();
  const { x, y } = place(pointer.value.slot);
  const cx = boardBox.left - hostBox.left + x + size.value / 2;
  const cy = boardBox.top - hostBox.top + y;
  const tw = bubble.offsetWidth;
  const th = bubble.offsetHeight;
  let top = cy - th - 10;
  if (top < 0) top = cy + size.value + 10;
  const left = clamp(cx - tw / 2, 0, Math.max(0, hostBox.width - tw));
  follow?.to(left, clamp(top, 0, Math.max(0, hostBox.height - th)));
}
onUpdated(sync);
watch([seen, size], async () => { await nextTick(); sync(); }, { flush: "post" });
</script>

<template>
  <figure ref="figure" v-bind="{ ...attrs, class: undefined }" :class="['mc-waffle-chart__figure', attrs.class as string | undefined]" :aria-label="label" :data-legend="legend || undefined">
    <div :class="cn('mc-waffle-chart__body', 'body')">
      <div :class="cn('mc-waffle-chart__board', 'board')">
        <div ref="grid" :class="cn('mc-waffle-chart__grid', 'grid')" :style="{ height: height ? `${height}px` : undefined, aspectRatio: height ? undefined : `${columns} / ${rows}` }" :data-active="active ? true : undefined" role="group" :tabindex="empty ? -1 : 0" aria-roledescription="waffle chart" :aria-label="`${label}. ${count} cells. Use arrow keys to move between cells, Page Up and Page Down to jump between categories.`" @pointermove="(event) => { if (event.pointerType === 'mouse' || event.buttons) pointer = pointAt(slotAt(event.clientX, event.clientY)); }" @pointerdown="(event) => { if (event.pointerType !== 'mouse') (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId); pointer = pointAt(slotAt(event.clientX, event.clientY)); }" @pointerup="(event) => { if (event.pointerType !== 'mouse') pointer = null; }" @pointercancel="pointer = null" @pointerleave="(event) => { if (event.pointerType === 'mouse') pointer = null; }" @keydown="onKeydown" @blur="pointer = null" @focus="(event) => { if ((event.currentTarget as HTMLElement).matches(':focus-visible') && !empty) pointer = pointer ?? pointAt(0); }">
          <template v-if="size > 0">
            <span v-for="cell in cells" :key="cell.id" :class="cn('mc-waffle-chart__cell', 'cell')" aria-hidden="true" :data-cell="cell.id" :data-on="(cell.key !== null && cell.key === active) || undefined" :data-cursor="pointer?.slot === cell.slot || undefined" :data-empty="cell.key === null || undefined" :data-shape="shapeOf(cell.key)" :style="{ width: `${size}px`, height: `${size}px`, '--cell': colorOf(cell.key), '--delay': `${reduced ? 0 : (cell.slot / count) * 0.32}s` }" />
          </template>
        </div>
        <div v-if="!empty" ref="tip" :class="cn('mc-waffle-chart__tooltip', 'tooltip')" :data-shown="pointer ? true : undefined" aria-hidden="true">
          <p :class="cn('mc-waffle-chart__tipRow', 'tipRow')">
            <span :class="cn('mc-waffle-chart__tipSwatch', 'tipSwatch')" :data-shape="shapeOf(reading?.key ?? null)" :style="{ '--cell': colorOf(reading?.key ?? null) }" />
            <span :class="cn('mc-waffle-chart__tipName', 'tipName')">{{ reading?.label ?? "" }}</span>
            <span :class="cn('mc-waffle-chart__tipValue', 'tipValue')">{{ reading ? `${share(reading).toFixed(decimals)}%` : "" }}</span>
          </p>
          <p :class="cn('mc-waffle-chart__tipMeta', 'tipMeta')">{{ reading ? format(reading.value, reading) : "" }}</p>
        </div>
        <p v-if="empty" :class="cn('mc-waffle-chart__message', 'message')">{{ emptyLabel }}</p>
      </div>
      <ul v-if="legend && !empty" :class="cn('mc-waffle-chart__legend', 'legend')" :aria-label="`${label} categories`" @pointerleave="preview = null">
        <li v-for="item in data" :key="item.key">
          <button type="button" :class="cn('mc-waffle-chart__item', 'item')" :aria-pressed="pinned === item.key" :data-on="active === item.key || undefined" :data-dim="(active !== null && active !== item.key) || undefined" @click="setPinned(pinned === item.key ? null : item.key)" @pointerenter="(event) => { if (event.pointerType === 'mouse') preview = item.key; }" @focus="(event) => { if ((event.currentTarget as HTMLElement).matches(':focus-visible')) preview = item.key; }" @blur="preview = null">
            <span :class="cn('mc-waffle-chart__swatch', 'swatch')" :data-shape="shapeOf(item.key)" :style="{ '--cell': colorOf(item.key) }" aria-hidden="true" />
            <span :class="cn('mc-waffle-chart__itemLabel', 'itemLabel')">{{ item.label }}</span>
            <span :class="cn('mc-waffle-chart__itemShare', 'itemShare')"><WaffleChartRolling :value="share(item)" :decimals="decimals" /></span>
          </button>
        </li>
      </ul>
    </div>
    <p class="mc-waffle-chart__srOnly" aria-live="polite" aria-atomic="true">{{ announce }}</p>
    <p class="mc-waffle-chart__srOnly">{{ summary }}</p>
    <div v-if="!empty" class="mc-waffle-chart__srOnly"><table>
      <caption>{{ label }}</caption>
      <thead><tr><th scope="col">Category</th><th scope="col">Value</th><th scope="col">Share</th><th scope="col">Cells</th></tr></thead>
      <tbody><tr v-for="(item, index) in data" :key="item.key"><th scope="row">{{ item.label }}</th><td>{{ format(item.value, item) }}</td><td>{{ share(item).toFixed(decimals) }}%</td><td>{{ counts[index] }}</td></tr></tbody>
    </table></div>
  </figure>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-waffle-chart__figure { position: relative; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); container-type: inline-size; }

/* Series colors (--series-1 to --series-4) come from registry/foundation.mc-waffle-chart__css. */
.mc-waffle-chart__body { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr); align-items: center; gap: var(--space-6); }
@container (min-width: 420px) {
  .mc-waffle-chart__figure[data-legend] .mc-waffle-chart__body { grid-template-columns: minmax(0, 232px) minmax(0, 1fr); gap: var(--space-6); }
}

.mc-waffle-chart__board { min-width: 0; }
.mc-waffle-chart__grid { position: relative; width: 100%; max-width: 300px; margin-inline: auto; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: default; }

/* Each cell is one unit. Its colour changes mid-flight with the same stagger as its travel. */
.mc-waffle-chart__cell { --inner: 0 0 0 0 transparent; --outer: 0 0 0 0 transparent; position: absolute; top: 0; left: 0; border-radius: 22%; background: var(--cell); box-shadow: var(--inner), var(--outer); will-change: transform; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), box-shadow var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__grid[data-active] .mc-waffle-chart__cell:not([data-on]) { opacity: .26 !important; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-standard) var(--ease-standard); }
.mc-waffle-chart__cell[data-cursor] { --outer: 0 0 0 2px var(--surface), 0 0 0 3.5px color-mix(in oklab, var(--foreground) 55%, transparent); }

/* Shape is the colour-free second channel: a cell morphs between these as it changes category. */
.mc-waffle-chart__cell[data-shape="round"], .mc-waffle-chart__swatch[data-shape="round"], .mc-waffle-chart__tipSwatch[data-shape="round"] { border-radius: 50%; }
.mc-waffle-chart__cell[data-shape="framed"] { --inner: inset 0 0 0 2.5px var(--cell), inset 0 0 0 3.25px var(--surface); }
.mc-waffle-chart__swatch[data-shape="framed"], .mc-waffle-chart__tipSwatch[data-shape="framed"] { box-shadow: inset 0 0 0 2px var(--cell), inset 0 0 0 3px var(--surface); }

.mc-waffle-chart__tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 150px; max-width: min(240px, 100%); gap: 2px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__tooltip[data-shown] { opacity: 1; scale: 1; }
.mc-waffle-chart__tipRow { display: flex; min-width: 0; align-items: center; gap: 8px; margin: 0; font-size: var(--text-sm); line-height: 1.3; }
.mc-waffle-chart__tipSwatch { width: 10px; height: 10px; flex: none; border-radius: 3px; background: var(--cell); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-waffle-chart__tipName { min-width: 0; flex: 1; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.mc-waffle-chart__tipValue { flex: none; margin-left: 8px; font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-waffle-chart__tipMeta { margin: 0 0 0 18px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; white-space: nowrap; }

.mc-waffle-chart__message { display: grid; min-height: 160px; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }

/* The legend doubles as the reading: each share rolls to its new value. */
.mc-waffle-chart__legend { display: grid; min-width: 0; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 2px var(--space-2); margin: 0; padding: 0; list-style: none; }
@container (min-width: 420px) { .mc-waffle-chart__figure[data-legend] .mc-waffle-chart__legend { grid-template-columns: minmax(0, 1fr); } }
/* Below the side-by-side layout two columns would clip names like "Wind and solar", so the legend reads as one list. */
/* Stacked, the legend shares the grid's measure and its row padding hangs outside, so swatches and shares line up with the cell edges. */
@container (max-width: 419px) { .mc-waffle-chart__legend { grid-template-columns: minmax(0, 1fr); margin-inline: max(-10px, calc((100% - 320px) / 2)); } }
.mc-waffle-chart__item { display: grid; width: 100%; min-height: 36px; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 4px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); text-align: left; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-waffle-chart__item:active { transform: scale(.98); }
.mc-waffle-chart__item[data-on] { color: var(--foreground); background: color-mix(in oklab, var(--foreground) 5%, transparent); }
.mc-waffle-chart__item[data-dim] { opacity: .5; }
.mc-waffle-chart__item[aria-pressed="true"] { color: var(--foreground); }
@media (hover: hover) and (pointer: fine) { .mc-waffle-chart__item:hover { color: var(--foreground); } }
.mc-waffle-chart__swatch { width: 10px; height: 10px; border-radius: 3px; background: var(--cell); }
.mc-waffle-chart__itemLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-waffle-chart__itemShare { color: var(--foreground); font-size: var(--text-base); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; min-width: 3.2em; }

.mc-waffle-chart__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-waffle-chart__cell, .mc-waffle-chart__grid[data-active] .mc-waffle-chart__cell:not([data-on]), .mc-waffle-chart__tooltip, .mc-waffle-chart__tipSwatch, .mc-waffle-chart__item { transition: none; }
}
</style>
