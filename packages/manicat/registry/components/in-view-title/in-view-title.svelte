<script lang="ts" module>
  export type InViewTitleVariant = "word" | "line" | "blur" | "tracking" | "wipe";
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createInViewTitle } from "@/lib/in-view-title";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    text: string;
    variant?: InViewTitleVariant;
    as?: "h1" | "h2" | "h3";
    /** Explicit line breaks for the line variant. */
    lines?: string[];
    id?: string;
    class?: string;
    /** Reveal once, or every time the title scrolls back into view. */
    once?: boolean;
    /** Extend the inner, named parts of the title: wrap, clip, part, lineClip, blurWord, trackWord or wipe. */
    classNames?: { wrap?: string; clip?: string; part?: string; lineClip?: string; blurWord?: string; trackWord?: string; wipe?: string };
    [key: string]: unknown;
  }

  let { text, variant = "blur", as = "h2", lines, id, class: className, once = true, classNames, ...rest }: Props = $props();

  let wrap: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let title: ReturnType<typeof createInViewTitle> | undefined;

  const words = $derived(text.split(" ").filter(Boolean));
  const titleLines = $derived(lines?.length ? lines : [text]);
  const step = $derived(Math.min(motionTokens.stagger.word * 1.5, 0.4 / Math.max(words.length, 1)));
  /** Horizontal distance each letter travels per step from its word's center in the tracking variant. */
  const TRACK_EM = 0.06;
  const letters = (word: string) => Array.from(word);
  const offset = (word: string, index: number) => ((letters(word).length - 1) / 2 - index) * TRACK_EM;

  // A new text or variant renders new parts, which pick up where the old ones were.
  onMount(() => {
    title = createInViewTitle(wrap, { once, reduced });
    return () => title?.destroy();
  });
  let mounted = false;
  $effect(() => {
    text;
    variant;
    lines;
    once;
    if (!mounted) {
      mounted = true;
      return;
    }
    const showing = title?.visible();
    title?.destroy();
    title = createInViewTitle(wrap, { once, reduced, visible: showing });
  });
</script>

<div bind:this={wrap} {...rest} class={["mc-in-view-title__wrap", classNames?.wrap, className]}>
  {#if variant === "word"}
    <svelte:element this={as} {id} aria-label={text}>
      {#each words as word, index (`${word}-${index}`)}<span class={["mc-in-view-title__clip", classNames?.clip]} aria-hidden="true"><span class={["mc-in-view-title__part", classNames?.part]} data-reveal="word" data-delay={index * step}>{word}</span></span>{index < words.length - 1 ? " " : ""}{/each}
    </svelte:element>
  {:else if variant === "line"}
    <svelte:element this={as} {id} aria-label={text}>
      {#each titleLines as line, index (`${line}-${index}`)}<span class={["mc-in-view-title__lineClip", classNames?.lineClip]} aria-hidden="true"><span class={["mc-in-view-title__part", classNames?.part]} data-reveal="line" data-delay={index * motionTokens.stagger.line} data-settle="0.86">{line}</span></span>{/each}
    </svelte:element>
  {:else if variant === "blur"}
    <svelte:element this={as} {id} aria-label={text}>
      {#each words as word, index (`${word}-${index}`)}<span class={["mc-in-view-title__blurWord", classNames?.blurWord, "mc-in-view-title__part", classNames?.part]} aria-hidden="true" data-reveal="blur" data-delay={index * step}>{word}</span>{index < words.length - 1 ? " " : ""}{/each}
    </svelte:element>
  {:else if variant === "tracking"}
    <svelte:element this={as} {id} aria-label={text}>
      {#each words as word, index (`${word}-${index}`)}<span class={["mc-in-view-title__trackWord", classNames?.trackWord, "mc-in-view-title__part", classNames?.part]} aria-hidden="true" data-reveal="track-word" data-delay={index * motionTokens.stagger.char * 2} data-settle="0.9">{#each letters(word) as letter, letterIndex (letterIndex)}<span class={["mc-in-view-title__part", classNames?.part]} data-reveal="track-letter" data-delay={index * motionTokens.stagger.char * 2} data-settle="1" data-offset={offset(word, letterIndex)}>{letter}</span>{/each}</span>{index < words.length - 1 ? " " : ""}{/each}
    </svelte:element>
  {:else}
    <!-- A soft edged mask sweeps across the title instead of a hard clip, so no letter is ever cut mid stroke. -->
    <div class={["mc-in-view-title__wipe", classNames?.wipe, "mc-in-view-title__part", classNames?.part]} data-reveal="wipe" data-delay="0" data-settle="0.9"><svelte:element this={as} {id}>{text}</svelte:element></div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-in-view-title__wrap { min-width: 0; color: var(--foreground); }
/* Clips hide the rise; padding with matching negative margins leaves room for descenders and blur without changing layout. */
.mc-in-view-title__clip { display: inline-block; overflow: hidden; vertical-align: top; padding: .08em .14em .2em; margin: -.08em -.14em -.2em; }
.mc-in-view-title__lineClip { display: block; overflow: hidden; padding: .06em .12em .18em; margin: -.06em -.12em -.18em; }
.mc-in-view-title__clip > span, .mc-in-view-title__lineClip > span, .mc-in-view-title__blurWord, .mc-in-view-title__trackWord, .mc-in-view-title__trackWord > span { display: inline-block; }
.mc-in-view-title__trackWord { white-space: nowrap; }
/* The wipe mask is 2.3 times the title's width with a feathered middle, so the soft edge sits fully outside the title at both ends of the sweep.
   Padding with matching negative margins keeps descenders and overhangs inside the masked box without changing layout. */
.mc-in-view-title__wipe { padding: .1em .12em .22em; margin: -.1em -.12em -.22em; mask-image: linear-gradient(90deg, #000 44%, transparent 56%); mask-size: 230% 100%; mask-repeat: no-repeat; mask-position: var(--wipe, 0%) 0; }
/* Server rendered titles start hidden. If scripts have not taken over after 2.4s, show them anyway; the class is removed on hydration. */
.mc-in-view-title__pending .mc-in-view-title__part { animation: mc-in-view-title-settle .4s var(--ease-enter) 2.4s forwards; }
@keyframes mc-in-view-title-settle { to { opacity: 1; transform: none; filter: none; --wipe: 0%; mask-image: none; } }
@media (prefers-reduced-motion: reduce) { .mc-in-view-title__part { opacity: 1 !important; transform: none !important; filter: none !important; mask-image: none !important; } .mc-in-view-title__pending .mc-in-view-title__part { animation: none; } }
}
</style>
