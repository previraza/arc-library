<script lang="ts">
  // @manicat-dependencies motion
  import AnimatedCounter from "@/registry/components/animated-counter/animated-counter.svelte";
  import { createLabelSwap, followWidth, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    value: number;
    suffix?: string;
    context: string;
    change?: string;
    /** Extend the inner, named parts of the metric card: card or top. */
    classNames?: { card?: string; top?: string };
  }

  let { label, value, suffix, context, change, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let labelText: HTMLElement;
  let contextText: HTMLElement;
  let changeBox: HTMLElement | undefined = $state();
  let changeText: HTMLElement | undefined = $state();
  let changeSizer: HTMLElement | undefined = $state();

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
  /** Copy that holds a number enters from the side it moved toward: a larger value rises from below, a smaller one drops from above. */
  const amountIn = (text: string) => Number(text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? Number.NaN);
  const direction = (next: string, previous: string) => (amountIn(next) < amountIn(previous) ? -1 : 1);

  $effect(() => {
    const swaps = [labelText, contextText].flatMap((text) => {
      const box = text?.parentElement;
      return text && box ? [createLabelSwap(box, box, text, { reduced, width: false, variant: "rise", direction })] : [];
    });
    return () => swaps.forEach((swap) => swap.destroy());
  });
  $effect(() => {
    if (!changeText || !changeBox || !changeSizer) return;
    // The wrapper springs to the new text's width instead of letting it snap.
    const follower = followWidth(changeBox, changeSizer, reduced);
    const swap = createLabelSwap(changeBox, changeBox, changeText, { reduced, follower, variant: "rise", direction });
    return () => {
      swap.destroy();
      follower.destroy();
    };
  });

  const trend = (text: string) => (/^[+]/.test(text) ? "up" : /^[-−]/.test(text) ? "down" : undefined);
  const small = { opacity: 0, scale: reduced ? 1 : 0.96 };
  const rest = { opacity: 1, scale: 1 };
  const enter = poseTransition(small, rest, reduced ? { duration: 0 } : { spring: "snappy" });
  const leave = poseTransition(small, rest, { duration: motionTokens.duration.fast, ease: "standard" });
</script>

<article class={["mc-metric-card__card", classNames?.card]}>
  <div class={["mc-metric-card__top", classNames?.top]}>
    <span><span class="mc-metric-card__swapBlock"><span bind:this={labelText} class="mc-metric-card__text">{label}</span></span></span>
    {#if change}
      <small data-trend={trend(change)} in:enter out:leave>
        <span bind:this={changeBox} class="mc-metric-card__swap">
          <span bind:this={changeSizer} class="mc-metric-card__sizer" aria-hidden="true">{change}</span>
          <span bind:this={changeText} class="mc-metric-card__text">{change}</span>
        </span>
      </small>
    {/if}
  </div>
  <AnimatedCounter {value} {suffix} animateOnView />
  <p><span class="mc-metric-card__swapBlock"><span bind:this={contextText} class="mc-metric-card__text">{context}</span></span></p>
</article>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-metric-card__card { min-width: 0; border: 1px solid var(--border); border-radius: var(--radius-surface); padding: var(--space-6); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-metric-card__top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-8); }
.mc-metric-card__top span { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-metric-card__top small { display: inline-flex; flex: 0 0 auto; border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 3px 8px; color: var(--text-secondary); font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
.mc-metric-card__card p { margin: var(--space-4) 0 0; color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); }
@media (max-width: 380px) { .mc-metric-card__card { padding: var(--space-4); } .mc-metric-card__top { align-items: flex-start; flex-wrap: wrap; margin-bottom: var(--space-6); } }
/* Text swaps: the outgoing copy is popped out of flow so the wrapper never holds both widths. */
.mc-metric-card__swap, .mc-metric-card__swapBlock { position: relative; max-width: 100%; }
.mc-metric-card__swap { display: inline-flex; overflow-x: clip; white-space: nowrap; vertical-align: top; }
.mc-metric-card__swapBlock { display: block; }
.mc-metric-card__swap > .mc-metric-card__text { display: inline-block; }
.mc-metric-card__swapBlock > .mc-metric-card__text { display: block; }
.mc-metric-card__sizer { position: absolute; top: 0; left: 0; visibility: hidden; white-space: nowrap; pointer-events: none; }
/* A signed change reads its direction in color as well as sign: a faint tint behind, the color on the text. */
.mc-metric-card__top small[data-trend] span { color: inherit; }
.mc-metric-card__top small[data-trend] { border-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-metric-card__top small[data-trend="up"] { background: color-mix(in oklab, var(--success) 11%, transparent); color: var(--success); }
.mc-metric-card__top small[data-trend="down"] { background: color-mix(in oklab, var(--danger) 11%, transparent); color: var(--danger); }
}
</style>
