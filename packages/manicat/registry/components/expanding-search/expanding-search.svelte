<script lang="ts" module>
  export interface ExpandingSearchItem {
    id: string;
    title: string;
    meta?: string;
    group?: string;
    keywords?: string[];
  }
</script>

<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    label: string;
    items: ExpandingSearchItem[];
    /** Shown under the field before anything is typed. */
    suggestions?: ExpandingSearchItem[];
    suggestionsLabel?: string;
    placeholder?: string;
    expandedWidth?: number;
    maxResults?: number;
    anchor?: "start" | "end";
    emptyHint?: string;
    onselect?: (item: ExpandingSearchItem) => void;
    onexpandedchange?: (expanded: boolean) => void;
    /** Extend the inner, named parts of the search: trigger, field, input, results, result or empty. */
    classNames?: { trigger?: string; field?: string; input?: string; results?: string; result?: string; empty?: string };
  }

  let { label, items, suggestions = [], suggestionsLabel = "Recent", placeholder = "Search", expandedWidth = 360, maxResults = 6, anchor = "end", emptyHint = "Try a shorter word.", onselect, onexpandedchange, classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let input = $state<HTMLInputElement>();
  let expanded = $state(false);
  let query = $state("");
  let active = $state(0);

  const results = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return suggestions.slice(0, maxResults);
    return items.filter((item) => [item.title, item.meta ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle))).slice(0, maxResults);
  });

  async function open() {
    expanded = true;
    onexpandedchange?.(true);
    await tick();
    input?.focus();
  }

  function close() {
    expanded = false;
    query = "";
    active = 0;
    onexpandedchange?.(false);
  }

  function choose(index: number) {
    const item = results[index];
    if (!item) return;
    onselect?.(item);
    close();
  }

  function onKeydown(event: KeyboardEvent) {
    const count = results.length;
    if (event.key === "ArrowDown" && count) active = (active + 1) % count;
    else if (event.key === "ArrowUp" && count) active = (active - 1 + count) % count;
    else if (event.key === "Enter") choose(active);
    else if (event.key === "Escape") close();
    else return;
    event.preventDefault();
  }

  function onOutside(event: PointerEvent) {
    if (expanded && root && !root.contains(event.target as Node)) close();
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-xsearch" data-anchor={anchor}>
  {#if !expanded}
    <button type="button" class={["mc-xsearch__trigger", classNames?.trigger]} aria-label={label} onclick={open}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
    </button>
  {:else}
    <div class={["mc-xsearch__panel", classNames?.field]} style="width: min({expandedWidth}px, calc(100vw - 2rem))">
      <div class="mc-xsearch__field">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
        <input bind:this={input} bind:value={query} role="combobox" autocomplete="off" {placeholder} aria-label={label} aria-expanded="true" aria-controls="{id}-list" aria-activedescendant={results.length ? `${id}-option-${active}` : undefined} class={["mc-xsearch__input", classNames?.input]} onkeydown={onKeydown} />
        <button type="button" class="mc-xsearch__close" aria-label="Close search" onclick={close}>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>
      <div id="{id}-list" role="listbox" class={["mc-xsearch__results", classNames?.results]}>
        {#if !query.trim() && suggestions.length}<div class="mc-xsearch__group">{suggestionsLabel}</div>{/if}
        {#if query.trim() && results.length === 0}<p class={["mc-xsearch__empty", classNames?.empty]}>{emptyHint}</p>{/if}
        {#each results as item, index (item.id)}
          <div id="{id}-option-{index}" role="option" tabindex="-1" aria-selected={active === index} class={["mc-xsearch__result", classNames?.result]} onpointermove={() => (active = index)} onclick={() => choose(index)} onkeydown={() => {}}>
            <span>{item.title}</span>{#if item.meta}<span class="mc-xsearch__meta">{item.meta}</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-xsearch { position: relative; display: inline-block; }
.mc-xsearch__trigger { display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-secondary); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-xsearch__trigger:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-xsearch__panel { animation: mc-xsearch-in .22s var(--ease-enter) both; }
.mc-xsearch[data-anchor="end"] .mc-xsearch__panel { margin-left: auto; transform-origin: right center; }
.mc-xsearch__field { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--foreground); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); }
.mc-xsearch__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-xsearch__close { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; }
.mc-xsearch__results { margin-top: var(--space-2); padding: 6px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); }
.mc-xsearch__group { padding: 6px var(--space-3) 2px; color: var(--text-muted); font-size: var(--text-xs); }
.mc-xsearch__result { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-xsearch__result[aria-selected="true"] { background: var(--surface-muted); }
.mc-xsearch__meta { color: var(--text-muted); font-size: var(--text-xs); }
.mc-xsearch__empty { margin: 0; padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
@keyframes mc-xsearch-in { from { opacity: 0; transform: scaleX(.6); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-xsearch__panel { animation: none; } }
}
</style>
