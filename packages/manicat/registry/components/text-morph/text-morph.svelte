<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { HANDOFF, createMorphFrame, toGlyphs } from "@/lib/text-morph";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    /** The label to show. */
    text: string;
    as?: "span" | "div" | "p" | "strong" | "h1" | "h2" | "h3";
    class?: string;
    id?: string;
    /** Extend the inner, named parts of the text morph: frame, track or glyph. */
    classNames?: { frame?: string; track?: string; glyph?: string };
    [key: string]: unknown;
  }

  let { text, as = "span", class: className, id, classNames, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, stagger, blur } = { ...motionTokens, blur: motionTokens.blur.soft };
  let frame: HTMLElement;
  let track: HTMLElement;
  let morph: ReturnType<typeof createMorphFrame> | undefined;

  const label = $derived(text);
  const glyphs = $derived(toGlyphs(label));
  // The previous label tells which letters are new, so only they stagger, in reading order, however far along the word they sit.
  let kept = new Set(toGlyphs(label).map((glyph) => glyph.key));
  let before = label;
  $effect.pre(() => {
    if (label !== before) {
      kept = new Set(toGlyphs(before).map((glyph) => glyph.key));
      before = label;
      flip.measure();
    }
  });
  const order = $derived.by(() => {
    let entering = 0;
    return new Map(glyphs.map(({ key }) => [key, kept.has(key) ? 0 : entering++]));
  });

  const flip = createFlip(() => [...(track?.querySelectorAll<HTMLElement>("[data-glyph]") ?? [])], { reduced });
  $effect(() => {
    label;
    flip.play();
    morph?.update();
  });
  onMount(() => {
    morph = createMorphFrame(frame, track, reduced);
    morph.update();
    return () => morph?.destroy();
  });

  const glyphIn = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, scale: 0.8, y: parseFloat(getComputedStyle(node).fontSize) * 0.14, blur }, { opacity: 1, scale: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard + 0.04, ease: "enter", delay: HANDOFF + Math.min(Number(node.dataset.order ?? 0), 8) * stagger.char * 2 })(node);
  const glyphOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: parseFloat(getComputedStyle(node).fontSize) * -0.1, blur }, { opacity: 1, scale: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.exit, ease: "standard" }, { pop: true })(node);
</script>

<svelte:element this={as} {...rest} {id} class={className}>
  <span class="mc-text-morph__srOnly">{label}</span>
  <span bind:this={frame} class={["mc-text-morph__frame", classNames?.frame]} aria-hidden="true"><span bind:this={track} class={["mc-text-morph__track", classNames?.track]}>
    {#each glyphs as { char, key } (key)}
      <span data-glyph data-order={order.get(key)} class={["mc-text-morph__glyph", classNames?.glyph]} in:glyphIn out:glyphOut>{char === " " ? "\u00a0" : char}</span>
    {/each}
  </span></span>
</svelte:element>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame carries the animated width. Its mask reveals new letters through a soft trailing edge as it grows and fades leaving ones as it shrinks.
   Padding with matching negative margins gives the mask room for blur and descenders without changing layout; the edge sits entirely in that room, so resting text is never dimmed.
   The track always starts at the frame's leading edge, even in centered text: otherwise it would recenter inside the old width and leaving letters would jump. */
.mc-text-morph__frame.mc-text-morph__frame, .mc-text-morph__frame { position: relative; display: inline-block; box-sizing: content-box; padding: .5em .5em .5em .2em; margin: -.5em -.5em -.5em -.2em; text-align: start; white-space: nowrap; mask-image: linear-gradient(90deg, #000 calc(100% - .5em), transparent); }
/* The track sizes to the letters in flow. Leaving letters are taken out of flow and positioned against it. */
.mc-text-morph__track { position: relative; display: inline-block; white-space: nowrap; }
.mc-text-morph__glyph { display: inline-block; white-space: pre; transform-origin: 50% 60%; }
.mc-text-morph__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; user-select: none; }
}
</style>
