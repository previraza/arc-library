<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { createMark, slot } from "@/lib/pagination";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    /** The current page, counting from 1. Bind it with `bind:page`. */
    page?: number;
    pageCount: number;
    label?: string;
    /** Extend the inner, named parts of the pagination: nav. */
    classNames?: { nav?: string };
  }

  let { page = $bindable(1), pageCount, label = "Pagination", classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration } = motionTokens;
  let nav = $state<HTMLElement>();
  let mark = $state<HTMLElement>();
  let marker: ReturnType<typeof createMark> | undefined;

  const count = $derived(Math.max(0, Math.floor(pageCount)));
  const current = $derived(count > 0 ? Math.min(Math.max(1, Math.floor(page)), count) : 0);
  const start = $derived(count > 0 ? Math.max(1, Math.min(count - 4, current - 2)) : 1);
  const visible = $derived(Array.from({ length: Math.min(count, 5) }, (_, index) => start + index));
  const flip = createFlip(() => [...(nav?.querySelectorAll<HTMLElement>("[data-page]") ?? [])], { reduced, spring: "smooth" });
  // When the five page window shifts, numbers travel like a belt: each one moves by the same number of slots.
  let shift = 0;
  let previousStart = start;
  $effect.pre(() => {
    shift = start - previousStart;
    previousStart = start;
    flip.measure();
  });

  $effect(() => {
    start;
    current;
    flip.play();
    if (nav && mark) {
      if (!marker) marker = createMark(nav, mark, reduced);
      marker.sync();
    }
  });
  $effect(() => () => marker?.destroy());

  const travel = (node: HTMLElement) => (node.offsetWidth * slot) / 100;
  const slideIn = (node: HTMLElement) => poseTransition({ opacity: 0, x: reduced ? 0 : travel(node) * shift }, { opacity: 1, x: 0 }, reduced ? { duration: 0 } : { spring: "smooth", fade: duration.standard })(node);
  const slideOut = (node: HTMLElement) => poseTransition({ opacity: 0, x: reduced ? 0 : travel(node) * -shift }, { opacity: 1, x: 0 }, reduced ? { duration: 0 } : { spring: "smooth", fade: duration.instant }, { pop: true })(node);
</script>

{#if !count}
  <nav class={["mc-pagination__nav", classNames?.nav]} aria-label={label}></nav>
{:else}
  <nav bind:this={nav} class={["mc-pagination__nav", classNames?.nav]} aria-label={label}>
    <button type="button" class="mc-pagination__step" disabled={current <= 1} aria-label="Previous page" onclick={() => (page = current - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
    <span bind:this={mark} aria-hidden="true" class="mc-pagination__mark"></span>
    {#each visible as number (number)}
      <button type="button" data-page aria-label={`Page ${number}`} aria-current={current === number ? "page" : undefined} onclick={() => (page = number)} in:slideIn out:slideOut>{number}</button>
    {/each}
    <button type="button" class="mc-pagination__step" disabled={current >= count} aria-label="Next page" onclick={() => (page = current + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
  </nav>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-pagination__nav { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
.mc-pagination__nav button { position: relative; display: grid; width: var(--control-height-sm); height: var(--control-height-sm); place-items: center; border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); font-variant-numeric: tabular-nums; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-pagination__nav button[aria-current="page"] { color: var(--foreground); }
/* One shared mark travels between pages. Before it has measured (server render), the button draws its own. */
.mc-pagination__mark { position: absolute; top: 0; left: 0; width: var(--control-height-sm); height: var(--control-height-sm); box-sizing: border-box; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); box-shadow: var(--shadow-resting); opacity: 0; pointer-events: none; }
.mc-pagination__nav[data-mark-ready] .mc-pagination__mark { opacity: 1; }
.mc-pagination__nav:not([data-mark-ready]) button[aria-current="page"] { border-color: var(--border); background: var(--surface); box-shadow: var(--shadow-resting); }
/* Only the arrows press in. Page numbers move with Motion, so they keep CSS off transform and opacity. */
.mc-pagination__nav .mc-pagination__step { transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-pagination__nav .mc-pagination__step:active:not(:disabled) { transform: scale(.96); transition-duration: var(--duration-fast), var(--duration-fast), var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard), var(--ease-standard), var(--ease-standard), ease-out; }
.mc-pagination__nav button:disabled { opacity: .4; cursor: not-allowed; }
.mc-pagination__nav button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .mc-pagination__nav button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); }
  .mc-pagination__nav[data-mark-ready] button[aria-current="page"]:hover { background: transparent; }
}
@media (prefers-reduced-motion: reduce) { .mc-pagination__nav button, .mc-pagination__nav .mc-pagination__step { transition: none; } .mc-pagination__nav .mc-pagination__step:active:not(:disabled) { transform: none; } }
}
</style>
