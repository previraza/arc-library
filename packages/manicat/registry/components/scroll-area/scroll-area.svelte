<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    orientation?: "vertical" | "horizontal" | "both";
    /** Height at which the content starts to scroll, as any CSS length. */
    maxHeight?: string | number;
    /** Size in pixels of the fade that hints there is more content past an edge. */
    fade?: number;
    label?: string;
    /** Called when an edge opens or closes, with which edges have more content past them. */
    onedgechange?: (edges: { top: boolean; bottom: boolean; left: boolean; right: boolean }) => void;
    /** Extend the inner, named parts of the area: viewport. */
    classNames?: { viewport?: string };
    children?: Snippet;
  }

  let { orientation = "vertical", maxHeight, fade = 24, label, onedgechange, classNames, children }: Props = $props();

  let viewport = $state<HTMLElement>();
  let edges = $state({ top: false, bottom: false, left: false, right: false });

  // An edge is "open" when there is more content beyond it, which is where the fade shows.
  function measure() {
    const node = viewport;
    if (!node) return;
    edges = {
      top: node.scrollTop > 1,
      bottom: node.scrollTop + node.clientHeight < node.scrollHeight - 1,
      left: node.scrollLeft > 1,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
    };
    onedgechange?.(edges);
  }

  $effect(() => {
    measure();
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={viewport}
  role="region"
  tabindex="0"
  aria-label={label}
  class={["mc-scroll", `mc-scroll--${orientation}`, classNames?.viewport]}
  data-top={edges.top || undefined}
  data-bottom={edges.bottom || undefined}
  data-left={edges.left || undefined}
  data-right={edges.right || undefined}
  style:max-height={typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}
  style:--mc-fade="{fade}px"
  onscroll={measure}
>
  {@render children?.()}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-scroll { overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; outline: none; }
.mc-scroll--vertical { overflow-x: hidden; } .mc-scroll--horizontal { overflow-y: hidden; }
.mc-scroll[data-top], .mc-scroll[data-bottom] { --mc-top: transparent; --mc-bottom: transparent; }
.mc-scroll--vertical[data-bottom]:not([data-top]) { mask-image: linear-gradient(to bottom, black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--vertical[data-top]:not([data-bottom]) { mask-image: linear-gradient(to bottom, transparent, black var(--mc-fade)); }
.mc-scroll--vertical[data-top][data-bottom] { mask-image: linear-gradient(to bottom, transparent, black var(--mc-fade), black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--horizontal[data-right]:not([data-left]) { mask-image: linear-gradient(to right, black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll--horizontal[data-left]:not([data-right]) { mask-image: linear-gradient(to right, transparent, black var(--mc-fade)); }
.mc-scroll--horizontal[data-left][data-right] { mask-image: linear-gradient(to right, transparent, black var(--mc-fade), black calc(100% - var(--mc-fade)), transparent); }
.mc-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
}
</style>
