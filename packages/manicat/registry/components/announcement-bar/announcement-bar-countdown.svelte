<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { pad, parts, physical } from "@/lib/announcement-bar";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";
  import { animate } from "motion";

  /** A live countdown. A changed digit drops in from above while the old one falls away, like a counter winding down. */
  let { to, label, classNames, onEnd }: { to: Date | string | number; label?: string; classNames?: Record<string, string | undefined>; onEnd?: () => void } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration } = motionTokens;
  const standard = [...motionTokens.ease.standard] as [number, number, number, number];
  const target = $derived(new Date(to).getTime());
  let now = $state<number | null>(null);
  onMount(() => {
    let timer = 0;
    let ended = false;
    const tick = () => {
      const current = Date.now();
      now = current;
      if (current >= target) {
        if (!ended) {
          ended = true;
          onEnd?.();
        }
        return;
      }
      // Wake just after each whole second so digits change on the beat.
      timer = window.setTimeout(tick, 1000 - (current % 1000) + 8);
    };
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  });
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const pending = $derived(now === null);
  const parted = $derived(parts(now === null ? 0 : target - now));
  const spoken = $derived(pending ? "" : `${parted.d ? `${parted.d} days ` : ""}${parted.h} hours ${parted.m} minutes`);
  const digits = (value: string, key: string) => value.split("").map((char, index) => ({ key: `${key}${value.length - index}`, char: pending ? "0" : char }));
  const groups = $derived([digits(pad(parted.h), "h"), digits(pad(parted.m), "m"), digits(pad(parted.s), "s")]);

  const digitIn = (node: HTMLElement) => {
    if (reduced) return poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.instant })(node);
    animate(node, { y: ["-70%", "0%"] } as never, physical(0.32, 0.08) as never);
    animate(node, { opacity: [0, 1] }, { duration: duration.fast, ease: standard });
    return { duration: 320 };
  };
  const digitOut = (node: HTMLElement) => {
    Object.assign(node.style, { position: "absolute", left: `${node.offsetLeft}px`, top: `${node.offsetTop}px`, width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`, margin: "0" });
    if (reduced) {
      animate(node, { opacity: 0 }, { duration: 0 });
      return { duration: 0 };
    }
    animate(node, { y: "70%" } as never, physical(0.32, 0.08) as never);
    animate(node, { opacity: 0 }, { duration: duration.fast, ease: standard });
    return { duration: 320 };
  };
</script>

{#snippet cell(char: string)}
  <span class={cn("mc-announcement-bar__digit", "digit")}><span class="mc-announcement-bar__digitSizer" aria-hidden="true">0</span>{#key char}<span class={cn("mc-announcement-bar__digitFace", "digitFace")} in:digitIn out:digitOut>{char}</span>{/key}</span>
{/snippet}

<span class={cn("mc-announcement-bar__countdown", "countdown")}>
  {#if label}<span class={cn("mc-announcement-bar__countdownLabel", "countdownLabel")}>{label}</span>{/if}
  <span role="timer" aria-live="off" aria-label={spoken} class={cn("mc-announcement-bar__time", "time")} data-pending={pending || undefined}>
    {#if parted.d}
      <span class={cn("mc-announcement-bar__unit", "unit")}>
        {#each digits(String(parted.d), "d") as item (item.key)}{@render cell(item.char)}{/each}
        <span class={cn("mc-announcement-bar__unitMark", "unitMark")} aria-hidden="true">d</span>
      </span>
      <span class="mc-announcement-bar__gap" aria-hidden="true"></span>
    {/if}
    {#each groups as group, groupIndex (groupIndex)}
      {#each group as item (item.key)}{@render cell(item.char)}{/each}
      {#if groupIndex < 2}<span class={cn("mc-announcement-bar__sep", "sep")} aria-hidden="true">:</span>{/if}
    {/each}
  </span>
</span>
