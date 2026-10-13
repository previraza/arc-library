<script lang="ts" module>
  import type { Component } from "svelte";

  export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    icon?: Component;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount, tick } from "svelte";
  import { ChevronRight, File, Folder, FolderOpen } from "@lucide/svelte";
  import { createSelectionGlide } from "@/lib/tabs-motion";
  import { curveOf, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  type VisibleNode = { node: TreeNode; depth: number; parentId?: string; position: number; setSize: number };

  interface Props {
    nodes: TreeNode[];
    defaultExpandedIds?: string[];
    /** The ids of the open folders. Bind them with `bind:expandedIds`; without it the tree keeps its own, starting at `defaultExpandedIds`. */
    expandedIds?: string[];
    onExpandedChange?: (expandedIds: string[]) => void;
    onSelect?: (node: TreeNode) => void;
    "aria-label"?: string;
    class?: string;
    /** Extend the inner, named parts of the tree view: row, item, selection, branch, disclosure, folderGlyph or label. */
    classNames?: { row?: string; item?: string; selection?: string; branch?: string; disclosure?: string; folderGlyph?: string; label?: string };
  }

  let { nodes, defaultExpandedIds = [], expandedIds = $bindable(), onExpandedChange, onSelect, "aria-label": ariaLabel = "File tree", class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  /** A row is 36px plus the 2px gap above it; both collapse together, so nothing snaps when a row leaves. */
  const rowHeight = 38;
  let internal = $state(new Set(defaultExpandedIds));
  let focusedId = $state<string | null>(nodes[0]?.id ?? null);
  let selectedId = $state<string | null>(null);
  /** The folder that opened last; its new children fade in one after another, then everything else stays still. */
  let openedId = $state<string | null>(null);
  let tree = $state<HTMLElement>();
  let glide: ReturnType<typeof createSelectionGlide> | undefined;

  const expanded = $derived(expandedIds ? new Set(expandedIds) : internal);
  function flatten(list: TreeNode[], open: ReadonlySet<string>, depth = 1, parentId?: string): VisibleNode[] {
    return list.flatMap((node, index) => [{ node, depth, parentId, position: index + 1, setSize: list.length }, ...(node.children && open.has(node.id) ? flatten(node.children, open, depth + 1, node.id) : [])]);
  }
  const visible = $derived(flatten(nodes, expanded));
  const focusableId = $derived(visible.some(({ node }) => node.id === focusedId) ? focusedId : (visible[0]?.node.id ?? null));
  const openedIndex = $derived(visible.findIndex(({ node }) => node.id === openedId));
  const delayOf = (index: number) => (openedIndex >= 0 && index > openedIndex ? Math.min(index - openedIndex - 1, 7) * motionTokens.stagger.item : 0);

  function fileTone(label: string) {
    const name = label.toLowerCase();
    if (name.endsWith(".tsx") || name.endsWith(".ts")) return "mc-tree-view__typescript";
    if (name.endsWith(".css")) return "mc-tree-view__stylesheet";
    if (name.endsWith(".md")) return "mc-tree-view__markdown";
    if (name.endsWith(".json")) return "mc-tree-view__json";
    return "mc-tree-view__file";
  }

  function setExpanded(next: Set<string>) {
    internal = next;
    expandedIds = [...next];
    onExpandedChange?.([...next]);
  }
  function toggle(node: TreeNode) {
    if (!node.children?.length) return;
    const next = new Set(expanded);
    if (next.has(node.id)) next.delete(node.id);
    else {
      next.add(node.id);
      openedId = node.id;
    }
    setExpanded(next);
  }
  const rowOf = (id: string) => tree?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
  function focus(id: string) {
    focusedId = id;
    const row = rowOf(id);
    if (row) row.focus();
    else requestAnimationFrame(() => rowOf(id)?.focus());
  }
  function select(node: TreeNode) {
    selectedId = node.id;
    onSelect?.(node);
  }
  function onkeydown(event: KeyboardEvent, item: VisibleNode, index: number) {
    const { node } = item;
    const list = visible;
    if (event.key === "ArrowDown") { event.preventDefault(); focus(list[Math.min(index + 1, list.length - 1)].node.id); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); focus(list[Math.max(index - 1, 0)].node.id); return; }
    if (event.key === "Home") { event.preventDefault(); focus(list[0].node.id); return; }
    if (event.key === "End") { event.preventDefault(); focus(list[list.length - 1].node.id); return; }
    if (event.key === "ArrowRight" && node.children?.length) {
      event.preventDefault();
      if (!expanded.has(node.id)) toggle(node);
      else if (list[index + 1]?.parentId === node.id) focus(list[index + 1].node.id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (node.children?.length && expanded.has(node.id)) toggle(node);
      else if (item.parentId) focus(item.parentId);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(node);
      if (node.children?.length) toggle(node);
    }
  }

  // The selection fill glides between rows. A row that is leaving drops its fill at once, so it never holds the row's exit open.
  onMount(() => {
    glide = createSelectionGlide(tree!, { selectionClass: ["mc-tree-view__selection", classNames?.selection].filter(Boolean).join(" "), reduced, selector: '[role="treeitem"][aria-selected="true"]' });
    glide.update();
    return () => glide?.destroy();
  });
  $effect(() => {
    selectedId;
    visible;
    tick().then(() => glide?.update());
  });

  // A row opens its space in one motion and its new children follow in order; a leaving row closes it.
  function rowIn(node: HTMLElement, { delay }: { delay: number }) {
    if (reduced) return { duration: 0 };
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, delay: delay * 1000, easing, css: (t: number) => `height: ${rowHeight * t}px; overflow: hidden; opacity: ${Math.min(1, t * 4)}; transform: translateX(${-6 * (1 - Math.min(1, t * 2))}px);` };
  }
  function rowOut(node: HTMLElement) {
    node.querySelector('[role="treeitem"]')?.setAttribute("aria-selected", "false");
    glide?.update();
    node.style.pointerEvents = "none";
    if (reduced) return { duration: 0 };
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => `height: ${rowHeight * t}px; overflow: hidden; opacity: ${Math.min(1, t * 6)}; transform: translateX(${-4 * (1 - Math.min(1, t * 6))}px);` };
  }
  function branch(node: HTMLElement, delay: number) {
    if (reduced) return;
    animate(node, { opacity: [0, 1], scaleY: [0, 1] } as never, { duration: duration.standard, ease: [...motionTokens.ease.enter], delay } as never);
  }
  // The disclosure chevron turns a quarter on a spring.
  function disclosure(node: HTMLElement, open: boolean) {
    node.style.transform = `rotate(${open ? 90 : 0}deg)`;
    return {
      update(next: boolean) {
        animate(node, { rotate: next ? 90 : 0 } as never, (reduced ? { duration: 0 } : motionTokens.spring.snappy) as never);
      },
    };
  }
  const glyphIn = poseTransition(reduced ? {} : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { spring: "snappy", fade: duration.fast });
  const glyphOut = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" }, { pop: true })(node);
</script>

<div bind:this={tree} class={["mc-tree-view__tree", className]} role="tree" aria-label={ariaLabel} aria-multiselectable="false">
  {#each visible as item, index (item.node.id)}
    {@const hasChildren = Boolean(item.node.children?.length)}
    {@const isExpanded = hasChildren && expanded.has(item.node.id)}
    {@const Icon = item.node.icon}
    <div class={["mc-tree-view__row", classNames?.row]} in:rowIn={{ delay: delayOf(index) }} out:rowOut>
      <button
        data-id={item.node.id}
        type="button"
        class={["mc-tree-view__item", classNames?.item]}
        role="treeitem"
        aria-level={item.depth}
        aria-posinset={item.position}
        aria-setsize={item.setSize}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={selectedId === item.node.id}
        tabindex={focusableId === item.node.id ? 0 : -1}
        style={`--tree-depth: ${item.depth}`}
        onfocus={() => (focusedId = item.node.id)}
        onkeydown={(event) => onkeydown(event, item, index)}
        onclick={() => { focusedId = item.node.id; select(item.node); if (hasChildren) toggle(item.node); }}
      >
        {#if item.depth > 1}<span use:branch={delayOf(index)} aria-hidden="true" class={["mc-tree-view__branch", classNames?.branch]}></span>{/if}
        <span use:disclosure={isExpanded} class={["mc-tree-view__disclosure", classNames?.disclosure]} aria-hidden="true">{#if hasChildren}<ChevronRight size={14} strokeWidth={1.9} />{/if}</span>
        <span class={["mc-tree-view__icon", hasChildren ? "mc-tree-view__folder" : fileTone(item.node.label)]} aria-hidden="true">
          {#if Icon}<Icon />{:else if hasChildren}
            {#key isExpanded}<span class={["mc-tree-view__folderGlyph", classNames?.folderGlyph]} in:glyphIn out:glyphOut>{#if isExpanded}<FolderOpen size={16} strokeWidth={1.7} />{:else}<Folder size={16} strokeWidth={1.7} />{/if}</span>{/key}
          {:else}<File size={16} strokeWidth={1.7} />{/if}
        </span>
        <span class={["mc-tree-view__label", classNames?.label]}>{item.node.label}</span>
      </button>
    </div>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tree-view__tree { display: block; width: 100%; min-width: 0; box-sizing: border-box; padding: 6px 8px 8px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); color: var(--foreground); overflow: hidden; }
/* Rows clip only while their height animates (Motion sets overflow), so the selection can glide between them unclipped. */
.mc-tree-view__row { position: relative; display: flow-root; min-width: 0; height: 38px; }
.mc-tree-view__item { position: relative; display: flex; width: 100%; min-width: 0; height: 36px; margin-top: 2px; align-items: center; gap: 8px; padding: 0 10px; padding-left: calc(10px + (var(--tree-depth) - 1) * 18px); border: 0; border-radius: 10px; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); line-height: 1; text-align: left; cursor: pointer; outline: none; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
/* Selection changes color only; a heavier weight would reflow the label. */
.mc-tree-view__item[aria-selected="true"] { color: var(--foreground); }
.mc-tree-view__selection { position: absolute; inset: 0; z-index: 0; border-radius: 10px; background: var(--surface-muted); }
.mc-tree-view__branch { position: absolute; top: 4px; bottom: 4px; left: calc(16.5px + (var(--tree-depth) - 2) * 18px); z-index: 1; width: 1px; background: var(--border); transform-origin: top; pointer-events: none; }
.mc-tree-view__disclosure, .mc-tree-view__icon, .mc-tree-view__label { position: relative; z-index: 1; }
.mc-tree-view__disclosure { display: grid; width: 14px; height: 16px; flex: 0 0 14px; place-items: center; color: var(--text-muted); }
.mc-tree-view__icon { display: grid; width: 16px; height: 16px; flex: 0 0 16px; place-items: center; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-tree-view__icon > svg { width: 16px; height: 16px; }
.mc-tree-view__folder { color: var(--text-secondary); }
.mc-tree-view__item[aria-expanded="true"] .mc-tree-view__folder, .mc-tree-view__item[aria-selected="true"] .mc-tree-view__folder { color: var(--foreground); }
.mc-tree-view__folderGlyph { position: absolute; inset: 0; display: grid; place-items: center; }
.mc-tree-view__typescript { color: color-mix(in oklab, #3178c6 78%, var(--foreground)); }
.mc-tree-view__stylesheet { color: color-mix(in oklab, #8b6ace 73%, var(--foreground)); }
.mc-tree-view__markdown { color: color-mix(in oklab, #38896b 74%, var(--foreground)); }
.mc-tree-view__json { color: color-mix(in oklab, #c48637 78%, var(--foreground)); }
/* Its own line height: the row sets 1, and the clipped box (needed for the ellipsis) would cut descenders like g. */
.mc-tree-view__label { min-width: 0; overflow: hidden; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
@media (hover: hover) and (pointer: fine) { .mc-tree-view__item:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-tree-view__item, .mc-tree-view__icon { transition: none; } }
}
</style>
