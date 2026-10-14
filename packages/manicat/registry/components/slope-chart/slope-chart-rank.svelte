<script lang="ts">
  // @manicat-dependencies motion
  import { poseTransition } from "@/lib/motion-dom";

  /** Rank change arrow: up, down, or level. The number rolls in when it changes. */
  let { move, classNames }: { move: number; classNames?: Record<string, string | undefined> } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const text = $derived(move === 0 ? "=" : `${Math.abs(move)}`);
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const rankIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: move >= 0 ? 6 : -6 }, { opacity: 1, y: 0 }, reduced ? { duration: 0 } : { spring: "snappy" })(node);
  const rankOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: move >= 0 ? -6 : 6 }, { opacity: 1, y: 0 }, reduced ? { duration: 0 } : { spring: "snappy" }, { pop: true })(node);
</script>

<span class={cn("mc-slope-chart__rank", "rank")} data-move={move > 0 ? "up" : move < 0 ? "down" : "level"} aria-hidden="true">
  {#if move !== 0}<svg width="8" height="8" viewBox="0 0 8 8"><path d={move > 0 ? "M4 7V1M1.5 3.5 4 1l2.5 2.5" : "M4 1v6M1.5 4.5 4 7l2.5-2.5"} fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" /></svg>{/if}
  <span class={cn("mc-slope-chart__rankSwap", "rankSwap")}>{#key text}<span in:rankIn out:rankOut>{text}</span>{/key}</span>
</span>
