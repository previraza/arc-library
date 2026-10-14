<script lang="ts" module>
  import type { Component } from "svelte";
  import type { ExpandingSearchEntry } from "@/lib/expanding-search";

  export interface ExpandingSearchItem extends ExpandingSearchEntry {
    icon?: Component;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount, untrack } from "svelte";
  import { Search, X } from "@lucide/svelte";
  import ExpandingSearchPanel from "@/registry/components/expanding-search/expanding-search-panel.svelte";
  import ExpandingSearchListbox from "@/registry/components/expanding-search/expanding-search-listbox.svelte";
  import { createSearchShell, enter, groupBy, rank, standard } from "@/lib/expanding-search";
  import type { SearchGroup, SearchMode } from "@/lib/expanding-search";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /**
   * A search that waits as an icon button until it is needed. Use it in headers and toolbars where a full field would crowd the layout.
   * The button morphs into the field, results unfold beneath it, and Escape, choosing a result, or leaving the field empty folds it back into the icon.
   * Place it in the space the field may grow into; it fills that space's width and keeps the button on the `anchor` edge.
   */
  interface Props {
    /** Names the button, the field, and the results, such as "Search projects and docs". */
    label: string;
    items: ExpandingSearchItem[];
    /** Shown before anything is typed, such as recent searches. */
    suggestions?: ExpandingSearchItem[];
    suggestionsLabel?: string;
    placeholder?: string;
    onselect?: (item: ExpandingSearchItem) => void;
    onexpandedchange?: (expanded: boolean) => void;
    /** The widest the field grows. It never grows past its container. */
    expandedWidth?: number;
    maxResults?: number;
    /** The edge the button sits on; the field grows away from it. */
    anchor?: "start" | "end";
    /** A short tip under the empty state. */
    emptyHint?: string;
    /** Extend the inner, named parts of the expanding search: root, shell, trigger, icon, input, clear, panel, body, listbox, group, groupLabel, option, highlight, optionIcon, optionText, optionTitle, optionMeta, mark, view, empty, emptyTitle, emptyHint, srOnly. */
    classNames?: Record<string, string | undefined>;
    class?: string;
    [key: string]: unknown;
  }

  let { label, items, suggestions = [], suggestionsLabel = "Recent", placeholder, onselect, onexpandedchange, expandedWidth = 360, maxResults = 6, anchor = "end", emptyHint = "Try a shorter word or check the spelling.", classNames, class: className, ...rest }: Props = $props();

  const id = $props.id();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);

  let root = $state<HTMLElement>();
  let shell = $state<HTMLElement>();
  let input = $state<HTMLInputElement>();
  let button = $state<HTMLButtonElement>();
  let expanded = $state(false);
  let focused = $state(false);
  let query = $state("");
  let active = $state(-1);
  let open = false;
  let controller = $state.raw<ReturnType<typeof createSearchShell>>();
  /** True while the last highlight move came from the keyboard, so only keyboard moves scroll the list. */
  const keyboard = { current: false };

  onMount(() => {
    const made = createSearchShell(root!, shell!, { expandedWidth: () => expandedWidth, reduced, isOpen: () => open });
    controller = made;
    animate(input!, { opacity: 0 }, { duration: 0 });
    return () => made.destroy();
  });
  $effect(() => {
    void expandedWidth;
    untrack(() => controller)?.measure();
  });
  // The placeholder waits for the shape to start moving, then fades in; on close it leaves first.
  let seen = false;
  $effect(() => {
    const on = expanded;
    if (!seen) return void (seen = true);
    if (input) animate(input, { opacity: on ? 1 : 0 }, on ? { duration: reduced ? 0.15 : 0.2, ease: enter, delay: reduced ? 0 : 0.08 } : { duration: reduced ? 0.1 : 0.08, ease: standard });
  });

  // Focus moves inside the same click, so touch keyboards open; the field is inert until it is made focusable here.
  function expand() {
    if (open) return;
    open = true;
    input!.inert = false;
    expanded = true;
    focused = true;
    input!.focus({ preventScroll: true });
    controller?.open();
    onexpandedchange?.(true);
  }

  function collapse(returnFocus: boolean) {
    if (!open) return;
    open = false;
    expanded = false;
    focused = false;
    query = "";
    active = -1;
    input!.inert = true;
    if (returnFocus) {
      button!.hidden = false;
      button!.focus({ preventScroll: true });
    }
    controller?.close();
    onexpandedchange?.(false);
  }

  const trimmed = $derived(query.trim());
  const results = $derived(trimmed ? rank(items, trimmed, maxResults) : []);
  const mode = $derived<SearchMode | null>(!trimmed ? (suggestions.length ? "suggestions" : null) : results.length ? "results" : "empty");
  const groups = $derived<SearchGroup<ExpandingSearchItem>[]>(mode === "suggestions" ? [{ name: suggestionsLabel, items: suggestions }] : mode === "results" ? groupBy(results, items) : []);
  const flat = $derived(groups.flatMap((group) => group.items));
  const activeIndex = $derived(Math.min(active, flat.length - 1));
  const activeItem = $derived(flat[activeIndex]);
  const optionId = (item: ExpandingSearchItem) => `${id}-${mode}-${item.id}`;
  const listboxId = $derived(`${id}-${mode}-listbox`);
  const panelOpen = $derived(expanded && focused && mode !== null);
  const announcement = $derived(!panelOpen ? "" : mode === "empty" ? `No results for ${trimmed}` : mode === "results" ? `${flat.length} ${flat.length === 1 ? "result" : "results"}` : `${flat.length} ${suggestionsLabel.toLocaleLowerCase()} ${flat.length === 1 ? "item" : "items"}`);

  function choose(item: ExpandingSearchItem) {
    collapse(true);
    onselect?.(item);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      return collapse(true);
    }
    if (!panelOpen || !flat.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      keyboard.current = true;
      active = activeIndex < 0 ? (step > 0 ? 0 : flat.length - 1) : (activeIndex + step + flat.length) % flat.length;
    } else if (event.key === "Enter" && activeItem) {
      event.preventDefault();
      choose(activeItem);
    }
  }

  function onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    query = next;
    active = next.trim() ? 0 : -1;
    keyboard.current = false;
  }

  function onBlur() {
    // Switching windows keeps the search as it was; the field refocuses on return.
    if (!document.hasFocus()) return;
    focused = false;
    if (open && !input?.value.trim()) collapse(false);
  }

  // The clear button scales and blurs in on a spring and leaves a little faster; the panel fades; the view blurs in and pops out of the flow.
  const { blur, duration } = motionTokens;
  const clearHidden = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle };
  const clearRest = { opacity: 1, scale: 1, blur: 0 };
  const clearIn = poseTransition(clearHidden, clearRest, reduced ? { duration: 0.15 } : { spring: "snappy", fade: duration.fast });
  const clearOut = poseTransition(clearHidden, clearRest, { duration: reduced ? 0.1 : duration.instant, ease: "standard" });
  const panelIn = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: reduced ? 0.15 : duration.fast, ease: "enter" });
  const panelOut = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: reduced ? 0.1 : duration.instant, ease: "standard" });
  const viewIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, blur: blur.subtle }, { opacity: 1, blur: 0 }, { duration: reduced ? 0.15 : duration.fast, ease: "enter" });
  const viewOut = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: 0.1, ease: "standard" }, { pop: true });
</script>

<div bind:this={root} {...rest} class={cn(`mc-expanding-search__root ${className ?? ""}`.trim(), "root")} data-anchor={anchor}>
  <div bind:this={shell} class={cn("mc-expanding-search__shell", "shell")} data-expanded={expanded || undefined}>
    <button bind:this={button} type="button" class={cn("mc-expanding-search__trigger", "trigger")} aria-label={label} hidden={expanded} onclick={expand}></button>
    <Search class={cn("mc-expanding-search__icon", "icon")} size={18} strokeWidth={1.75} aria-hidden="true" />
    <input
      bind:this={input}
      class={cn("mc-expanding-search__input", "input")}
      type="text"
      role="combobox"
      inert={!expanded}
      value={query}
      placeholder={placeholder ?? label}
      aria-label={label}
      aria-expanded={panelOpen}
      aria-controls={panelOpen && mode !== "empty" ? listboxId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={panelOpen && activeItem ? optionId(activeItem) : undefined}
      autocomplete="off"
      autocorrect="off"
      spellcheck={false}
      enterkeyhint="search"
      oninput={onInput}
      onfocus={() => (focused = true)}
      onblur={onBlur}
      onkeydown={onKeydown}
    />
    {#if expanded && query}
      <button type="button" tabindex="-1" class={cn("mc-expanding-search__clear", "clear")} aria-label="Clear search" onmousedown={(event) => event.preventDefault()} onclick={() => { query = ""; active = -1; input?.focus({ preventScroll: true }); }} in:clearIn out:clearOut>
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    {/if}
  </div>
  {#if panelOpen && controller}
    <ExpandingSearchPanel width={controller.width} {reduced} {classNames} {panelIn} {panelOut}>
        {#key mode}
          <div class={cn("mc-expanding-search__view", "view")} in:viewIn out:viewOut>
            {#if mode === "empty"}
              <div class={cn("mc-expanding-search__empty", "empty")}><p class={cn("mc-expanding-search__emptyTitle", "emptyTitle")}>No results for “{trimmed}”</p><p class={cn("mc-expanding-search__emptyHint", "emptyHint")}>{emptyHint}</p></div>
            {:else}
              <ExpandingSearchListbox id={listboxId} label={mode === "suggestions" ? suggestionsLabel : `Results for ${trimmed}`} {groups} query={mode === "results" ? trimmed : ""} {activeIndex} {optionId} {keyboard} {classNames} onhover={(index) => (active = index)} onchoose={choose} />
            {/if}
          </div>
        {/key}
    </ExpandingSearchPanel>
  {/if}
  <span class={cn("mc-expanding-search__srOnly", "srOnly")} role="status" aria-live="polite">{announcement}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The root is the lane the field may grow into. Only the shell and the panel take pointer events, so an idle lane never blocks what sits under it. */
.mc-expanding-search__root { position: relative; width: 100%; min-width: var(--control-height-md); height: var(--control-height-md); pointer-events: none; }
/* One shell is both the button and the field. Its width rides a spring and its radius follows the width, from a circle to the control radius. */
.mc-expanding-search__shell { position: absolute; top: 0; right: 0; height: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: calc(var(--control-height-md) / 2 - (var(--control-height-md) / 2 - var(--radius-control)) * var(--es-open, 0)); background: var(--surface); color: var(--text-secondary); pointer-events: auto; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-expanding-search__root[data-anchor="start"] .mc-expanding-search__shell { right: auto; left: 0; }
.mc-expanding-search__shell[data-expanded] { border-color: var(--border-strong); color: var(--foreground); }
.mc-expanding-search__shell:has(> .mc-expanding-search__trigger:focus-visible), .mc-expanding-search__shell:has(> .mc-expanding-search__input:focus) { border-color: var(--foreground); box-shadow: 0 0 0 3px var(--focus-ring); color: var(--foreground); }
@media (hover: hover) and (pointer: fine) {
  .mc-expanding-search__shell:not([data-expanded]):hover { background: var(--surface-muted); color: var(--foreground); }
  .mc-expanding-search__shell[data-expanded]:not(:has(> .mc-expanding-search__input:focus)):hover { border-color: var(--foreground); }
  .mc-expanding-search__clear:hover { background: var(--surface-muted); color: var(--foreground); }
}
/* A compact press while it is still a button; the morph takes over on release. */
.mc-expanding-search__shell:not([data-expanded]):has(> .mc-expanding-search__trigger:active) { transform: scale(.97); transition-duration: var(--duration-fast), var(--duration-fast), var(--duration-fast), var(--duration-standard), var(--duration-instant); }
.mc-expanding-search__trigger { position: absolute; z-index: 1; inset: 0; margin: 0; padding: 0; border: 0; border-radius: inherit; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-expanding-search__trigger:focus-visible { outline: none; }
/* The glass sits at the leading edge, so it is centered in the circle and rides that edge to its place in the open field. */
.mc-expanding-search__icon { position: absolute; top: calc(50% - 9px); left: calc(var(--control-height-md) / 2 - 10px); pointer-events: none; }
.mc-expanding-search__input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0 40px 0 38px; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); letter-spacing: var(--tracking-body); text-overflow: ellipsis; outline: none; }
.mc-expanding-search__input:focus-visible { outline: none; }
.mc-expanding-search__input::placeholder { color: var(--text-muted); opacity: 1; }
.mc-expanding-search__input[inert] { pointer-events: none; }
.mc-expanding-search__clear { position: absolute; z-index: 1; top: calc(50% - 14px); right: 7px; display: grid; width: 28px; height: 28px; place-items: center; margin: 0; padding: 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); -webkit-tap-highlight-color: transparent; }

/* A floating layer: its width is the field's, so it unfolds from the field on first open; its content keeps the final width and rides the leading edge. */
.mc-expanding-search__panel { position: absolute; z-index: 40; top: calc(100% + 8px); right: 0; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); pointer-events: auto; }
.mc-expanding-search__root[data-anchor="start"] .mc-expanding-search__panel { right: auto; left: 0; }
.mc-expanding-search__body { position: relative; width: calc(var(--es-width, 360px) - 2px); max-height: min(22rem, 60vh); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 6px; scrollbar-width: thin; }
.mc-expanding-search__view { position: relative; }
/* A flex gap, not margins: a group popping out while it leaves never lets the next one's margin collapse through the list. */
.mc-expanding-search__listbox { position: relative; isolation: isolate; display: flex; flex-direction: column; gap: 4px; }
.mc-expanding-search__group { position: relative; }
.mc-expanding-search__groupLabel { padding: 8px 12px 4px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); }
/* Nested corners step down from the panel by its inset. The highlight paints under every row's content, so text never hides while it travels. */
.mc-expanding-search__option { position: relative; display: flex; min-height: 48px; align-items: center; gap: 12px; padding: 6px 12px; border-radius: calc(var(--radius-panel) - 6px); color: var(--foreground); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-expanding-search__highlight { position: absolute; z-index: -1; inset: 0; border-radius: inherit; background: color-mix(in oklab, var(--foreground) 6%, transparent); pointer-events: none; }
.mc-expanding-search__optionIcon { display: grid; flex: none; width: 18px; place-items: center; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-expanding-search__option[data-active] .mc-expanding-search__optionIcon { color: var(--foreground); }
.mc-expanding-search__optionText { display: grid; min-width: 0; }
.mc-expanding-search__optionTitle, .mc-expanding-search__optionMeta { overflow: hidden; line-height: var(--leading-body); text-overflow: ellipsis; white-space: nowrap; }
.mc-expanding-search__optionTitle { color: var(--foreground); font-size: var(--text-sm); }
.mc-expanding-search__optionMeta { color: var(--text-muted); font-size: var(--text-xs); }
.mc-expanding-search__mark { background: none; color: var(--foreground); font-weight: 500; }
.mc-expanding-search__empty { display: grid; gap: 2px; padding: 12px 12px 14px; }
.mc-expanding-search__emptyTitle { margin: 0; overflow-wrap: anywhere; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-expanding-search__emptyHint { margin: 0; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-expanding-search__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .mc-expanding-search__shell, .mc-expanding-search__clear, .mc-expanding-search__optionIcon { transition: none; }
  .mc-expanding-search__shell:not([data-expanded]):has(> .mc-expanding-search__trigger:active) { transform: none; }
}
}
</style>
