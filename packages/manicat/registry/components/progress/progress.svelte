<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import { Check } from "@lucide/svelte";
  import { createLabelSwap, createProgress, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    value?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    /** Extend the inner, named parts of the progress: meta, label, line, value, done, count, track or fill. */
    classNames?: { meta?: string; label?: string; line?: string; value?: string; done?: string; count?: string; track?: string; fill?: string };
  }

  let { value = 0, max = 100, label, showValue = false, classNames }: Props = $props();

  const safeMax = $derived(max > 0 ? max : 100);
  const safeValue = $derived(Math.min(Math.max(value, 0), safeMax));
  const percentage = $derived(Math.round((safeValue / safeMax) * 100));
  const complete = $derived(percentage >= 100);

  let fill: HTMLElement;
  let count: HTMLElement | undefined = $state();
  let labelSlot: HTMLElement | undefined = $state();
  let labelLine: HTMLElement | undefined = $state();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let bar: ReturnType<typeof createProgress> | undefined;

  onMount(() => {
    bar = createProgress({ fill, count }, { percent: percentage, reduced });
    const swap = labelSlot && labelLine ? createLabelSwap(labelSlot, labelSlot, labelLine, { reduced, width: false }) : undefined;
    return () => {
      bar?.destroy();
      swap?.destroy();
    };
  });
  $effect(() => bar?.set(percentage));

  // Completion lands as the fill arrives: a check settles in beside the final count.
  const icon = { opacity: 0, scale: 0.6, blur: motionTokens.blur.subtle };
  const rest = { opacity: 1, scale: 1, blur: 0 };
  const enter = poseTransition(icon, rest, reduced ? { duration: motionTokens.duration.instant } : { spring: "snappy", delay: 0.24 });
  const leave = poseTransition(icon, rest, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: "standard" });
</script>

<div class="mc-progress__progress" data-complete={complete ? "" : undefined} role="progressbar" aria-label={label ?? "Progress"} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue} aria-valuetext={`${percentage}%`}>
  {#if label || showValue}
    <div class={["mc-progress__meta", classNames?.meta]}>
      {#if label}
        <span bind:this={labelSlot} class={["mc-progress__label", classNames?.label]}><span bind:this={labelLine} class={["mc-progress__line", classNames?.line]}>{label}</span></span>
      {:else}
        <span></span>
      {/if}
      {#if showValue}
        <span class={["mc-progress__value", classNames?.value]}>
          {#if complete}
            <span class={["mc-progress__done", classNames?.done]} in:enter out:leave><Check size={14} strokeWidth={1.75} aria-hidden="true" /></span>
          {/if}
          <span bind:this={count} class={["mc-progress__count", classNames?.count]}></span>
        </span>
      {/if}
    </div>
  {/if}
  <div class={["mc-progress__track", classNames?.track]}><span bind:this={fill} class={["mc-progress__fill", classNames?.fill]}></span></div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-progress__progress { width: 100%; color: var(--text-secondary); font-size: var(--text-sm); } .mc-progress__meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; line-height: var(--leading-body); } .mc-progress__label { position: relative; min-width: 0; } .mc-progress__line { display: block; } .mc-progress__value { display: inline-flex; flex: none; align-items: center; gap: 4px; color: var(--text-muted); font-variant-numeric: tabular-nums; } .mc-progress__count { display: inline-grid; justify-items: end; } /* A hidden "100%" row reserves the widest count, so the check never shifts as the number gains a digit. */ .mc-progress__count::before { content: "100%"; height: 0; overflow: hidden; visibility: hidden; } .mc-progress__done { display: grid; place-items: center; color: var(--success); } .mc-progress__track { height: 7px; overflow: hidden; border: 1px solid var(--border); border-radius: 99px; background: var(--surface-muted); } .mc-progress__fill { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--accent); transition: background-color var(--duration-standard) var(--ease-standard); } .mc-progress__progress[data-complete] .mc-progress__fill { background: var(--success); transition-delay: 200ms; } @media (prefers-reduced-motion: reduce) { .mc-progress__fill, .mc-progress__progress[data-complete] .mc-progress__fill { transition: none; } }
}
</style>
