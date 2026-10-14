<script lang="ts" module>
  export type { SortDirection, SortState } from "@/lib/sortable-data-table";

  export type DataColumn = {
    key: string;
    label: string;
    sortable?: boolean;
    /** Right-aligns the column with tabular numerals. Detected when every value is a number. */
    numeric?: boolean;
    /** Fixed width such as 120 or "20%". Other columns are measured once and held, so sorting never reflows them. */
    width?: number | string;
  };
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  // @manicat-dependencies motion
  import type { Snippet } from "svelte";
  import { onMount, untrack } from "svelte";
  import SortableDataTableSwap from "@/registry/components/sortable-data-table/sortable-data-table-swap.svelte";
  import SortableDataTableGlyph from "@/registry/components/sortable-data-table/sortable-data-table-glyph.svelte";
  import SortableDataTableSelect from "@/registry/components/sortable-data-table/sortable-data-table-select.svelte";
  import { createFlip, pressAction, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";
  import { measureBand, measureWidths, numericKeys, revealSorted, sortRows, tableKeys } from "@/lib/sortable-data-table";
  import type { SortState } from "@/lib/sortable-data-table";

  interface Props {
    rows: T[];
    columns: DataColumn[];
    rowKey: keyof T | ((row: T) => string);
    caption?: string;
    emptyMessage?: string;
    /** Sort applied on the first render. */
    defaultSort?: SortState;
    /** Adds a checkbox column, row click selection, and a count line with a clear action. */
    selectable?: boolean;
    /** The selected row keys. Bind them with `bind:selected`. */
    selected?: string[];
    defaultSelected?: string[];
    /** Noun for the count line, as in "6 projects". */
    itemName?: { one: string; other: string };
    onsortchange?: (sort: SortState) => void;
    /** Renders a cell. It receives the column key, the value and the row, so branch on the key to customise a column. */
    cell?: Snippet<[{ column: string; value: unknown; row: T }]>;
    /** Extend the inner, named parts of the sortable data table: wrapper, table, selectCol, sortButton, sortInner, selectCell, number, clear, band. */
    classNames?: { wrapper?: string; table?: string; selectCol?: string; sortButton?: string; sortInner?: string; selectCell?: string; number?: string; clear?: string; band?: string };
    class?: string;
    [key: string]: unknown;
  }

  let { rows, columns, rowKey, caption = "Data table", emptyMessage = "No rows to show", defaultSort, selectable = false, selected = $bindable(), defaultSelected, itemName = { one: "row", other: "rows" }, onsortchange, cell, classNames, class: className, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

  let root = $state<HTMLElement>();
  let tableRef = $state<HTMLTableElement>();
  let tbody = $state<HTMLElement>();
  let selectAll = $state<HTMLInputElement>();
  let anchor: string | null = null;
  let sort = $state.raw<SortState | null>(defaultSort ?? null);
  let announcement = $state("");
  let internalSelection = $state<string[]>(defaultSelected ?? []);
  const selection = $derived(new Set(selected ?? internalSelection));

  const sortedRows = $derived(sortRows(rows, sort));
  const numeric = $derived(numericKeys(columns, rows));
  const getRowKey = (row: T) => String(typeof rowKey === "function" ? rowKey(row) : row[rowKey]);
  const keys = $derived(sortedRows.map(getRowKey));
  const order = $derived(keys.join("\u0000"));
  const selectedCount = $derived(keys.filter((key) => selection.has(key)).length);
  const allSelected = $derived(keys.length > 0 && selectedCount === keys.length);

  // Rows slide to their new place on a spring when the order changes.
  const flip = createFlip(() => [...(tbody?.querySelectorAll<HTMLElement>(":scope > tr") ?? [])], { reduced, spring: "smooth" });
  $effect.pre(() => {
    void order;
    flip.measure();
  });
  $effect(() => {
    void order;
    flip.play();
  });

  // Measure the natural column widths once, then hold them with a fixed layout so nothing reflows while rows move.
  const signature = $derived([selectable ? "select" : "", ...columns.map((column) => column.key)].join("\u0000"));
  let locked = $state.raw<{ signature: string; widths: Record<string, number> } | null>(null);
  const widths = $derived(locked?.signature === signature ? locked.widths : null);
  $effect(() => {
    void signature;
    void widths;
    const table = tableRef;
    if (!table) return;
    return untrack(() => {
      if (widths) return;
      let observer: ResizeObserver | undefined;
      let alive = true;
      const measure = () => {
        const next = measureWidths(table);
        if (next) locked = { signature, widths: next };
        return Boolean(next);
      };
      // Measured once the fonts are in, so the held widths are those of the real text and not of a fallback.
      void table.getBoundingClientRect();
      void document.fonts.ready.then(() => {
        if (!alive || measure()) return;
        observer = new ResizeObserver(() => { if (measure()) observer?.disconnect(); });
        observer.observe(table);
      });
      return () => { alive = false; observer?.disconnect(); };
    });
  });

  // A still tint under the sorted column fills the gaps that open while rows pass each other.
  let band = $state.raw<{ left: number; width: number } | null>(null);
  let seenSort = false;
  $effect(() => {
    void widths;
    const table = tableRef;
    const key = sort?.key;
    return untrack(() => {
      const update = () => {
        const next = measureBand(table, key);
        if (!next ? band !== null : band?.left !== next.left || band.width !== next.width) band = next;
      };
      update();
      if (!table || !key) return;
      revealSorted(table, key, !(reduced || !seenSort));
      seenSort = true;
      const observer = new ResizeObserver(update);
      observer.observe(table);
      return () => observer.disconnect();
    });
  });

  const shownCount = $derived(selectedCount || keys.length);
  const noun = $derived(selectedCount ? "selected" : keys.length === 1 ? itemName.one : itemName.other);
  let countDirection = $state(1);
  let lastCount = untrack(() => shownCount);
  $effect.pre(() => {
    const now = shownCount;
    if (now !== lastCount) {
      countDirection = now > lastCount ? 1 : -1;
      lastCount = now;
    }
  });

  function sortBy(column: DataColumn) {
    const next: SortState = { key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" };
    sort = next;
    onsortchange?.(next);
    announcement = `Sorted by ${column.label}, ${next.direction === "asc" ? "ascending" : "descending"}`;
  }

  function commit(next: Set<string>) {
    const list = keys.filter((key) => next.has(key));
    internalSelection = list;
    selected = list;
    announcement = list.length ? `${list.length} of ${keys.length} selected` : "Selection cleared";
  }

  function toggleRow(key: string, extend: boolean) {
    const next = new Set(selection);
    const checked = !selection.has(key);
    const from = extend && anchor ? keys.indexOf(anchor) : -1;
    const to = keys.indexOf(key);
    (from < 0 ? [key] : keys.slice(Math.min(from, to), Math.max(from, to) + 1)).forEach((item) => (checked ? next.add(item) : next.delete(item)));
    anchor = key;
    commit(next);
  }

  function clearSelection() {
    commit(new Set());
    selectAll?.focus();
  }

  function onRowClick(event: MouseEvent & { currentTarget: HTMLElement }, key: string) {
    if (!selectable || (event.target as HTMLElement).closest("a, button, input, label, select, textarea, [role='button'], [contenteditable='true']") || window.getSelection()?.toString()) return;
    toggleRow(key, event.shiftKey);
    // Keep the keyboard path where the pointer left off, so arrows continue from this row.
    event.currentTarget.querySelector<HTMLInputElement>("input[type='checkbox']")?.focus({ preventScroll: true });
  }

  function onKeydown(event: KeyboardEvent) {
    tableKeys(event, root!, { selectAll, selected: selectedCount, clear: () => commit(new Set()), clearFromButton: clearSelection });
  }

  // The clear action blurs and scales in, and leaves a little faster.
  const { blur, duration } = motionTokens;
  const clearIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, blur: blur.soft }, { opacity: 1, scale: 1, blur: 0 }, { duration: reduced ? duration.instant : duration.standard, ease: "enter" })(node);
  const clearOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { duration: reduced ? duration.instant : duration.fast, ease: "standard" })(node);
  onMount(() => void 0);
</script>

<div bind:this={root} {...rest} class={cn("mc-sortable-data-table__wrapper", className, classNames?.wrapper)} onkeydown={onKeydown} role="presentation">
  <div class="mc-sortable-data-table__scroller">
    {#if band}<span class={cn("mc-sortable-data-table__band", classNames?.band)} style:left={`${band.left}px`} style:width={`${band.width}px`} aria-hidden="true"></span>{/if}
    <table bind:this={tableRef} role="table" class={cn("mc-sortable-data-table__table", classNames?.table)} data-fixed={widths ? "" : undefined} data-selectable={selectable || undefined}>
      <caption>{caption}</caption>
      <colgroup>
        {#if selectable}<col class={cn("mc-sortable-data-table__selectCol", classNames?.selectCol)} />{/if}
        {#each columns as column, index (column.key)}
          <col style:width={column.width !== undefined ? (typeof column.width === "number" ? `${column.width}px` : column.width) : widths && index > 0 ? `${widths[column.key]}%` : undefined} />
        {/each}
      </colgroup>
      <thead role="rowgroup">
        <tr role="row">
          {#if selectable}
            <th scope="col" role="columnheader" class={cn("mc-sortable-data-table__selectCell", classNames?.selectCell)}>
              <SortableDataTableSelect bind:input={selectAll} checked={allSelected} mixed={selectedCount > 0 && !allSelected} label="Select all rows" nav="head" ontoggle={() => commit(allSelected ? new Set() : new Set(keys))} />
            </th>
          {/if}
          {#each columns as column, index (column.key)}
            {@const active = sort?.key === column.key}
            {@const sortable = column.sortable !== false}
            <th scope="col" role="columnheader" data-key={column.key} data-primary={index === 0 || undefined} data-sorted={active || undefined} data-numeric={numeric.has(column.key) || undefined} data-sortable={sortable || undefined} aria-sort={!sortable ? undefined : active ? (sort?.direction === "asc" ? "ascending" : "descending") : "none"}>
              {#if sortable}
                <button class={cn("mc-sortable-data-table__sortButton", classNames?.sortButton)} type="button" data-nav="head" aria-label={`Sort by ${column.label}${active ? `, currently ${sort?.direction === "asc" ? "ascending" : "descending"}` : ""}`} onclick={() => sortBy(column)}>
                  <span class={cn("mc-sortable-data-table__sortInner", classNames?.sortInner)}><span>{column.label}</span><SortableDataTableGlyph {active} descending={active && sort?.direction === "desc"} /></span>
                </button>
              {:else}{column.label}{/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody bind:this={tbody} role="rowgroup">
        {#if sortedRows.length}
          {#each sortedRows as row, index (keys[index])}
            {@const key = keys[index]}
            <tr role="row" data-selected={(selectable && selection.has(key)) || undefined} onclick={(event) => onRowClick(event, key)} onmousedown={(event) => { if (selectable && event.shiftKey) event.preventDefault(); }}>
              {#if selectable}
                <td role="cell" class={cn("mc-sortable-data-table__selectCell", classNames?.selectCell)}>
                  <SortableDataTableSelect checked={selection.has(key)} label={`Select ${String(row[columns[0]?.key] ?? key)}`} nav="row" ontoggle={(extend) => toggleRow(key, extend)} />
                </td>
              {/if}
              {#each columns as column, columnIndex (column.key)}
                <td role="cell" data-label={column.label} data-primary={columnIndex === 0 || undefined} data-sorted={sort?.key === column.key || undefined} data-numeric={numeric.has(column.key) || undefined}>{#if cell}{@render cell({ column: column.key, value: row[column.key], row })}{:else}{String(row[column.key] ?? "–")}{/if}</td>
              {/each}
            </tr>
          {/each}
        {:else}
          <tr role="row"><td role="cell" class="mc-sortable-data-table__empty" colspan={columns.length + (selectable ? 1 : 0)}>{emptyMessage}</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
  {#if selectable}
    <div class="mc-sortable-data-table__footer">
      <span class="mc-sortable-data-table__srOnly">{shownCount} {noun}</span>
      <span class="mc-sortable-data-table__count" data-active={selectedCount > 0 || undefined} aria-hidden="true">
        <SortableDataTableSwap class={cn("mc-sortable-data-table__number", classNames?.number)} value={String(shownCount)} direction={countDirection} />
        <SortableDataTableSwap value={noun} direction={selectedCount ? 1 : -1} />
      </span>
      {#if selectedCount}
        <button type="button" class={cn("mc-sortable-data-table__clear", classNames?.clear)} data-clear="" onclick={clearSelection} in:clearIn out:clearOut use:pressAction={{ scale: 0.97 }}>Clear selection</button>
      {/if}
    </div>
  {/if}
  <p class="mc-sortable-data-table__srOnly" role="status">{announcement}</p>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Cells are opaque so rows passing each other during a sort cover one another cleanly instead of blending text. */
.mc-sortable-data-table__wrapper { --column-tint: var(--surface-muted); position: relative; width: 100%; min-width: 0; max-width: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font-family: var(--font-body); }
.mc-sortable-data-table__scroller { position: relative; overflow-x: auto; overscroll-behavior-x: contain; }
.mc-sortable-data-table__band { position: absolute; top: 0; bottom: 0; background: var(--column-tint); pointer-events: none; }
.mc-sortable-data-table__table { position: relative; z-index: 1; width: 100%; min-width: 560px; border-collapse: separate; border-spacing: 0; font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); text-align: left; }
.mc-sortable-data-table__table[data-fixed] { table-layout: fixed; }
.mc-sortable-data-table__table caption, .mc-sortable-data-table__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-sortable-data-table__selectCol { width: 44px; }

.mc-sortable-data-table__table th, .mc-sortable-data-table__table td { --cell-base: var(--surface); --cell-fill: var(--cell-base); background-color: var(--cell-fill); transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard); }
.mc-sortable-data-table__table th[data-sorted], .mc-sortable-data-table__table td[data-sorted] { --cell-base: var(--column-tint); }
.mc-sortable-data-table__table th { height: 44px; padding: 0 var(--space-4); border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: var(--text-sm); font-weight: 500; text-align: left; white-space: nowrap; }
.mc-sortable-data-table__table th[data-sortable] { padding: 0; }
.mc-sortable-data-table__table th[data-sorted] { color: var(--foreground); }
.mc-sortable-data-table__table td { height: 52px; padding: 0 var(--space-4); border-bottom: 1px solid var(--border-subtle); color: var(--foreground); font-weight: 400; vertical-align: middle; overflow-wrap: anywhere; }
.mc-sortable-data-table__table tbody tr:last-child td { border-bottom: 0; }
.mc-sortable-data-table__table [data-numeric] { text-align: right; font-variant-numeric: tabular-nums; }
.mc-sortable-data-table__table[data-selectable] tbody tr { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-sortable-data-table__table[data-selectable] tbody tr[data-selected] td { --cell-fill: color-mix(in oklab, var(--accent) 8%, var(--cell-base)); }
.mc-sortable-data-table__table[data-selectable] [data-primary]:not([data-sortable]), .mc-sortable-data-table__table[data-selectable] th[data-primary] .mc-sortable-data-table__sortButton { padding-left: var(--space-2); }

.mc-sortable-data-table__sortButton { display: flex; width: 100%; height: 44px; align-items: center; justify-content: flex-start; border: 0; padding: 0 var(--space-4); background: transparent; color: inherit; font: inherit; letter-spacing: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-sortable-data-table__table th[data-numeric] .mc-sortable-data-table__sortButton { justify-content: flex-end; }
.mc-sortable-data-table__sortInner { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-control); transition: color var(--duration-fast) var(--ease-standard); }
/* Right-aligned columns lead with the arrow so the label lines up with the digits below it. */
.mc-sortable-data-table__table th[data-numeric] .mc-sortable-data-table__sortInner { flex-direction: row-reverse; }
.mc-sortable-data-table__sortIcon { position: relative; display: grid; width: 16px; height: 16px; flex: none; place-items: center; }
.mc-sortable-data-table__sortHint, .mc-sortable-data-table__sortArrow { position: absolute; inset: 0; display: grid; place-items: center; }
.mc-sortable-data-table__sortHint { color: var(--text-muted); opacity: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-sortable-data-table__sortArrow { color: var(--foreground); }
.mc-sortable-data-table__sortButton:focus-visible { outline: none; }
.mc-sortable-data-table__sortButton:focus-visible .mc-sortable-data-table__sortInner { outline: 2px solid var(--focus-ring); outline-offset: 4px; }
.mc-sortable-data-table__sortButton:focus-visible .mc-sortable-data-table__sortHint { opacity: .6; }
.mc-sortable-data-table__table th[data-sorted] .mc-sortable-data-table__sortHint { opacity: 0; }

.mc-sortable-data-table__selectCell { width: 44px; }
.mc-sortable-data-table__table .mc-sortable-data-table__selectCell { padding: 0 0 0 var(--space-4); }
.mc-sortable-data-table__selectHit { position: relative; display: flex; width: 100%; height: 44px; align-items: center; cursor: pointer; }
.mc-sortable-data-table__selectInput { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.mc-sortable-data-table__selectBox { position: relative; display: block; width: 18px; height: 18px; flex: none; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--control-glyph); pointer-events: none; transition: border-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-sortable-data-table__selectBox[data-on] { border-color: var(--control-on); }
.mc-sortable-data-table__selectFill { position: absolute; inset: -1px; border-radius: inherit; background: var(--control-on); }
.mc-sortable-data-table__selectMark { position: absolute; inset: -1px; width: 18px; height: 18px; overflow: visible; }
.mc-sortable-data-table__selectInput:focus-visible + .mc-sortable-data-table__selectBox { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-sortable-data-table__selectInput:active + .mc-sortable-data-table__selectBox { transform: scale(.95); transition: border-color var(--duration-fast) var(--ease-standard), transform 110ms var(--ease-standard); }

.mc-sortable-data-table__footer { display: flex; height: 44px; align-items: center; justify-content: space-between; gap: var(--space-3); padding: 0 var(--space-2) 0 var(--space-4); border-top: 1px solid var(--border); color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); }
.mc-sortable-data-table__count { display: inline-flex; min-width: 0; align-items: baseline; gap: .28em; white-space: nowrap; transition: color var(--duration-standard) var(--ease-standard); }
.mc-sortable-data-table__count[data-active] { color: var(--foreground); }
.mc-sortable-data-table__swap { display: inline-block; }
.mc-sortable-data-table__swapInner { position: relative; display: inline-flex; width: max-content; }
.mc-sortable-data-table__swapText { display: inline-block; white-space: nowrap; }
.mc-sortable-data-table__number { font-variant-numeric: tabular-nums; }
.mc-sortable-data-table__clear { height: 30px; flex: none; border: 0; border-radius: var(--radius-control); padding: 0 var(--space-3); background: transparent; color: var(--foreground); font: inherit; font-weight: 500; letter-spacing: inherit; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); -webkit-tap-highlight-color: transparent; }
.mc-sortable-data-table__clear:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.mc-sortable-data-table__empty { height: 120px !important; color: var(--text-muted) !important; text-align: center !important; }

@media (hover: hover) and (pointer: fine) {
  .mc-sortable-data-table__table tbody tr:hover td { --cell-fill: color-mix(in oklab, var(--foreground) 3%, var(--cell-base)); }
  .mc-sortable-data-table__table[data-selectable] tbody tr[data-selected]:hover td { --cell-fill: color-mix(in oklab, var(--accent) 11%, var(--cell-base)); }
  .mc-sortable-data-table__table tbody tr:has(.mc-sortable-data-table__empty):hover td { --cell-fill: var(--cell-base); }
  .mc-sortable-data-table__sortButton:hover .mc-sortable-data-table__sortInner { color: var(--foreground); }
  .mc-sortable-data-table__sortButton:hover .mc-sortable-data-table__sortHint { opacity: .6; }
  .mc-sortable-data-table__table th[data-sorted] .mc-sortable-data-table__sortButton:hover .mc-sortable-data-table__sortHint { opacity: 0; }
  .mc-sortable-data-table__selectHit:hover .mc-sortable-data-table__selectBox:not([data-on]) { border-color: var(--text-muted); }
  .mc-sortable-data-table__clear:hover { background: var(--surface-muted); }
}

@media (max-width: 620px) {
  .mc-sortable-data-table__scroller { overflow: visible; }
  .mc-sortable-data-table__band { display: none; }
  .mc-sortable-data-table__table { display: block; width: 100%; min-width: 0; max-width: 100%; }
  .mc-sortable-data-table__table thead { display: block; }
  /* The header becomes a strip of sort controls, so sorting stays one tap away on a phone. */
  .mc-sortable-data-table__table thead tr { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); overflow-x: auto; border-bottom: 1px solid var(--border); scrollbar-width: none; }
  .mc-sortable-data-table__table thead tr::-webkit-scrollbar { display: none; }
  .mc-sortable-data-table__table th { display: block; flex: none; height: auto; border: 0; padding: 0; background: transparent; }
  /* Select all stays pinned while the sort controls scroll beneath it. */
  .mc-sortable-data-table__table th.mc-sortable-data-table__selectCell { position: sticky; left: calc(-1 * var(--space-2)); z-index: 1; width: 40px; margin-left: calc(-1 * var(--space-2)); padding: 0 0 0 var(--space-3); background: var(--surface); }
  .mc-sortable-data-table__table th.mc-sortable-data-table__selectCell .mc-sortable-data-table__selectHit { height: 32px; }
  /* Once the strip scrolls, a fade off the pinned cell hides the word sliding under it. */
  .mc-sortable-data-table__table th.mc-sortable-data-table__selectCell::after { position: absolute; top: 0; bottom: 0; left: 100%; width: 36px; background: linear-gradient(to right, var(--surface) 45%, transparent); content: ""; opacity: 0; pointer-events: none; animation: mc-sortable-data-table-stripFade linear both; animation-timeline: scroll(nearest inline); animation-range: 0 24px; }
  .mc-sortable-data-table__table th .mc-sortable-data-table__sortButton, .mc-sortable-data-table__table[data-selectable] th[data-primary] .mc-sortable-data-table__sortButton { width: auto; height: 32px; border-radius: var(--radius-control); padding: 0 10px; transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard); }
  .mc-sortable-data-table__table th[data-sorted] .mc-sortable-data-table__sortButton { background: var(--surface-muted); }
  .mc-sortable-data-table__table th[data-numeric] .mc-sortable-data-table__sortInner { flex-direction: row; }
  .mc-sortable-data-table__sortButton:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  .mc-sortable-data-table__sortButton:focus-visible .mc-sortable-data-table__sortInner { outline: none; }
  .mc-sortable-data-table__table tbody { display: block; width: 100%; }
  /* Rows fold into two lines: the first column with its number, then the remaining details. */
  .mc-sortable-data-table__table tbody tr { --row-fill: var(--surface); position: relative; display: flex; width: 100%; min-height: 64px; box-sizing: border-box; flex-wrap: wrap; align-items: baseline; align-content: center; gap: 2px var(--space-2); padding: 10px var(--space-4); border-bottom: 1px solid var(--border-subtle); background-color: var(--row-fill); transition: background-color var(--duration-standard) var(--ease-standard); }
  .mc-sortable-data-table__table tbody tr::after { order: 1; flex-basis: 100%; content: ""; }
  .mc-sortable-data-table__table[data-selectable] tbody tr { padding-left: 44px; }
  .mc-sortable-data-table__table[data-selectable] tbody tr[data-selected] { --row-fill: color-mix(in oklab, var(--accent) 8%, var(--surface)); }
  .mc-sortable-data-table__table tbody tr:last-child { border-bottom: 0; }
  .mc-sortable-data-table__table td { order: 2; display: block; min-width: 0; height: auto; border: 0; padding: 0; background: transparent; color: var(--text-secondary); font-size: var(--text-xs); text-align: left; }
  .mc-sortable-data-table__table[data-selectable] td[data-primary]:not([data-sortable]) { padding-left: 0; }
  .mc-sortable-data-table__table td[data-primary] { order: 0; flex: 1 1 0; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; }
  .mc-sortable-data-table__table td[data-numeric]:not([data-primary]) { order: 0; flex: none; margin-left: auto; padding-left: var(--space-2); color: var(--foreground); font-size: var(--text-sm); }
  .mc-sortable-data-table__table td[data-numeric] ~ td[data-numeric] { order: 2; margin-left: 0; padding-left: 0; color: var(--text-secondary); font-size: var(--text-xs); }
  /* The sorted value lifts to full contrast, echoing the tinted column on wider screens. */
  .mc-sortable-data-table__table td[data-sorted]:not([data-primary]) { color: var(--foreground); }
  .mc-sortable-data-table__table td.mc-sortable-data-table__selectCell { position: absolute; top: 0; bottom: 0; left: var(--space-1); display: flex; width: 36px; align-items: center; padding: 0; }
  .mc-sortable-data-table__table td.mc-sortable-data-table__selectCell .mc-sortable-data-table__selectHit { justify-content: center; }
  .mc-sortable-data-table__table .mc-sortable-data-table__empty { flex: 1 0 100%; height: auto !important; padding: var(--space-6) 0; }
  .mc-sortable-data-table__table[data-selectable] tbody tr:has(.mc-sortable-data-table__empty) { padding-left: var(--space-4); }
}
@media (max-width: 620px) and (hover: hover) and (pointer: fine) {
  .mc-sortable-data-table__table tbody tr:hover { --row-fill: color-mix(in oklab, var(--foreground) 3%, var(--surface)); }
  .mc-sortable-data-table__table[data-selectable] tbody tr[data-selected]:hover { --row-fill: color-mix(in oklab, var(--accent) 11%, var(--surface)); }
  .mc-sortable-data-table__table tbody tr:hover td { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-sortable-data-table__table th, .mc-sortable-data-table__table td, .mc-sortable-data-table__table tbody tr, .mc-sortable-data-table__sortInner, .mc-sortable-data-table__sortHint, .mc-sortable-data-table__selectBox, .mc-sortable-data-table__count, .mc-sortable-data-table__clear, .mc-sortable-data-table__table th .mc-sortable-data-table__sortButton { transition: none !important; }
  .mc-sortable-data-table__selectInput:active + .mc-sortable-data-table__selectBox { transform: none; }
}

@keyframes mc-sortable-data-table-stripFade { to { opacity: 1; } }
}
</style>
