<script lang="ts" module>
  export type SortDirection = "asc" | "desc";
  export type SortState = { key: string; direction: SortDirection };

  export type DataColumn = {
    key: string;
    label: string;
    sortable?: boolean;
    numeric?: boolean;
    width?: number | string;
  };
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from "svelte";

  interface Props {
    rows: T[];
    columns: DataColumn[];
    rowKey: keyof T | ((row: T) => string);
    caption?: string;
    emptyMessage?: string;
    defaultSort?: SortState;
    selectable?: boolean;
    itemName?: { one: string; other: string };
    /** The selected row keys. Bind them with `bind:selected`. */
    selected?: string[];
    onsortchange?: (sort: SortState) => void;
    /** Renders a cell. It receives the column key, the value and the row, so branch on the key to customise a column. */
    cell?: Snippet<[{ column: string; value: unknown; row: T }]>;
    /** Extend the inner, named parts of the table: wrapper, th, row or cell. */
    classNames?: { wrapper?: string; th?: string; row?: string; cell?: string };
  }

  let { rows, columns, rowKey, caption, emptyMessage = "Nothing to show yet.", defaultSort, selectable = false, itemName = { one: "row", other: "rows" }, selected = $bindable([]), onsortchange, cell, classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let sort = $state<SortState | undefined>(defaultSort);
  const id = $props.id();

  const keyOf = (row: T) => (typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]));
  const compare = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true }));
  const sorted = $derived(sort ? [...rows].sort((a, b) => compare(a[sort!.key], b[sort!.key]) * (sort!.direction === "asc" ? 1 : -1)) : rows);
  const allKeys = $derived(rows.map(keyOf));
  const all = $derived(allKeys.length > 0 && allKeys.every((key) => selected.includes(key)));

  function toggleSort(column: DataColumn) {
    if (!column.sortable) return;
    sort = { key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" };
    onsortchange?.(sort);
  }

  function toggleRow(key: string) {
    selected = selected.includes(key) ? selected.filter((entry) => entry !== key) : [...selected, key];
  }
</script>

<div class="mc-table">
  <div class={["mc-table__wrap", classNames?.wrapper]}>
    <table class="mc-table__table" aria-describedby="{id}-count">
      {#if caption}<caption class="mc-table__caption">{caption}</caption>{/if}
      <thead>
        <tr>
          {#if selectable}<th class="mc-table__check"><input type="checkbox" aria-label="Select all rows" checked={all} onchange={() => (selected = all ? [] : allKeys)} /></th>{/if}
          {#each columns as column (column.key)}
            <th scope="col" aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : column.sortable ? "none" : undefined} class={["mc-table__th", { "mc-table__num": column.numeric }, classNames?.th]} style:width={typeof column.width === "number" ? `${column.width}px` : column.width}>
              {#if column.sortable}
                <button type="button" onclick={() => toggleSort(column)}>{column.label}<span aria-hidden="true">{sort?.key === column.key ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
              {:else}
                {column.label}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if sorted.length === 0}
          <tr><td colspan={columns.length + (selectable ? 1 : 0)} class="mc-table__empty">{emptyMessage}</td></tr>
        {/if}
        {#each sorted as row (keyOf(row))}
          <tr class={["mc-table__row", classNames?.row]} data-selected={selected.includes(keyOf(row)) || undefined}>
            {#if selectable}<td class="mc-table__check"><input type="checkbox" aria-label="Select {keyOf(row)}" checked={selected.includes(keyOf(row))} onchange={() => toggleRow(keyOf(row))} /></td>{/if}
            {#each columns as column (column.key)}
              <td class={["mc-table__cell", { "mc-table__num": column.numeric }, classNames?.cell]}>{#if cell}{@render cell({ column: column.key, value: row[column.key], row })}{:else}{row[column.key] ?? ""}{/if}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p id="{id}-count" class="mc-table__count" aria-live="polite">{selectable && selected.length ? `${selected.length} of ${rows.length} ${rows.length === 1 ? itemName.one : itemName.other} selected` : `${rows.length} ${rows.length === 1 ? itemName.one : itemName.other}`}</p>
</div>

<style>
:global {
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
}
</style>
