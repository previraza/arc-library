<script lang="ts">
  // @manicat-dependencies motion
  import { animate, motionValue } from "motion";
  import { onMount } from "svelte";
  import { motionTokens } from "@/lib/motion-tokens";

  /** A share that rolls to its new value on a spring and holds its width with tabular figures. */
  let { value, decimals }: { value: number; decimals: number } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shown = motionValue(value);
  let text = $state(`${value.toFixed(decimals)}%`);
  let run: { stop(): void } | undefined;
  onMount(() => {
    const off = shown.on("change", (current) => (text = `${current.toFixed(decimals)}%`));
    return () => { off(); run?.stop(); };
  });
  $effect(() => {
    const next = value;
    run?.stop();
    if (reduced) return void shown.jump(next);
    run = animate(shown as never, next, motionTokens.spring.smooth as never);
  });
</script>

<span>{text}</span>
