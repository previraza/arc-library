<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { Component } from "svelte";
  import { createListboxMotion, enter, splitMatch } from "@/lib/expanding-search";
  import type { ExpandingSearchEntry, SearchGroup } from "@/lib/expanding-search";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  type Item = ExpandingSearchEntry & { icon?: Component };

  let { id, label, groups, query, activeIndex, optionId, keyboard, classNames, onhover, onchoose }: { id: string; label: string; groups: SearchGroup<Item>[]; query: string; activeIndex: number; optionId: (item: Item) => string; keyboard: { current: boolean }; classNames?: Record<string, string | undefined>; onhover: (index: number) => void; onchoose: (item: Item) => void } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = $state<HTMLElement>();
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const flat = $derived(groups.flatMap((group) => group.items));
  const layoutKey = $derived(flat.map((item) => item.id).join("|"));
  const activeId = $derived(flat[activeIndex] ? optionId(flat[activeIndex]) : "");
  const headingId = (name: string) => `${id}-${name || "results"}`.replace(/\s+/g, "-");

  let motion: ReturnType<typeof createListboxMotion> | undefined;
  // Groups and rows glide to their new place on a spring when the results change.
  const groupFlip = createFlip(() => [...(list?.querySelectorAll<HTMLElement>(":scope > [role=group]") ?? [])], { reduced, spring: "smooth" });
  const optionFlip = createFlip(() => [...(list?.querySelectorAll<HTMLElement>("[role=option]") ?? [])], { reduced, spring: "smooth" });
  onMount(() => {
    motion = createListboxMotion(list!, { reduced, keyboard });
    motion.sync(activeId, layoutKey);
    return () => motion?.destroy();
  });
  $effect.pre(() => {
    void layoutKey;
    groupFlip.measure();
    optionFlip.measure();
  });
  $effect(() => {
    void layoutKey;
    groupFlip.play();
    optionFlip.play();
  });
  $effect(() => {
    const at = activeId;
    const set = layoutKey;
    motion?.sync(at, set);
  });

  // Groups and rows fade in, and fade out a little faster while they pop out of the flow where they stood.
  const { duration } = motionTokens;
  const fadeIn = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.fast, ease: "enter" });
  const popOutOf = (flip: { origin: (node: HTMLElement) => { x: number; y: number } | undefined }) => (node: HTMLElement) => {
    const at = flip.origin(node);
    const out = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: 0.08 }, { pop: !at })(node);
    if (at) Object.assign(node.style, { position: "absolute", left: `${at.x}px`, top: `${at.y}px`, width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`, margin: "0" });
    return out;
  };
  const groupOut = popOutOf(groupFlip);
  const optionOut = popOutOf(optionFlip);
  void enter;
</script>

<div bind:this={list} {id} role="listbox" aria-label={label} class={cn("mc-expanding-search__listbox", "listbox")}>
  {#each groups as group (group.name)}
    <div role="group" aria-labelledby={group.name ? headingId(group.name) : undefined} class={cn("mc-expanding-search__group", "group")} in:fadeIn out:groupOut>
      {#if group.name}<div id={headingId(group.name)} class={cn("mc-expanding-search__groupLabel", "groupLabel")} role="presentation">{group.name}</div>{/if}
      {#each group.items as item (item.id)}
        {@const position = flat.indexOf(item)}
        {@const Icon = item.icon}
        <div
          id={optionId(item)}
          role="option"
          tabindex="-1"
          aria-selected={position === activeIndex}
          data-active={position === activeIndex || undefined}
          class={cn("mc-expanding-search__option", "option")}
          onpointermove={() => { if (position !== activeIndex) { keyboard.current = false; onhover(position); } }}
          onmousedown={(event) => event.preventDefault()}
          onclick={() => onchoose(item)}
          onkeydown={() => {}}
          in:fadeIn
          out:optionOut
        >
          {#if position === activeIndex}<span data-highlight class={cn("mc-expanding-search__highlight", "highlight")} aria-hidden="true"></span>{/if}
          {#if Icon}<span class={cn("mc-expanding-search__optionIcon", "optionIcon")} aria-hidden="true"><Icon size={16} /></span>{/if}
          <span class={cn("mc-expanding-search__optionText", "optionText")}>
            <span class={cn("mc-expanding-search__optionTitle", "optionTitle")}>{#if splitMatch(item.title, query)}{@const parts = splitMatch(item.title, query)!}{parts[0]}<mark class={cn("mc-expanding-search__mark", "mark")}>{parts[1]}</mark>{parts[2]}{:else}{item.title}{/if}</span>
            {#if item.meta}<span class={cn("mc-expanding-search__optionMeta", "optionMeta")}>{item.meta}</span>{/if}
          </span>
        </div>
      {/each}
    </div>
  {/each}
</div>
