<script lang="ts" module>
  export type InViewTitleVariant = "word" | "line" | "blur" | "tracking" | "wipe";
</script>

<script lang="ts">
  interface Props {
    text: string;
    variant?: InViewTitleVariant;
    as?: "h1" | "h2" | "h3";
    /** Explicit line breaks for the line variants. */
    lines?: string[];
    /** Reveal once, or every time the title scrolls back into view. */
    once?: boolean;
    /** Extend the inner, named parts of the title: line or piece. */
    classNames?: { line?: string; piece?: string };
  }

  let { text, variant = "blur", as = "h2", lines, once = true, classNames }: Props = $props();

  let shown = $state(false);
  const pieces = $derived(variant === "word" ? text.split(/\s+/).filter(Boolean) : (lines ?? [text]));

  function watch(node: HTMLElement) {
    if (typeof IntersectionObserver === "undefined") {
      shown = true;
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        shown = true;
        if (once) observer.disconnect();
      } else if (!once) shown = false;
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }
</script>

<svelte:element this={as} {@attach watch} class={["mc-title", `mc-title--${variant}`, classNames?.line]} aria-label={text} data-shown={shown || undefined}>
  {#each pieces as piece, index (`${piece}-${index}`)}
    <span aria-hidden="true" class={["mc-title__piece", classNames?.piece]} style="--mc-index: {index}">{piece}{variant === "word" ? " " : ""}</span>
  {/each}
</svelte:element>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-title { margin: 0; font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 600; letter-spacing: var(--tracking-display); line-height: var(--leading-display); text-wrap: balance; }
.mc-title--word .mc-title__piece, .mc-title__piece { display: inline-block; }
.mc-title:not(.mc-title--word) .mc-title__piece { display: block; }
.mc-title__piece { opacity: 0; transform: translateY(.4em); transition: opacity .8s var(--ease-enter) calc(var(--mc-index) * .12s), transform .8s var(--ease-enter) calc(var(--mc-index) * .12s), filter .62s var(--ease-enter) calc(var(--mc-index) * .12s), letter-spacing .8s var(--ease-enter) calc(var(--mc-index) * .12s); }
.mc-title--blur .mc-title__piece { filter: blur(10px); }
.mc-title--tracking .mc-title__piece { letter-spacing: .06em; }
.mc-title--wipe .mc-title__piece { clip-path: inset(0 100% 0 0); transition-property: opacity, transform, clip-path; }
.mc-title[data-shown] .mc-title__piece { opacity: 1; transform: none; filter: none; letter-spacing: inherit; clip-path: inset(0 0 0 0); }
@media (prefers-reduced-motion: reduce) { .mc-title__piece { opacity: 1; transform: none; filter: none; clip-path: none; transition: none; } }
}
</style>
