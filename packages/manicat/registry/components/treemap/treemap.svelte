<script lang="ts" module>
  export interface TreemapNode {
    id: string;
    label: string;
    value?: number;
    /** A second measure drawn as colour, such as growth. Negative reads red, positive green. */
    color?: number;
    children?: TreemapNode[];
  }
</script>

<script lang="ts">
  import { squarify } from "@/lib/chart";

  interface Props {
    data: TreemapNode;
    label: string;
    formatValue?: (value: number) => string;
    colorLabel?: string;
    formatColor?: (value: number) => string;
    colorDomain?: [number, number];
    height?: number;
    emptyLabel?: string;
    /** Extend the inner, named parts of the treemap: cell, crumb or readout. */
    classNames?: { cell?: string; crumb?: string; readout?: string };
  }

  let { data, label, formatValue, colorLabel = "Change", formatColor, colorDomain = [-50, 100], height = 240, emptyLabel = "No data yet", classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let trail = $state<TreemapNode[]>([data]);
  let active = $state<string | null>(null);
  let width = $state(0);

  const fmt = (n: number) => (formatValue ? formatValue(n) : n.toLocaleString());
  const fmtColor = (n: number) => (formatColor ? formatColor(n) : `${n > 0 ? "+" : ""}${n}%`);
  const sum = (node: TreemapNode): number => node.value ?? (node.children ?? []).reduce((total, child) => total + sum(child), 0);
  const current = $derived(trail[trail.length - 1]);
  const children = $derived((current.children ?? []).filter((child) => sum(child) > 0));
  const rects = $derived(squarify(children.map(sum), { x: 0, y: 0, width: width || 600, height }));
  const picked = $derived(children.find((child) => child.id === active));

  function tone(value?: number) {
    if (value === undefined) return undefined;
    const [lo, hi] = colorDomain;
    const amount = Math.round(Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value >= 0 ? hi : lo))) * 70) + 10;
    return `color-mix(in oklab, var(${value >= 0 ? "--success" : "--danger"}) ${amount}%, var(--surface))`;
  }

  function open(child: TreemapNode) {
    if (child.children?.length) trail = [...trail, child];
    else active = active === child.id ? null : child.id;
  }
</script>

<figure class="mc-treemap">
  <nav class="mc-treemap__crumbs" aria-label="Treemap path">
    {#each trail as node, index (node.id)}
      <button type="button" class={["mc-treemap__crumb", classNames?.crumb]} aria-current={index === trail.length - 1 ? "location" : undefined} disabled={index === trail.length - 1} onclick={() => (trail = trail.slice(0, index + 1))}>{index === 0 ? label : node.label}</button>
    {/each}
  </nav>
  <p class={["mc-treemap__readout", classNames?.readout]} aria-live="polite">{picked ? `${picked.label}: ${fmt(sum(picked))}${picked.color !== undefined ? ` · ${colorLabel} ${fmtColor(picked.color)}` : ""}` : `${fmt(sum(current))} total`}</p>
  {#if children.length === 0}
    <p class="mc-treemap__empty">{emptyLabel}</p>
  {:else}
    <div class="mc-treemap__box" style="height: {height}px" {@attach (node) => {
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(([entry]) => (width = entry.contentRect.width));
      observer.observe(node);
      return () => observer.disconnect();
    }}>
      {#each children as child, index (child.id)}
        <button
          type="button"
          class={["mc-treemap__cell", classNames?.cell]}
          aria-label="{child.label}, {fmt(sum(child))}{child.color !== undefined ? `, ${colorLabel} ${fmtColor(child.color)}` : ''}"
          data-active={active === child.id || undefined}
          style="left: {rects[index].x}px; top: {rects[index].y}px; width: {Math.max(0, rects[index].width - 2)}px; height: {Math.max(0, rects[index].height - 2)}px; background: {tone(child.color) ?? `color-mix(in oklab, var(--series-${(index % 4) + 1}) 20%, var(--surface))`}"
          onclick={() => open(child)}
          onpointerenter={() => (active = child.id)}
          onpointerleave={() => (active = null)}
        >
          {#if rects[index].width > 54 && rects[index].height > 32}<span>{child.label}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-treemap { display: grid; gap: var(--space-2); margin: 0; width: 100%; }
.mc-treemap__crumbs { display: flex; flex-wrap: wrap; gap: 6px; }
.mc-treemap__crumb { padding: 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-treemap__crumb:not(:last-child)::after { content: "›"; margin-left: 6px; color: var(--text-muted); }
.mc-treemap__crumb[aria-current] { color: var(--foreground); font-weight: 600; cursor: default; }
.mc-treemap__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-treemap__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-treemap__box { position: relative; }
.mc-treemap__cell { position: absolute; display: flex; align-items: flex-start; padding: 6px; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; color: var(--foreground); font: inherit; font-size: 11px; font-weight: 500; text-align: left; cursor: pointer; transition: left .4s var(--ease-standard), top .4s var(--ease-standard), width .4s var(--ease-standard), height .4s var(--ease-standard); }
.mc-treemap__cell[data-active], .mc-treemap__cell:focus-visible { border-color: var(--foreground); outline: none; }
@media (prefers-reduced-motion: reduce) { .mc-treemap__cell { transition: none; } }
}
</style>
