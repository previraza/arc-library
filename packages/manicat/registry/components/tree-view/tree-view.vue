<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from "vue";
import type { Component } from "vue";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-vue-next";
import { createSelectionGlide } from "@/lib/tabs-motion";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: Component;
}

type VisibleNode = { node: TreeNode; depth: number; parentId?: string; position: number; setSize: number };

const props = withDefaults(
  defineProps<{
    nodes: TreeNode[];
    defaultExpandedIds?: string[];
    "aria-label"?: string;
    /** Extend the inner, named parts of the tree view: row, item, selection, branch, disclosure, folderGlyph or label. */
    classNames?: { row?: string; item?: string; selection?: string; branch?: string; disclosure?: string; folderGlyph?: string; label?: string };
  }>(),
  { defaultExpandedIds: () => [], "aria-label": "File tree" },
);

/** `v-model:expanded` binds the ids of the open folders; without it the tree keeps its own, starting at `defaultExpandedIds`. */
const expandedModel = defineModel<string[] | undefined>("expanded", { default: undefined });
const emit = defineEmits<{ select: [node: TreeNode] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
/** A row is 36px plus the 2px gap above it; both collapse together, so nothing snaps when a row leaves. */
const rowHeight = 38;
const internal = ref(new Set(props.defaultExpandedIds));
const focusedId = ref<string | null>(props.nodes[0]?.id ?? null);
const selectedId = ref<string | null>(null);
/** The folder that opened last; its new children fade in one after another, then everything else stays still. */
const openedId = ref<string | null>(null);
const tree = ref<HTMLElement>();
let glide: ReturnType<typeof createSelectionGlide> | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const expanded = computed(() => (expandedModel.value ? new Set(expandedModel.value) : internal.value));
function flatten(nodes: TreeNode[], open: ReadonlySet<string>, depth = 1, parentId?: string): VisibleNode[] {
  return nodes.flatMap((node, index) => [{ node, depth, parentId, position: index + 1, setSize: nodes.length }, ...(node.children && open.has(node.id) ? flatten(node.children, open, depth + 1, node.id) : [])]);
}
const visible = computed(() => flatten(props.nodes, expanded.value));
const focusableId = computed(() => (visible.value.some(({ node }) => node.id === focusedId.value) ? focusedId.value : (visible.value[0]?.node.id ?? null)));
const openedIndex = computed(() => visible.value.findIndex(({ node }) => node.id === openedId.value));
const delayOf = (index: number) => (openedIndex.value >= 0 && index > openedIndex.value ? Math.min(index - openedIndex.value - 1, 7) * motionTokens.stagger.item : 0);

function fileTone(label: string) {
  const name = label.toLowerCase();
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "mc-tree-view__typescript";
  if (name.endsWith(".css")) return "mc-tree-view__stylesheet";
  if (name.endsWith(".md")) return "mc-tree-view__markdown";
  if (name.endsWith(".json")) return "mc-tree-view__json";
  return "mc-tree-view__file";
}

function setExpanded(next: Set<string>) {
  internal.value = next;
  expandedModel.value = [...next];
}
function toggle(node: TreeNode) {
  if (!node.children?.length) return;
  const next = new Set(expanded.value);
  if (next.has(node.id)) next.delete(node.id);
  else {
    next.add(node.id);
    openedId.value = node.id;
  }
  setExpanded(next);
}
function focus(id: string) {
  focusedId.value = id;
  const row = tree.value?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
  if (row) row.focus();
  else requestAnimationFrame(() => tree.value?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus());
}
function select(node: TreeNode) {
  selectedId.value = node.id;
  emit("select", node);
}
function onKeydown(event: KeyboardEvent, item: VisibleNode, index: number) {
  const { node } = item;
  const list = visible.value;
  if (event.key === "ArrowDown") { event.preventDefault(); focus(list[Math.min(index + 1, list.length - 1)].node.id); return; }
  if (event.key === "ArrowUp") { event.preventDefault(); focus(list[Math.max(index - 1, 0)].node.id); return; }
  if (event.key === "Home") { event.preventDefault(); focus(list[0].node.id); return; }
  if (event.key === "End") { event.preventDefault(); focus(list[list.length - 1].node.id); return; }
  if (event.key === "ArrowRight" && node.children?.length) {
    event.preventDefault();
    if (!expanded.value.has(node.id)) toggle(node);
    else if (list[index + 1]?.parentId === node.id) focus(list[index + 1].node.id);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (node.children?.length && expanded.value.has(node.id)) toggle(node);
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
onMounted(() => {
  glide = createSelectionGlide(tree.value!, { selectionClass: cn("mc-tree-view__selection", props.classNames?.selection), reduced, selector: '[role="treeitem"][aria-selected="true"]:not([data-leaving] *)' });
  glide.update();
  // Rows draw their branch lines and rotate their chevrons as soon as they appear.
  tree.value?.querySelectorAll<HTMLElement>("[data-branch]").forEach((branch) => enterBranch(branch));
});
onBeforeUnmount(() => glide?.destroy());
onUpdated(() => glide?.update());
watch(selectedId, () => glide?.update(), { flush: "post" });

// A row opens its space in one motion and its new children follow in order; a leaving row closes it.
function enterRow(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (reduced) return done();
  const delay = Number(node.dataset.delay ?? 0);
  node.style.overflow = "hidden";
  playPose(node, { opacity: 0, x: -6 }, { opacity: 1, x: 0 }, { duration: duration.fast, ease: "enter", delay });
  animate(node, { height: [0, rowHeight] }, { ...(motionTokens.spring.smooth as object) } as never).finished.then(() => {
    node.style.overflow = "";
    node.style.height = "";
    done();
  });
}
function leaveRow(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.dataset.leaving = "";
  node.style.pointerEvents = "none";
  glide?.update();
  if (reduced) return void animate(node, { opacity: 0 }, { duration: 0 }).finished.then(done);
  node.style.overflow = "hidden";
  playPose(node, { opacity: 1, x: 0 }, { opacity: 0, x: -4 }, { duration: duration.instant, ease: "standard" });
  animate(node, { height: [node.offsetHeight, 0] }, { ...(motionTokens.spring.smooth as object) } as never).finished.then(done);
}
function enterBranch(el: Element) {
  if (reduced) return;
  const node = el as HTMLElement;
  const delay = Number(node.dataset.delay ?? 0);
  animate(node, { opacity: [0, 1], scaleY: [0, 1] } as never, { duration: duration.standard, ease: [...motionTokens.ease.enter], delay } as never);
}
const placeBranch = (el: unknown) => { if (el instanceof HTMLElement && !el.dataset.done) { el.dataset.done = ""; if (tree.value) enterBranch(el); } };
// The folder icon swaps with a pop when it opens or closes.
function enterGlyph(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveGlyph(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return done();
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.6, blur: blur.subtle }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
// The disclosure chevron turns a quarter on a spring.
const rotations = new WeakMap<Element, number>();
function placeDisclosure(el: unknown, open: boolean) {
  if (!(el instanceof HTMLElement)) return;
  const was = rotations.get(el);
  const to = open ? 90 : 0;
  rotations.set(el, to);
  if (was === undefined || was === to) {
    el.style.transform = `rotate(${to}deg)`;
    return;
  }
  animate(el, { rotate: to } as never, (reduced ? { duration: 0 } : motionTokens.spring.snappy) as never);
}
</script>

<template>
  <div ref="tree" :class="cn('mc-tree-view__tree')" role="tree" :aria-label="props['aria-label']" aria-multiselectable="false">
    <TransitionGroup :css="false" tag="div" style="display: contents" @enter="enterRow" @leave="leaveRow">
      <div v-for="(item, index) in visible" :key="item.node.id" :class="cn('mc-tree-view__row', classNames?.row)" :data-delay="delayOf(index)">
        <button
          :data-id="item.node.id"
          type="button"
          :class="cn('mc-tree-view__item', classNames?.item)"
          role="treeitem"
          :aria-level="item.depth"
          :aria-posinset="item.position"
          :aria-setsize="item.setSize"
          :aria-expanded="item.node.children?.length ? expanded.has(item.node.id) : undefined"
          :aria-selected="selectedId === item.node.id"
          :tabindex="focusableId === item.node.id ? 0 : -1"
          :style="{ '--tree-depth': item.depth }"
          @focus="focusedId = item.node.id"
          @keydown="onKeydown($event, item, index)"
          @click="() => { focusedId = item.node.id; select(item.node); if (item.node.children?.length) toggle(item.node); }"
        >
          <span v-if="item.depth > 1" :ref="placeBranch" aria-hidden="true" :class="cn('mc-tree-view__branch', classNames?.branch)" data-branch :data-delay="delayOf(index)" />
          <span :ref="(el) => placeDisclosure(el, Boolean(item.node.children?.length) && expanded.has(item.node.id))" :class="cn('mc-tree-view__disclosure', classNames?.disclosure)" aria-hidden="true"><ChevronRight v-if="item.node.children?.length" :size="14" :stroke-width="1.9" /></span>
          <span :class="['mc-tree-view__icon', item.node.children?.length ? 'mc-tree-view__folder' : fileTone(item.node.label)]" aria-hidden="true">
            <component :is="item.node.icon" v-if="item.node.icon" />
            <Transition v-else-if="item.node.children?.length" :css="false" @enter="enterGlyph" @leave="leaveGlyph"><span :key="expanded.has(item.node.id) ? 'open' : 'closed'" :class="cn('mc-tree-view__folderGlyph', classNames?.folderGlyph)"><FolderOpen v-if="expanded.has(item.node.id)" :size="16" :stroke-width="1.7" /><Folder v-else :size="16" :stroke-width="1.7" /></span></Transition>
            <File v-else :size="16" :stroke-width="1.7" />
          </span>
          <span :class="cn('mc-tree-view__label', classNames?.label)">{{ item.node.label }}</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
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
</style>
