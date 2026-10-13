<script lang="ts" module>
  export type JsonValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "other";
</script>

<script lang="ts">
  interface Props {
    data: unknown;
    rootName?: string;
    /** How many levels are open at first. */
    defaultExpandDepth?: number;
    maxHeight?: string | number;
    label?: string;
    /** The open paths ("$", "$.plan", …). Bind them with `bind:expanded`. */
    expanded?: string[];
    onselect?: (detail: { path: string; value: unknown; type: JsonValueType }) => void;
    /** Extend the inner, named parts of the viewer: row, key or value. */
    classNames?: { row?: string; key?: string; value?: string };
  }

  interface Row {
    name: string;
    value: unknown;
    path: string;
    depth: number;
    type: JsonValueType;
    branch: boolean;
    size: number;
  }

  let { data, rootName = "root", defaultExpandDepth = 1, maxHeight, label = "JSON", expanded = $bindable(), onselect, classNames }: Props = $props();

  const typeOf = (value: unknown): JsonValueType => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "object" ? "object" : typeof value === "string" ? "string" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "other");

  function initial(): string[] {
    const out: string[] = [];
    const walk = (value: unknown, path: string, depth: number) => {
      if (typeOf(value) === "object" || typeOf(value) === "array") {
        if (depth < defaultExpandDepth) out.push(path);
        Object.entries(value as object).forEach(([key, child]) => walk(child, `${path}.${key}`, depth + 1));
      }
    };
    walk(data, "$", 0);
    return out;
  }

  // svelte-ignore state_referenced_locally
  expanded ??= initial();
  const open = $derived(expanded ?? []);

  // Flattened to the visible rows, so a long document is one list.
  const rows = $derived.by(() => {
    const out: Row[] = [];
    const walk = (name: string, value: unknown, path: string, depth: number) => {
      const type = typeOf(value);
      const branch = type === "object" || type === "array";
      out.push({ name, value, path, depth, type, branch, size: branch ? Object.keys(value as object).length : 0 });
      if (branch && open.includes(path)) Object.entries(value as object).forEach(([key, child]) => walk(key, child, `${path}.${key}`, depth + 1));
    };
    walk(rootName, data, "$", 0);
    return out;
  });

  function activate(row: Row) {
    if (row.branch) expanded = open.includes(row.path) ? open.filter((path) => path !== row.path) : [...open, row.path];
    onselect?.({ path: row.path, value: row.value, type: row.type });
  }

  const preview = (row: Row) => (row.branch ? (open.includes(row.path) ? (row.type === "array" ? "[" : "{") : `${row.type === "array" ? "[…]" : "{…}"} ${row.size} ${row.size === 1 ? "item" : "items"}`) : row.type === "string" ? `"${String(row.value)}"` : String(row.value));
</script>

<div class="mc-json" role="tree" aria-label={label} style:max-height={typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}>
  {#each rows as row (row.path)}
    <div
      role="treeitem"
      aria-selected="false"
      aria-level={row.depth + 1}
      aria-expanded={row.branch ? open.includes(row.path) : undefined}
      tabindex="0"
      class={["mc-json__row", classNames?.row]}
      style="padding-left: {row.depth * 14}px"
      onclick={() => activate(row)}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate(row);
        }
      }}
    >
      <span class="mc-json__chevron" aria-hidden="true">{row.branch ? (open.includes(row.path) ? "▾" : "▸") : ""}</span>
      <span class={["mc-json__key", classNames?.key]}>{row.name}</span><span class="mc-json__colon">: </span>
      <span class={["mc-json__value", `mc-json__value--${row.type}`, classNames?.value]}>{preview(row)}</span>
    </div>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-json { overflow: auto; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.mc-json__row { display: flex; align-items: flex-start; min-height: 24px; padding-block: 2px; border-radius: 6px; cursor: default; outline: none; }
@media (hover: hover) and (pointer: fine) { .mc-json__row:hover { background: var(--surface-muted); } }
.mc-json__row:focus-visible { background: var(--surface-muted); }
.mc-json__chevron { width: 14px; flex: 0 0 auto; color: var(--text-muted); }
.mc-json__key { color: var(--foreground); } .mc-json__colon { color: var(--text-muted); }
.mc-json__value--string { color: var(--success); } .mc-json__value--number { color: var(--series-1, var(--accent)); } .mc-json__value--boolean { color: var(--warning); } .mc-json__value--null, .mc-json__value--object, .mc-json__value--array { color: var(--text-muted); }
}
</style>
