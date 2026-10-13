<script lang="ts" module>
  export interface CommandItem {
    id: string;
    label: string;
    description?: string;
    group?: string;
    keywords?: string[];
    shortcut?: string;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    items: CommandItem[];
    placeholder?: string;
    label?: string;
    autoFocus?: boolean;
    onselect?: (item: CommandItem) => void;
    onclose?: () => void;
    /** Extend the inner, named parts of the palette: input, list, group, item or empty. */
    classNames?: { input?: string; list?: string; group?: string; item?: string; empty?: string };
  }

  let { items, placeholder = "Search commands", label = "Command palette", autoFocus = false, onselect, onclose, classNames }: Props = $props();

  const id = $props.id();
  let query = $state("");
  let active = $state(0);
  let input = $state<HTMLInputElement>();

  const results = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => [item.label, item.description ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle)));
  });
  const groups = $derived([...new Set(results.map((item) => item.group ?? ""))]);

  $effect(() => {
    results;
    active = 0;
  });
  $effect(() => {
    if (autoFocus) input?.focus();
  });

  async function onKeydown(event: KeyboardEvent) {
    const count = results.length;
    if (event.key === "ArrowDown" && count) active = (active + 1) % count;
    else if (event.key === "ArrowUp" && count) active = (active - 1 + count) % count;
    else if (event.key === "Home") active = 0;
    else if (event.key === "End") active = Math.max(0, count - 1);
    else if (event.key === "Enter" && results[active]) onselect?.(results[active]);
    else if (event.key === "Escape") onclose?.();
    else return;
    event.preventDefault();
    await tick();
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }

  const indexOf = (item: CommandItem) => results.indexOf(item);
</script>

<div class="mc-command" role="dialog" aria-label={label}>
  <input
    bind:this={input}
    bind:value={query}
    type="text"
    role="combobox"
    autocomplete="off"
    class={["mc-command__input", classNames?.input]}
    {placeholder}
    aria-label={placeholder}
    aria-expanded="true"
    aria-controls="{id}-list"
    aria-activedescendant={results.length ? `${id}-option-${active}` : undefined}
    onkeydown={onKeydown}
  />
  <div id="{id}-list" role="listbox" aria-label={label} class={["mc-command__list", classNames?.list]}>
    {#if results.length === 0}<p class={["mc-command__empty", classNames?.empty]}>No results</p>{/if}
    {#each groups as group (group || "all")}
      <div role="presentation">
        {#if group}<div class={["mc-command__group", classNames?.group]} role="presentation">{group}</div>{/if}
        {#each results.filter((entry) => (entry.group ?? "") === group) as item (item.id)}
          <div id="{id}-option-{indexOf(item)}" role="option" tabindex="-1" aria-selected={active === indexOf(item)} class={["mc-command__item", classNames?.item]} onpointermove={() => (active = indexOf(item))} onclick={() => onselect?.(item)} onkeydown={() => {}}>
            <span class="mc-command__copy">
              <span>{item.label}</span>
              {#if item.description}<span class="mc-command__description">{item.description}</span>{/if}
            </span>
            {#if item.shortcut}<kbd class="mc-command__shortcut">{item.shortcut}</kbd>{/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-command { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); }
.mc-command__input { box-sizing: border-box; width: 100%; min-height: var(--control-height-lg); padding: 0 var(--space-4); border: 0; border-bottom: 1px solid var(--border); outline: 0; background: transparent; color: inherit; font: inherit; font-size: var(--text-sm); }
.mc-command__input::placeholder { color: var(--text-muted); }
.mc-command__list { max-height: 340px; padding: 6px; overflow: auto; }
.mc-command__group { padding: var(--space-2) var(--space-3) 4px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; }
.mc-command__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-md); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-command__item[aria-selected="true"] { background: var(--surface-muted); }
.mc-command__copy { display: grid; }
.mc-command__description { color: var(--text-muted); font-size: var(--text-xs); }
.mc-command__shortcut { color: var(--text-muted); font: inherit; font-size: var(--text-xs); }
.mc-command__empty { margin: 0; padding: var(--space-4); color: var(--text-muted); font-size: var(--text-sm); text-align: center; }
}
</style>
