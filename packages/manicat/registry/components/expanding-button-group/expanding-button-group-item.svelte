<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Component } from "svelte";
  import { drawPath, poseTransition } from "@/lib/motion-dom";
  import { animateLabel, createExpandingItem, swapPoses } from "@/lib/expanding-button-group";
  import type { ExpandingButtonGroupSize } from "@/lib/expanding-button-group";

  type Item = { id: string; label: string; icon: Component; doneLabel?: string; tone?: "neutral" | "danger"; disabled?: boolean };

  let { item, size, expanded, done, busy, tabStop, classNames, onpointerdown, onclick, onfocus }: { item: Item; size: ExpandingButtonGroupSize; expanded: boolean; done: boolean; busy: boolean; tabStop: boolean; classNames?: Record<string, string | undefined>; onpointerdown: (item: Item, event: PointerEvent) => void; onclick: (item: Item) => void; onfocus: (item: Item, event: FocusEvent) => void } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  let button = $state<HTMLElement>();
  let label = $state<HTMLElement>();
  let sizerLabel = $state<HTMLElement>();
  let sizerDone = $state<HTMLElement>();
  let controller = $state.raw<ReturnType<typeof createExpandingItem>>();

  const showDone = $derived(done && !!item.doneLabel);
  const word = $derived(showDone ? item.doneLabel! : item.label);
  const Icon = $derived(item.icon);

  onMount(() => {
    const made = createExpandingItem(button!, { size: () => size, expanded: () => expanded, sizers: () => [sizerLabel ?? null, sizerDone ?? null], reduced });
    controller = made;
    animateLabel(label!, expanded, { reduced, animated: false });
    return () => made.destroy();
  });
  $effect(() => {
    void [item.label, item.doneLabel, size, expanded];
    queueMicrotask(() => controller?.sync());
  });
  let seen = false;
  $effect(() => {
    const on = expanded;
    if (!seen) return void (seen = true);
    animateLabel(label!, on, { reduced, animated: true });
  });

  const swapIn = (kind: "word" | "icon") => (node: HTMLElement) => {
    const poses = swapPoses(node, kind, reduced);
    return poseTransition(poses.from, poses.rest, poses.enterTiming)(node);
  };
  const swapOut = (kind: "word" | "icon") => (node: HTMLElement) => {
    const poses = swapPoses(node, kind, reduced);
    return poseTransition(poses.out, poses.rest, poses.leaveTiming)(node);
  };
  const glyphIn = swapIn("icon");
  const glyphOut = swapOut("icon");
  const wordIn = swapIn("word");
  const wordOut = swapOut("word");
  /** The confirmation tick draws itself from its short stroke. */
  const draw = (node: SVGPathElement) => drawPath(node, { reduced, delay: 0.06 });
</script>

<button bind:this={button} type="button" class={cn("mc-expanding-button-group__item", "item")} data-ebg-item="" data-id={item.id} data-tone={item.tone ?? "neutral"} data-state={showDone ? "done" : "idle"} data-expanded={expanded || undefined} aria-label={item.label} aria-disabled={item.disabled || undefined} aria-busy={busy || undefined} tabindex={tabStop ? 0 : -1} onpointerdown={(event) => onpointerdown(item, event)} onclick={() => onclick(item)} onfocus={(event) => onfocus(item, event)}>
  <span class={cn("mc-expanding-button-group__icon", "icon")} aria-hidden="true">
    {#key showDone}
      <span class={cn("mc-expanding-button-group__glyph", "glyph")} in:glyphIn out:glyphOut>
        {#if showDone}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path use:draw d="M4 12.5l5 5L20 6.5" /></svg>{:else}<Icon />{/if}
      </span>
    {/key}
  </span>
  <span bind:this={label} class={cn("mc-expanding-button-group__label", "label")} aria-hidden="true">
    {#key word}<span class={cn("mc-expanding-button-group__word", "word")} in:wordIn out:wordOut>{word}</span>{/key}
    <span bind:this={sizerLabel} class={cn("mc-expanding-button-group__sizer", "sizer")}>{item.label}</span>
    {#if item.doneLabel}<span bind:this={sizerDone} class={cn("mc-expanding-button-group__sizer", "sizer")}>{item.doneLabel}</span>{/if}
  </span>
</button>
