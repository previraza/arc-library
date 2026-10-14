<script lang="ts">
  // @manicat-dependencies motion
  import TimelineRise from "@/registry/components/timeline/timeline-rise.svelte";

  /** The day's update count rolls digit by digit in the direction it moved. */
  let { value, classNames }: { value: number; classNames?: Record<string, string | undefined> } = $props();

  let direction = 1;
  let previous = value;
  $effect.pre(() => {
    if (value !== previous) direction = value > previous ? 1 : -1;
    previous = value;
  });
  const chars = $derived([...String(value)]);
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
</script>

<span class={cn("mc-timeline__rolling", "rolling")} aria-hidden="true">
  {#each chars as char, index (chars.length - index)}<span class={cn("mc-timeline__place", "place")}><TimelineRise text={char} {direction} {classNames} /></span>{/each}
</span>
