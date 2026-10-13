<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref, useId } from "vue";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection };

export type DataColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  numeric?: boolean;
  width?: number | string;
};

const props = withDefaults(
  defineProps<{
    rows: T[];
    columns: DataColumn[];
    rowKey: keyof T | ((row: T) => string);
    caption?: string;
    emptyMessage?: string;
    defaultSort?: SortState;
    selectable?: boolean;
    itemName?: { one: string; other: string };
    /** Extend the inner, named parts of the table: wrapper, th, row or cell. */
    classNames?: { wrapper?: string; th?: string; row?: string; cell?: string };
  }>(),
  { emptyMessage: "Nothing to show yet.", selectable: false, itemName: () => ({ one: "row", other: "rows" }) },
);

const emit = defineEmits<{ sortChange: [sort: SortState] }>();
/** `v-model:selected` binds the selected row keys. A `cell-<column key>` slot renders a column; it gets `{ value, row }`. */
const selected = defineModel<string[]>("selected", { default: () => [] });
const sort = ref<SortState | undefined>(props.defaultSort);
const id = useId();

const keyOf = (row: T) => (typeof props.rowKey === "function" ? props.rowKey(row) : String(row[props.rowKey]));
const compare = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true }));
const sorted = computed(() => (sort.value ? [...props.rows].sort((a, b) => compare(a[sort.value!.key], b[sort.value!.key]) * (sort.value!.direction === "asc" ? 1 : -1)) : props.rows));
const allKeys = computed(() => props.rows.map(keyOf));
const all = computed(() => allKeys.value.length > 0 && allKeys.value.every((key) => selected.value.includes(key)));

function toggleSort(column: DataColumn) {
  if (!column.sortable) return;
  sort.value = { key: column.key, direction: sort.value?.key === column.key && sort.value.direction === "asc" ? "desc" : "asc" };
  emit("sortChange", sort.value);
}

function toggleRow(key: string) {
  selected.value = selected.value.includes(key) ? selected.value.filter((entry) => entry !== key) : [...selected.value, key];
}
</script>

<template>
  <div class="mc-table">
    <div :class="['mc-table__wrap', classNames?.wrapper]">
      <table class="mc-table__table" :aria-describedby="`${id}-count`">
        <caption v-if="caption" class="mc-table__caption">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" class="mc-table__check"><input type="checkbox" aria-label="Select all rows" :checked="all" @change="selected = all ? [] : allKeys" /></th>
            <th v-for="column in columns" :key="column.key" scope="col" :aria-sort="sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : column.sortable ? 'none' : undefined" :class="['mc-table__th', { 'mc-table__num': column.numeric }, classNames?.th]" :style="{ width: typeof column.width === 'number' ? `${column.width}px` : column.width }">
              <button v-if="column.sortable" type="button" @click="toggleSort(column)">{{ column.label }}<span aria-hidden="true">{{ sort?.key === column.key ? (sort.direction === "asc" ? "↑" : "↓") : "↕" }}</span></button>
              <template v-else>{{ column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sorted.length === 0"><td :colspan="columns.length + (selectable ? 1 : 0)" class="mc-table__empty">{{ emptyMessage }}</td></tr>
          <tr v-for="row in sorted" :key="keyOf(row)" :class="['mc-table__row', classNames?.row]" :data-selected="selected.includes(keyOf(row)) || undefined">
            <td v-if="selectable" class="mc-table__check"><input type="checkbox" :aria-label="`Select ${keyOf(row)}`" :checked="selected.includes(keyOf(row))" @change="toggleRow(keyOf(row))" /></td>
            <td v-for="column in columns" :key="column.key" :class="['mc-table__cell', { 'mc-table__num': column.numeric }, classNames?.cell]"><slot :name="`cell-${column.key}`" :value="row[column.key]" :row="row">{{ row[column.key] ?? "" }}</slot></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p :id="`${id}-count`" class="mc-table__count" aria-live="polite">{{ selectable && selected.length ? `${selected.length} of ${rows.length} ${rows.length === 1 ? itemName.one : itemName.other} selected` : `${rows.length} ${rows.length === 1 ? itemName.one : itemName.other}` }}</p>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-table { display: grid; gap: var(--space-2); }
.mc-table__wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-panel); }
.mc-table__table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.mc-table__caption { padding: var(--space-3) var(--space-4); font-weight: 500; text-align: left; }
.mc-table__th { padding: var(--space-3) var(--space-4); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 600; text-align: left; white-space: nowrap; }
.mc-table__th button { display: inline-flex; gap: 6px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; } .mc-table__th button span { color: var(--text-muted); }
.mc-table__cell { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border); }
.mc-table__num { text-align: right; font-variant-numeric: tabular-nums; }
.mc-table__check { width: 44px; padding-left: var(--space-3); }
.mc-table__row[data-selected] { background: var(--surface-muted); }
@media (hover: hover) and (pointer: fine) { .mc-table__row:hover { background: var(--surface-muted); } }
.mc-table__empty { padding: var(--space-4); border-top: 1px solid var(--border); color: var(--text-muted); text-align: center; }
.mc-table__count { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
</style>
