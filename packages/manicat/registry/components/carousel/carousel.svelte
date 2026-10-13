<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    /** Number of slides. Svelte cannot count a snippet's children, so pass it. */
    count: number;
    /** Share of the width each slide takes, as any CSS length, so the next one peeks in. */
    slideSize?: string;
    slideLabel?: (index: number, count: number) => string;
    /** Milliseconds between automatic advances; pauses while hovered or focused. */
    interval?: number;
    autoplay?: boolean;
    /** The current slide's index. Bind it with `bind:index`. Give each slide its own element. */
    index?: number;
    /** Extend the inner, named parts of the carousel: viewport, slide or dots. */
    classNames?: { viewport?: string; slide?: string; dots?: string };
    children?: Snippet;
  }

  let { label, count, slideSize = "72%", slideLabel, interval = 5000, autoplay = false, index = $bindable(0), classNames, children }: Props = $props();

  let viewport = $state<HTMLElement>();
  let paused = $state(false);

  const labelOf = (at: number) => (slideLabel ? slideLabel(at, count) : `Slide ${at + 1} of ${count}`);

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(count - 1, next));
    index = clamped;
    const slide = viewport?.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function onScroll() {
    const box = viewport;
    if (!box) return;
    const slide = box.children[0] as HTMLElement | undefined;
    if (!slide) return;
    const at = Math.round(box.scrollLeft / (slide.offsetWidth + 12));
    if (at !== index) index = at;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") goTo(index + 1);
    else if (event.key === "ArrowLeft") goTo(index - 1);
    else return;
    event.preventDefault();
  }

  $effect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => !paused && goTo((index + 1) % Math.max(1, count)), interval);
    return () => clearInterval(timer);
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="mc-carousel" role="group" aria-roledescription="carousel" aria-label={label} onpointerenter={() => (paused = true)} onpointerleave={() => (paused = false)} onfocusin={() => (paused = true)} onfocusout={() => (paused = false)} onkeydown={onKeydown}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div bind:this={viewport} class={["mc-carousel__viewport", classNames?.viewport]} role="presentation" tabindex="0" style:--mc-slide={slideSize} onscroll={onScroll}>
    {@render children?.()}
  </div>
  <div class={["mc-carousel__dots", classNames?.dots]}>
    {#each { length: count } as _, at (at)}
      <button type="button" aria-label={labelOf(at)} aria-current={index === at} onclick={() => goTo(at)}></button>
    {/each}
  </div>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Each direct child of the default slot is a slide. */
.mc-carousel { display: grid; gap: var(--space-3); container-type: inline-size; }
.mc-carousel__viewport { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; outline: none; }
.mc-carousel__viewport::-webkit-scrollbar { display: none; }
.mc-carousel__viewport > * { flex: 0 0 var(--mc-slide, 72%); scroll-snap-align: start; }
.mc-carousel__viewport:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: var(--radius-panel); }
.mc-carousel__dots { display: flex; justify-content: center; gap: 8px; }
.mc-carousel__dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 50%; background: var(--border-strong); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
.mc-carousel__dots button[aria-current="true"] { background: var(--foreground); transform: scale(1.25); }
@media (prefers-reduced-motion: reduce) { .mc-carousel__viewport { scroll-behavior: auto; } .mc-carousel__dots button { transition: none; } }
}
</style>
