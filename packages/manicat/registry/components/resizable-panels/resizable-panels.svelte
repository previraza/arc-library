<script lang="ts" module>
  export interface PanelDefinition {
    id: string;
    label: string;
    /** Share of the space it starts with, in percent. */
    defaultSize: number;
    minSize?: number;
    maxSize?: number;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** The panels in order. Each one's content is drawn by the `panel` snippet, which receives its `id`. */
    panels: PanelDefinition[];
    label?: string;
    direction?: "horizontal" | "vertical";
    /** The sizes in percent; they always add up to 100. Bind them with `bind:sizes`. */
    sizes?: number[];
    panel?: Snippet<[string]>;
    /** Extend the inner, named parts of the panels: panel or handle. */
    classNames?: { panel?: string; handle?: string };
  }

  let { panels, label = "Resizable panels", direction = "horizontal", sizes = $bindable(), panel, classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let current = $state(panels.map((entry) => entry.defaultSize));
  const shown = $derived(sizes ?? current);
  let root = $state<HTMLElement>();
  const id = $props.id();
  let origin: { pointer: number; sizes: number[] } | null = null;

  function commit(next: number[]) {
    current = next;
    sizes = next;
  }

  function clampPair(index: number, first: number, base: number[]) {
    const a = panels[index];
    const b = panels[index + 1];
    const sum = base[index] + base[index + 1];
    const low = Math.max(a.minSize ?? 10, sum - (b.maxSize ?? 100));
    const high = Math.min(a.maxSize ?? 100, sum - (b.minSize ?? 10));
    const value = Math.max(low, Math.min(high, first));
    return base.map((size, at) => (at === index ? value : at === index + 1 ? sum - value : size));
  }

  function down(event: PointerEvent) {
    origin = { pointer: direction === "horizontal" ? event.clientX : event.clientY, sizes: [...shown] };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent, index: number) {
    if (!origin || !root) return;
    const box = root.getBoundingClientRect();
    const total = direction === "horizontal" ? box.width : box.height;
    const delta = (((direction === "horizontal" ? event.clientX : event.clientY) - origin.pointer) / total) * 100;
    commit(clampPair(index, origin.sizes[index] + delta, origin.sizes));
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    const step: Record<string, number> = direction === "horizontal" ? { ArrowLeft: -2, ArrowRight: 2 } : { ArrowUp: -2, ArrowDown: 2 };
    const delta = step[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    commit(clampPair(index, shown[index] + delta, shown));
  }
</script>

<div bind:this={root} class={["mc-panels", `mc-panels--${direction}`]} role="group" aria-label={label} style:grid-template={direction === "horizontal" ? `100% / ${shown.map((size) => `minmax(0, ${size}fr)`).join(" ")}` : `${shown.map((size) => `minmax(0, ${size}fr)`).join(" ")} / 100%`}>
  {#each panels as entry, index (entry.id)}
    <section class={["mc-panels__panel", classNames?.panel]} aria-label={entry.label}>{@render panel?.(entry.id)}</section>
    {#if index < panels.length - 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <span
        id="{id}-{index}"
        class={["mc-panels__handle", classNames?.handle]}
        role="separator"
        tabindex="0"
        aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
        aria-label="Resize {entry.label}"
        aria-valuenow={Math.round(shown[index])}
        style="{direction === 'horizontal' ? 'left' : 'top'}: {shown.slice(0, index + 1).reduce((sum, size) => sum + size, 0)}%"
        onpointerdown={down}
        onpointermove={(event) => move(event, index)}
        onpointerup={() => (origin = null)}
        onkeydown={(event) => onKeydown(event, index)}
      ></span>
    {/if}
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Give the container a height. */
.mc-panels { position: relative; display: grid; overflow: hidden; }
.mc-panels__panel { min-width: 0; min-height: 0; overflow: auto; }
.mc-panels__handle { position: absolute; z-index: 2; display: block; outline: none; touch-action: none; }
.mc-panels--horizontal .mc-panels__handle { top: 0; bottom: 0; width: 14px; margin-left: -7px; cursor: col-resize; } .mc-panels--vertical .mc-panels__handle { left: 0; right: 0; height: 14px; margin-top: -7px; cursor: row-resize; }
.mc-panels__handle::after { content: ""; position: absolute; inset: 50% auto auto 50%; border-radius: 2px; background: var(--border-strong); transform: translate(-50%, -50%); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-panels--horizontal .mc-panels__handle::after { width: 4px; height: 28px; } .mc-panels--vertical .mc-panels__handle::after { width: 28px; height: 4px; }
.mc-panels__handle:hover::after, .mc-panels__handle:focus-visible::after { background: var(--foreground); }
@media (prefers-reduced-motion: reduce) { .mc-panels__handle::after { transition: none; } }
}
</style>
