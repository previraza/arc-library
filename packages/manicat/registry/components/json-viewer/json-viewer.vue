<script setup lang="ts">
import { computed } from "vue";

export type JsonValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "other";

const props = withDefaults(
  defineProps<{
    data: unknown;
    rootName?: string;
    /** How many levels are open at first. */
    defaultExpandDepth?: number;
    maxHeight?: string | number;
    label?: string;
    /** Extend the inner, named parts of the viewer: row, key or value. */
    classNames?: { row?: string; key?: string; value?: string };
  }>(),
  { rootName: "root", defaultExpandDepth: 1, label: "JSON" },
);

const emit = defineEmits<{ select: [detail: { path: string; value: unknown; type: JsonValueType }] }>();
const typeOf = (value: unknown): JsonValueType => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "object" ? "object" : typeof value === "string" ? "string" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "other");

function initial(): string[] {
  const out: string[] = [];
  const walk = (value: unknown, path: string, depth: number) => {
    if (typeOf(value) === "object" || typeOf(value) === "array") {
      if (depth < props.defaultExpandDepth) out.push(path);
      Object.entries(value as object).forEach(([key, child]) => walk(child, `${path}.${key}`, depth + 1));
    }
  };
  walk(props.data, "$", 0);
  return out;
}

/** `v-model:expanded` binds the open paths ("$", "$.plan", …). */
const model = defineModel<string[]>("expanded");
// Until the parent binds it, the paths open at first come from `defaultExpandDepth`.
const expanded = computed(() => model.value ?? initial());

interface Row {
  name: string;
  value: unknown;
  path: string;
  depth: number;
  type: JsonValueType;
  branch: boolean;
  size: number;
}

// Flattened to the visible rows, so a long document is one list.
const rows = computed(() => {
  const out: Row[] = [];
  const walk = (name: string, value: unknown, path: string, depth: number) => {
    const type = typeOf(value);
    const branch = type === "object" || type === "array";
    out.push({ name, value, path, depth, type, branch, size: branch ? Object.keys(value as object).length : 0 });
    if (branch && expanded.value.includes(path)) Object.entries(value as object).forEach(([key, child]) => walk(key, child, `${path}.${key}`, depth + 1));
  };
  walk(props.rootName, props.data, "$", 0);
  return out;
});

function activate(row: Row) {
  if (row.branch) model.value = expanded.value.includes(row.path) ? expanded.value.filter((path) => path !== row.path) : [...expanded.value, row.path];
  emit("select", { path: row.path, value: row.value, type: row.type });
}

const preview = (row: Row) => (row.branch ? (expanded.value.includes(row.path) ? (row.type === "array" ? "[" : "{") : `${row.type === "array" ? "[…]" : "{…}"} ${row.size} ${row.size === 1 ? "item" : "items"}`) : row.type === "string" ? `"${String(row.value)}"` : String(row.value));
</script>

<template>
  <div class="mc-json" role="tree" :aria-label="label" :style="{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }">
    <div v-for="row in rows" :key="row.path" role="treeitem" :aria-level="row.depth + 1" :aria-expanded="row.branch ? expanded.includes(row.path) : undefined" tabindex="0" :class="['mc-json__row', classNames?.row]" :style="{ paddingLeft: `${row.depth * 14}px` }" @click="activate(row)" @keydown.enter.prevent="activate(row)" @keydown.space.prevent="activate(row)">
      <span class="mc-json__chevron" aria-hidden="true">{{ row.branch ? (expanded.includes(row.path) ? "▾" : "▸") : "" }}</span>
      <span :class="['mc-json__key', classNames?.key]">{{ row.name }}</span><span class="mc-json__colon">: </span>
      <span :class="['mc-json__value', `mc-json__value--${row.type}`, classNames?.value]">{{ preview(row) }}</span>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-json { overflow: auto; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.mc-json__row { display: flex; align-items: flex-start; min-height: 24px; padding-block: 2px; border-radius: 6px; cursor: default; outline: none; }
@media (hover: hover) and (pointer: fine) { .mc-json__row:hover { background: var(--surface-muted); } }
.mc-json__row:focus-visible { background: var(--surface-muted); }
.mc-json__chevron { width: 14px; flex: 0 0 auto; color: var(--text-muted); }
.mc-json__key { color: var(--foreground); } .mc-json__colon { color: var(--text-muted); }
.mc-json__value--string { color: var(--success); } .mc-json__value--number { color: var(--series-1, var(--accent)); } .mc-json__value--boolean { color: var(--warning); } .mc-json__value--null, .mc-json__value--object, .mc-json__value--array { color: var(--text-muted); }
</style>
