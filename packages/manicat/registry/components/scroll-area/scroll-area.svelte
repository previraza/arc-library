<script lang="ts" module>
  export type { ScrollAreaEdges } from "@/lib/scroll-area";
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createScrollArea } from "@/lib/scroll-area";
  import type { ScrollAreaEdges } from "@/lib/scroll-area";

  interface Props {
    children?: Snippet;
    /** Axes that scroll. Defaults to vertical. */
    orientation?: "vertical" | "horizontal" | "both";
    /** Length of the edge fade in px. 0 turns the fades off. */
    fade?: number;
    /** "auto" shows scrollbars while scrolling or hovering; "always" keeps them visible when content overflows. */
    scrollbars?: "auto" | "always";
    /** How long scrollbars linger after scrolling stops, in ms. */
    hideDelay?: number;
    /** Maximum height of the viewport, for vertical areas that should grow with their content. */
    maxHeight?: number | string;
    /** Passed to the viewport's `scroll-snap-type`, for example "x mandatory". Children set their own `scroll-snap-align`. */
    snap?: string;
    /** Accessible name. The viewport becomes a labelled, focusable region that arrow and page keys scroll. */
    label?: string;
    /** Turns vertical wheel movement into horizontal scrolling for horizontal areas. Defaults to true. */
    wheelToHorizontal?: boolean;
    class?: string;
    viewportClass?: string;
    viewportStyle?: string;
    viewport?: HTMLElement | null;
    onscroll?: (event: Event) => void;
    /** Called when content starts or stops extending past an edge. */
    onEdgeChange?: (edges: ScrollAreaEdges) => void;
    /** Extend the inner, named parts of the scroll area: viewport, track or thumb. */
    classNames?: { viewport?: string; track?: string; thumb?: string };
    [key: string]: unknown;
  }

  let { children, orientation = "vertical", fade = 28, scrollbars = "auto", hideDelay = 900, maxHeight, snap, label, wheelToHorizontal = true, class: className, viewportClass, viewportStyle, viewport = $bindable(null), onscroll, onEdgeChange, classNames, ...rest }: Props = $props();

  let root: HTMLElement;
  let viewportEl: HTMLElement;
  let trackY = $state<HTMLElement>();
  let trackX = $state<HTMLElement>();
  let thumbY = $state<HTMLElement>();
  let thumbX = $state<HTMLElement>();
  let area: ReturnType<typeof createScrollArea> | undefined;

  const vertical = $derived(orientation !== "horizontal");
  const horizontal = $derived(orientation !== "vertical");
  const options = () => ({ orientation, fade, hideDelay, wheelToHorizontal, onEdgeChange });
  const style = $derived(`${maxHeight !== undefined ? `max-height: ${typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight};` : ""}${snap ? `scroll-snap-type: ${snap};` : ""}${viewportStyle ?? ""}`);

  onMount(() => {
    viewport = viewportEl;
    area = createScrollArea(root, viewportEl, { y: trackY ?? null, x: trackX ?? null }, { y: thumbY ?? null, x: thumbX ?? null }, options());
    return () => area?.destroy();
  });
  $effect(() => {
    orientation;
    fade;
    hideDelay;
    wheelToHorizontal;
    area?.update(options());
  });
</script>

<div bind:this={root} {...rest} class={["mc-scroll-area__root", className]} data-orientation={orientation} data-scrollbars={scrollbars}>
  <div bind:this={viewportEl} class={["mc-scroll-area__viewport", viewportClass, classNames?.viewport]} data-fade={fade > 0 ? orientation : undefined} {style} tabindex="0" role={label ? "region" : undefined} aria-label={label} {onscroll}>
    {@render children?.()}
  </div>
  {#if vertical}<div bind:this={trackY} class={["mc-scroll-area__track", classNames?.track]} data-axis="y" data-hidden="" aria-hidden="true"><div bind:this={thumbY} class={["mc-scroll-area__thumb", classNames?.thumb]}></div></div>{/if}
  {#if horizontal}<div bind:this={trackX} class={["mc-scroll-area__track", classNames?.track]} data-axis="x" data-hidden="" aria-hidden="true"><div bind:this={thumbX} class={["mc-scroll-area__thumb", classNames?.thumb]}></div></div>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-scroll-area__root { position: relative; display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; }

/* Native scrolling with the platform scrollbars hidden; the overlay bars below replace them. */
.mc-scroll-area__viewport {
  --fade-top: 0px; --fade-bottom: 0px; --fade-left: 0px; --fade-right: 0px;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.mc-scroll-area__viewport::-webkit-scrollbar { display: none; }
.mc-scroll-area__root[data-orientation="vertical"] > .mc-scroll-area__viewport { overflow-x: hidden; overflow-y: auto; }
.mc-scroll-area__root[data-orientation="horizontal"] > .mc-scroll-area__viewport { overflow-x: auto; overflow-y: hidden; }
.mc-scroll-area__root[data-orientation="both"] > .mc-scroll-area__viewport { overflow: auto; }

/* Each fade is exactly as long as the content hidden past that edge, up to the fade size, so it grows in with the first pixels of scroll. */
.mc-scroll-area__viewport[data-fade="vertical"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent);
}
.mc-scroll-area__viewport[data-fade="horizontal"] {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent);
}
.mc-scroll-area__viewport[data-fade="both"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent), linear-gradient(to right, transparent, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to bottom, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent), linear-gradient(to right, transparent, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent);
  mask-composite: intersect;
}

/* Overlay scrollbars: a generous hit area around a thin pill that thickens under the pointer. */
.mc-scroll-area__track {
  position: absolute;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  touch-action: none;
  transition: opacity var(--duration-considered) var(--ease-standard);
}
.mc-scroll-area__track[data-axis="y"] { top: 3px; right: 1px; bottom: 3px; width: 11px; }
.mc-scroll-area__track[data-axis="x"] { right: 3px; bottom: 1px; left: 3px; height: 11px; }
.mc-scroll-area__root[data-orientation="both"] > .mc-scroll-area__track[data-axis="y"] { bottom: 13px; }
.mc-scroll-area__root[data-orientation="both"] > .mc-scroll-area__track[data-axis="x"] { right: 13px; }
.mc-scroll-area__track[data-hidden] { display: none; }

.mc-scroll-area__thumb { position: absolute; top: 0; left: 0; will-change: transform; }
.mc-scroll-area__track[data-axis="y"] .mc-scroll-area__thumb { width: 100%; }
.mc-scroll-area__track[data-axis="x"] .mc-scroll-area__thumb { height: 100%; }
.mc-scroll-area__thumb::after {
  content: "";
  position: absolute;
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--foreground) 30%, transparent);
  transition: width var(--duration-fast) var(--ease-standard), height var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard);
}
.mc-scroll-area__track[data-axis="y"] .mc-scroll-area__thumb::after { top: 0; right: 3px; bottom: 0; width: 5px; }
.mc-scroll-area__track[data-axis="x"] .mc-scroll-area__thumb::after { right: 0; bottom: 3px; left: 0; height: 5px; }

/* Visible while scrolling, while the pointer is over the area, and always when asked. Appearing is quick; leaving lingers. */
.mc-scroll-area__root[data-scrolling] > .mc-scroll-area__track,
.mc-scroll-area__root[data-dragging] > .mc-scroll-area__track,
.mc-scroll-area__root[data-scrollbars="always"] > .mc-scroll-area__track { opacity: 1; pointer-events: auto; transition-duration: var(--duration-fast); }

@media (hover: hover) and (pointer: fine) {
  .mc-scroll-area__root:hover > .mc-scroll-area__track { opacity: 1; pointer-events: auto; transition-duration: var(--duration-fast); }
  .mc-scroll-area__track:hover .mc-scroll-area__thumb::after,
  .mc-scroll-area__root[data-dragging] .mc-scroll-area__thumb::after { background: color-mix(in oklab, var(--foreground) 46%, transparent); }
  .mc-scroll-area__track[data-axis="y"]:hover .mc-scroll-area__thumb::after,
  .mc-scroll-area__root[data-dragging="y"] .mc-scroll-area__track[data-axis="y"] .mc-scroll-area__thumb::after { width: 7px; right: 2px; }
  .mc-scroll-area__track[data-axis="x"]:hover .mc-scroll-area__thumb::after,
  .mc-scroll-area__root[data-dragging="x"] .mc-scroll-area__track[data-axis="x"] .mc-scroll-area__thumb::after { height: 7px; bottom: 2px; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-scroll-area__track, .mc-scroll-area__thumb::after { transition: none; }
}
}
</style>
