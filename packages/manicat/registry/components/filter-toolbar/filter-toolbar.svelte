<script lang="ts" module>
  export interface FilterChip {
    id: string;
    label: string;
    value?: string;
  }

  export interface FilterOption {
    value: string;
    label?: string;
    hint?: string | number;
  }

  export interface FilterField {
    id: string;
    label: string;
    options: (string | FilterOption)[];
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** The fields offered by the add-filter menu. Leave it out to hide the menu. */
    fields?: FilterField[];
    label?: string;
    addLabel?: string;
    /** The active filters. Bind them with `bind:filters`. */
    filters?: FilterChip[];
    onadd?: (filter: FilterChip, field: FilterField) => void;
    /** Your own controls, such as a search field. */
    children?: Snippet;
    /** Extend the inner, named parts of the toolbar: chip, remove, add, menu or clear. */
    classNames?: { chip?: string; remove?: string; add?: string; menu?: string; clear?: string };
  }

  let { fields, label = "Active filters", addLabel = "Add filter", filters = $bindable([]), onadd, children, classNames }: Props = $props();

  let root = $state<HTMLElement>();
  let open = $state(false);
  let field = $state<FilterField | null>(null);

  const choices = $derived<FilterOption[]>(field ? field.options.map((entry) => (typeof entry === "string" ? { value: entry } : entry)) : []);

  function hide() {
    open = false;
    field = null;
  }

  function pick(option: FilterOption) {
    if (!field) return;
    const chip = { id: field.id, label: option.label ?? option.value, value: option.value };
    filters = [...filters.filter((entry) => entry.id !== chip.id), chip];
    onadd?.(chip, field);
    hide();
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) hide();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      if (field) field = null;
      else hide();
    }
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-filters" role="toolbar" tabindex="-1" aria-label={label} onkeydown={onKeydown}>
  {@render children?.()}
  {#each filters as filter (filter.id)}
    <span class={["mc-filters__chip", classNames?.chip]}>
      {filter.label}
      <button type="button" class={["mc-filters__remove", classNames?.remove]} aria-label="Remove {filter.label}" onclick={() => (filters = filters.filter((entry) => entry.id !== filter.id))}>
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
      </button>
    </span>
  {/each}
  {#if fields?.length}
    <span class="mc-filters__menu-wrap">
      <button type="button" class={["mc-filters__add", classNames?.add]} aria-haspopup="menu" aria-expanded={open} onclick={() => (open ? hide() : (open = true))}>+ {addLabel}</button>
      {#if open}
        <div role="menu" class={["mc-filters__menu", classNames?.menu]}>
          {#if !field}
            {#each fields as entry (entry.id)}
              <button type="button" role="menuitem" onclick={() => (field = entry)}>{entry.label} <span aria-hidden="true">›</span></button>
            {/each}
          {:else}
            <button type="button" role="menuitem" class="mc-filters__back" onclick={() => (field = null)}>‹ {field.label}</button>
            {#each choices as option (option.value)}
              <button type="button" role="menuitem" disabled={filters.some((chip) => chip.id === field?.id && chip.value === option.value)} onclick={() => pick(option)}>
                {option.label ?? option.value}{#if option.hint !== undefined}<span class="mc-filters__hint">{option.hint}</span>{/if}
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </span>
  {/if}
  {#if filters.length > 1}<button type="button" class={["mc-filters__clear", classNames?.clear]} onclick={() => (filters = [])}>Clear all</button>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.mc-filters__chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); font-size: var(--text-xs); font-weight: 500; animation: mc-filters-in .18s var(--ease-enter) both; }
.mc-filters__remove { display: grid; place-items: center; width: 16px; height: 16px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; }
.mc-filters__menu-wrap { position: relative; }
.mc-filters__add { min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-filters__add:hover { background: var(--surface-muted); } }
.mc-filters__menu { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; min-width: 12rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-filters-in .18s var(--ease-enter) both; }
.mc-filters__menu button { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; justify-content: space-between; gap: var(--space-3); padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-filters__menu button:hover:not(:disabled), .mc-filters__menu button:focus-visible { outline: none; background: var(--surface-muted); }
.mc-filters__menu button:disabled { opacity: .45; cursor: not-allowed; }
.mc-filters__back { color: var(--text-secondary); }
.mc-filters__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-filters__clear { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
@keyframes mc-filters-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-filters__chip, .mc-filters__menu { animation: none; } }
}
</style>
