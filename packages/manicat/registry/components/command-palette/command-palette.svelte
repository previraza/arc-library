<script lang="ts" module>
  import type { Component } from "svelte";

  export interface CommandItem {
    id: string;
    label: string;
    description?: string;
    group?: string;
    keywords?: string[];
    icon?: Component;
    shortcut?: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount, tick } from "svelte";
  import { Command as CommandIcon, Search, X } from "@lucide/svelte";
  import { GLIDE_ROWS, createHighlight, followHeight } from "@/lib/command-palette";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    items: CommandItem[];
    placeholder?: string;
    onSelect?: (item: CommandItem) => void;
    onClose?: () => void;
    label?: string;
    /** Focus the search field on mount, for a palette that opens on demand. */
    autoFocus?: boolean;
    class?: string;
    /** Extend the inner, named parts of the command palette: searchRow, searchIcon, clearButton, closeButton, commandKey, resultsFrame, results, highlight, group, groupHeading, result, itemIcon, resultCopy, shortcut or empty. */
    classNames?: { searchRow?: string; searchIcon?: string; clearButton?: string; closeButton?: string; commandKey?: string; resultsFrame?: string; results?: string; highlight?: string; group?: string; groupHeading?: string; result?: string; itemIcon?: string; resultCopy?: string; shortcut?: string; empty?: string };
  }

  let { items, placeholder = "Search commands", onSelect, onClose, label = "Command palette", autoFocus = false, class: className, classNames }: Props = $props();

  const inputId = $props.id();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let query = $state("");
  let activeIndex = $state<number | null>(null);
  let root: HTMLElement;
  let input: HTMLInputElement;
  let frame: HTMLElement;
  let list: HTMLElement;
  let mark: HTMLElement;
  let pointer = false;
  let lastPointer = { x: -1, y: -1 };
  let highlight: ReturnType<typeof createHighlight> | undefined;

  const filtered = $derived.by(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [item.label, item.description, item.group, ...(item.keywords ?? [])].filter(Boolean).join(" ").toLowerCase().includes(normalized));
  });
  const grouped = $derived.by(() => {
    const groups = new Map<string, Array<{ item: CommandItem; index: number }>>();
    filtered.forEach((item, index) => {
      const group = item.group ?? "Actions";
      const entries = groups.get(group) ?? [];
      entries.push({ item, index });
      groups.set(group, entries);
    });
    return [...groups.entries()];
  });
  // When every remaining row moves within about a viewport, the list closes its gaps with a glide. A long jump snaps like a search result list instead of streaking rows through the frame; only the frame height morphs.
  let shiftGlide = true;
  let previous = filtered;
  const flip = createFlip(() => (shiftGlide && !reduced ? [...(list?.querySelectorAll<HTMLElement>("[data-flip]") ?? [])] : []), { reduced, spring: "smooth" });
  $effect.pre(() => {
    const next = filtered;
    if (next !== previous) {
      const before = new Map(previous.map((item, index) => [item.id, index]));
      shiftGlide = next.every((item, index) => Math.abs((before.get(item.id) ?? index) - index) <= GLIDE_ROWS);
      previous = next;
    }
    flip.measure();
  });
  $effect(() => {
    filtered;
    flip.play();
  });
  const glide = () => shiftGlide && !reduced;
  const safeActiveIndex = $derived(activeIndex === null ? -1 : Math.min(activeIndex, Math.max(filtered.length - 1, 0)));
  const activeId = $derived(filtered[safeActiveIndex]?.id);
  const rowId = (id: string) => `${inputId}-${id}`;

  onMount(() => {
    if (autoFocus) input.focus({ preventScroll: true });
    const focusShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.focus();
      }
    };
    document.addEventListener("keydown", focusShortcut);
    const stopHeight = followHeight(frame, list, reduced);
    highlight = createHighlight(list, mark, reduced);
    return () => {
      document.removeEventListener("keydown", focusShortcut);
      stopHeight();
    };
  });
  // One highlight follows the active result.
  $effect(() => {
    const id = activeId;
    filtered;
    tick().then(() => {
      const node = id ? document.getElementById(rowId(id)) : null;
      highlight?.set(node, pointer);
      node?.scrollIntoView({ block: "nearest" });
    });
  });

  function choose(item: CommandItem) {
    onSelect?.(item);
    query = "";
    activeIndex = null;
    input.focus();
  }
  function onkeydown(event: KeyboardEvent) {
    pointer = false;
    const count = filtered.length;
    if (event.key === "ArrowDown") { event.preventDefault(); activeIndex = Math.min((activeIndex ?? -1) + 1, Math.max(count - 1, 0)); }
    if (event.key === "ArrowUp") { event.preventDefault(); activeIndex = Math.max((activeIndex ?? count) - 1, 0); }
    if (event.key === "Home") { event.preventDefault(); activeIndex = 0; }
    if (event.key === "End") { event.preventDefault(); activeIndex = Math.max(count - 1, 0); }
    // Enter runs the highlighted result; after typing, with nothing highlighted yet, it runs the top match.
    const target = filtered[safeActiveIndex] ?? (query ? filtered[0] : undefined);
    if (event.key === "Enter" && target) { event.preventDefault(); choose(target); }
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) { query = ""; activeIndex = null; }
      else onClose?.();
    }
  }
  function onMove(event: PointerEvent, index: number) {
    // Ignore the synthetic moves browsers send while the list scrolls under a still pointer.
    if (event.clientX === lastPointer.x && event.clientY === lastPointer.y) return;
    lastPointer = { x: event.clientX, y: event.clientY };
    if (index !== safeActiveIndex) {
      pointer = true;
      activeIndex = index;
    }
  }

  const clearIn = poseTransition(reduced ? {} : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { spring: "snappy", fade: duration.instant });
  const clearOut = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" }, { pop: true })(node);
  // Results leave before the empty state arrives, so the frame makes one height change instead of two.
  const blockIn = poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter", delay: duration.instant });
  const blockOut = poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" });
  const emptyIn = poseTransition(reduced ? {} : { opacity: 0, y: 6, blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter", delay: duration.instant });
  const emptyOut = poseTransition(reduced ? {} : { opacity: 0, y: -4 }, { opacity: 1, y: 0 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" });
  // Rows fade in as they arrive; filtered-out rows pop out of the flow as they fade, so the rest glide up and the frame starts closing on the same keystroke.
  const rowIn = poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" });
  const rowOut = (node: HTMLElement) => {
    const at = flip.origin(node);
    const { x, y } = at ?? { x: node.offsetLeft, y: node.offsetTop };
    Object.assign(node.style, { position: "absolute", left: `${x}px`, top: `${y}px`, width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`, margin: "0" });
    return poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: glide() ? duration.instant : 0, ease: "standard" })(node);
  };
</script>

<div bind:this={root} class={["mc-command-palette__palette", className]}>
  <div class={["mc-command-palette__searchRow", classNames?.searchRow]}>
    <span class={["mc-command-palette__searchIcon", classNames?.searchIcon]}><Search size={18} strokeWidth={1.75} aria-hidden="true" /></span>
    <label class="mc-command-palette__visuallyHidden" for={inputId}>{label}</label>
    <input bind:this={input} id={inputId} role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls={`${inputId}-results`} aria-activedescendant={activeId ? rowId(activeId) : undefined} value={query} {placeholder} autocomplete="off" oninput={(event) => { query = (event.target as HTMLInputElement).value; activeIndex = null; }} {onkeydown} />
    {#if query}
      <button class={["mc-command-palette__clearButton", classNames?.clearButton]} type="button" aria-label="Clear search" onclick={() => { query = ""; activeIndex = null; input.focus(); }} in:clearIn out:clearOut><X size={15} aria-hidden="true" /></button>
    {/if}
    {#if onClose}<button class={["mc-command-palette__closeButton", classNames?.closeButton]} type="button" aria-label="Close command palette" onclick={onClose}>Esc</button>{/if}
    <kbd class={["mc-command-palette__commandKey", classNames?.commandKey]}>⌘ K</kbd>
  </div>
  <div bind:this={frame} class={["mc-command-palette__resultsFrame", classNames?.resultsFrame]}>
    <div bind:this={list} id={`${inputId}-results`} class={["mc-command-palette__results", classNames?.results]} role="listbox" aria-label="Command results">
      <span bind:this={mark} class={["mc-command-palette__highlight", classNames?.highlight]} aria-hidden="true"></span>
      {#if filtered.length}
        <div in:blockIn out:blockOut>
          {#each grouped as [group, entries] (group)}
            <div data-flip class={["mc-command-palette__group", classNames?.group]} role="group" aria-label={group} in:rowIn out:rowOut>
              <span class={["mc-command-palette__groupHeading", classNames?.groupHeading]} aria-hidden="true">{group}</span>
              {#each entries as { item, index } (item.id)}
                {@const Icon = item.icon}
                <button id={rowId(item.id)} data-flip class={["mc-command-palette__result", index === safeActiveIndex && "mc-command-palette__activeResult", classNames?.result]} type="button" role="option" aria-selected={index === safeActiveIndex} onclick={() => choose(item)} onpointermove={(event) => onMove(event, index)} in:rowIn out:rowOut>
                  <span class={["mc-command-palette__itemIcon", classNames?.itemIcon]} aria-hidden="true">{#if Icon}<Icon />{:else}<CommandIcon size={16} />{/if}</span>
                  <span class={["mc-command-palette__resultCopy", classNames?.resultCopy]}><strong>{item.label}</strong>{#if item.description}<small>{item.description}</small>{/if}</span>
                  {#if item.shortcut}<kbd class={["mc-command-palette__shortcut", classNames?.shortcut]}>{item.shortcut}</kbd>{/if}
                </button>
              {/each}
            </div>
          {/each}
        </div>
      {:else}
        <div class={["mc-command-palette__empty", classNames?.empty]} in:emptyIn out:emptyOut><span><Search size={20} aria-hidden="true" /></span><strong>No matching actions</strong><small>Try a different word or clear the search.</small></div>
      {/if}
    </div>
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-command-palette__palette {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-floating);
  transform-origin: top center;
}

.mc-command-palette__searchRow {
  position: relative;
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--duration-fast) var(--ease-standard);
}

.mc-command-palette__searchRow:focus-within { background: var(--surface-muted); }
.mc-command-palette__searchIcon, .mc-command-palette__itemIcon { display: grid; flex: none; place-items: center; color: var(--text-muted); }
.mc-command-palette__searchIcon { width: 22px; height: 22px; }
.mc-command-palette__searchRow input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-command-palette__searchRow input::placeholder { color: var(--text-muted); }
.mc-command-palette__searchRow input:focus-visible { outline: none; }

.mc-command-palette__commandKey, .mc-command-palette__shortcut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.mc-command-palette__commandKey { min-width: 38px; height: 24px; padding: 0 6px; gap: 2px; }
.mc-command-palette__clearButton { display: grid; width: 24px; height: 24px; flex: none; place-items: center; border: 0; border-radius: 7px; background: transparent; color: var(--text-muted); cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-command-palette__clearButton:hover, .mc-command-palette__closeButton:hover { background: var(--surface); color: var(--foreground); } }
.mc-command-palette__clearButton:active, .mc-command-palette__closeButton:active { background: var(--surface); color: var(--foreground); }
.mc-command-palette__clearButton:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-command-palette__closeButton { display: grid; min-width: 27px; height: 24px; flex: none; place-items: center; border: 1px solid var(--border-subtle); border-radius: 7px; background: transparent; color: var(--text-muted); padding: 0 6px; font: inherit; font-size: var(--text-xs); font-weight: 500; line-height: 1; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-command-palette__closeButton:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* The frame animates to the list height; the list keeps its own scroll. */
.mc-command-palette__resultsFrame { overflow: hidden; }
.mc-command-palette__results { position: relative; max-height: 342px; overflow: auto; padding: 6px 8px; }
.mc-command-palette__highlight { position: absolute; top: 0; right: 8px; left: 8px; border-radius: 8px; background: var(--surface-muted); opacity: 0; pointer-events: none; }
/* Groups are positioned so a row that pops out of the flow is placed against the same box it was measured in, even mid-glide. */
.mc-command-palette__group { position: relative; }
.mc-command-palette__group + .mc-command-palette__group { margin-top: 6px; }
.mc-command-palette__groupHeading { display: block; padding: 6px 8px 3px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); }

/* One line per result: the title, then its description in muted text, so the list stays short and scannable. */
.mc-command-palette__result { position: relative; display: flex; width: 100%; min-height: 34px; align-items: center; gap: 10px; border: 0; border-radius: 8px; padding: 0 8px; background: transparent; color: var(--foreground); text-align: left; cursor: pointer; }
/* The active row is drawn by the shared highlight; the row itself only tints its icon and arrow. */
.mc-command-palette__itemIcon { transition: color var(--duration-fast) var(--ease-standard); }
.mc-command-palette__activeResult .mc-command-palette__itemIcon, .mc-command-palette__activeResult .mc-command-palette__result:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.mc-command-palette__itemIcon { display: grid; width: 16px; height: 16px; flex: none; place-items: center; color: var(--text-muted); }
.mc-command-palette__itemIcon svg { width: 16px; height: 16px; }
.mc-command-palette__resultCopy { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 8px; }
.mc-command-palette__resultCopy strong, .mc-command-palette__resultCopy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-command-palette__resultCopy strong { flex: none; max-width: 100%; }
.mc-command-palette__resultCopy small { min-width: 0; }
.mc-command-palette__resultCopy strong { font-size: var(--text-sm); font-weight: 500; }
.mc-command-palette__resultCopy small { color: var(--text-muted); font-size: var(--text-xs); }
.mc-command-palette__shortcut { min-width: 18px; height: 18px; padding: 0 4px; border-color: transparent; border-radius: 5px; font-size: 11px; }
.mc-command-palette__activeResult 
.mc-command-palette__empty { display: grid; justify-items: center; gap: 4px; padding: 26px 12px 28px; text-align: center; }
.mc-command-palette__empty > span { display: grid; width: 32px; height: 32px; place-items: center; margin-bottom: 5px; color: var(--text-muted); }
.mc-command-palette__empty strong { font-size: var(--text-sm); font-weight: 500; }
.mc-command-palette__empty small { color: var(--text-muted); font-size: var(--text-xs); }
.mc-command-palette__visuallyHidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (max-width: 480px) {
  .mc-command-palette__searchRow { gap: 8px; padding: 8px 11px; }
  .mc-command-palette__results { padding: 6px; }
  .mc-command-palette__highlight { right: 6px; left: 6px; }
  .mc-command-palette__result { gap: 8px; }
  .mc-command-palette__shortcut, .mc-command-palette__commandKey { display: none; }
  }

@media (max-width: 340px) {
    .mc-command-palette__result { padding-inline: 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-command-palette__searchRow, .mc-command-palette__itemIcon, .mc-command-palette__clearButton, .mc-command-palette__closeButton { transition: none; }
}
}
</style>
