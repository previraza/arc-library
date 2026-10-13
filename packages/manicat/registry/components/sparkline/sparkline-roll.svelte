<script lang="ts">
  // @manicat-dependencies motion
  import { animate, motionValue } from "motion";
  import { amountIn, chunksOf } from "@/lib/sparkline";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** Text that changes rolls in place, like a numeric content transition; `morph` springs the wrapper to the new width so nothing beside it jumps. */
  let { text, direction, whole = false, morph = false, tone }: { text: string; direction?: number; whole?: boolean; morph?: boolean; tone?: string } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let root: HTMLElement;
  let sizer = $state<HTMLElement>();
  let shownDirection = 1;
  let previous = text;
  $effect.pre(() => {
    if (text !== previous) shownDirection = direction ?? (amountIn(text) < amountIn(previous) ? -1 : 1);
    previous = text;
  });
  const numeric = $derived(!whole && !/\p{L}/u.test(text));
  const chunks = $derived(chunksOf(text, whole));

  // Layout size, not the transformed rect, so a scaling parent never leaves the text clipped. Only a new text springs; font loads jump.
  const width = motionValue<number | "auto">("auto");
  width.on("change", (value) => morph && root && (root.style.width = typeof value === "number" ? `${value}px` : value));
  $effect(() => {
    const node = sizer;
    if (!node) return;
    let measured: string | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize?.[0]?.inlineSize ?? node.offsetWidth;
      if (measured !== null && measured !== node.textContent && !reduced) animate(width as never, next, motionTokens.spring.morph as never);
      else width.jump(next);
      measured = node.textContent;
    });
    observer.observe(node);
    return () => observer.disconnect();
  });

  // Copy that holds a number enters from the side it moved toward: a larger value rises from below, a smaller one drops from above.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const rollIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3 * shownDirection), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const rollOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3 * shownDirection), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
</script>

<span bind:this={root} class="mc-sparkline__roll" data-end={numeric || undefined} data-whole={whole || undefined}>
  {#if morph}<span bind:this={sizer} class="mc-sparkline__sizer" aria-hidden="true">{text}</span>{/if}
  <!-- One flex item holds the pieces, so they stay inline and the text reads and copies as one string. -->
  <span class="mc-sparkline__track">
    {#each chunks as chunk (chunk.slot)}
      <span class="mc-sparkline__slot" in:rollIn out:rollOut>
        {#key `${tone ?? ""}${chunk.key}`}<span class={tone ? `mc-sparkline__glyph ${tone}` : "mc-sparkline__glyph"} in:rollIn out:rollOut>{chunk.text}</span>{/key}
      </span>
    {/each}
  </span>
</span>
