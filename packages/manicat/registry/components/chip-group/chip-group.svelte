<script lang="ts" module>
  export interface ChipOption {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import ChipGroupChip from "@/registry/components/chip-group/chip-group-chip.svelte";
  import ChipGroupMore from "@/registry/components/chip-group/chip-group-more.svelte";
  import { MORE, createChipHeight } from "@/lib/chip-group";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    options: ChipOption[];
    /** The values of the selected chips. Bind them with `bind:value`. */
    value?: string[];
    /** Accessible name of the group, such as "Topics". */
    label: string;
    /** Allow several chips at once. In single mode the selected chip can still be cleared. */
    multiple?: boolean;
    /** Chips shown before the rest fold behind a "+N more" chip. Chips selected when it folds stay in view. */
    maxVisible?: number;
    class?: string;
    classNames?: { chip?: string; body?: string; surface?: string; check?: string; slot?: string; label?: string; group?: string; frame?: string; content?: string; more?: string; moreText?: string; moreLine?: string };
  }

  let { options, value = $bindable([]), label, multiple = true, maxVisible = Infinity, class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, stagger } = motionTokens;
  let expanded = $state(false);
  // Chips selected when the overflow folds stay in view, so a selection is never hidden and deselecting never makes a chip vanish.
  let pinned = $state<string[]>([...value]);
  let active = $state<string | null>(null);
  let frame: HTMLElement;
  let content: HTMLElement;
  let group = $state<HTMLElement>();
  let heightFrame: ReturnType<typeof createChipHeight> | undefined;

  const foldable = $derived(options.length > maxVisible);
  const visible = $derived(!foldable || expanded ? options : options.filter((option, index) => index < maxVisible || pinned.includes(option.value) || value.includes(option.value)));
  const hidden = $derived(options.length - visible.length);
  const showMore = $derived(foldable && (expanded || hidden > 0));
  const keys = $derived([...visible.map((option) => option.value), ...(showMore ? [MORE] : [])]);
  // One chip holds the tab stop: the last one focused, else the first selected, else the first.
  const tabStop = $derived(active !== null && keys.includes(active) ? active : (visible.find((option) => value.includes(option.value))?.value ?? keys[0]));

  function toggle(next: string) {
    const on = value.includes(next);
    if (!multiple) return void (value = on ? [] : [next]);
    value = options.filter((option) => (option.value === next ? !on : value.includes(option.value))).map((option) => option.value);
  }
  function toggleMore() {
    if (expanded) pinned = [...value];
    expanded = !expanded;
  }
  function onkeydown(event: KeyboardEvent) {
    const buttons = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(":is(button[data-chip], button[data-more]):not([aria-hidden='true'])"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const last = buttons.length - 1;
    const moves: Record<string, number> = { ArrowRight: index === last ? 0 : index + 1, ArrowDown: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, ArrowUp: index === 0 ? last : index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    buttons[moves[event.key]].focus();
  }

  // Neighbours glide to their new places, even across lines; the frame follows the chips' height.
  const flip = createFlip(() => [...(group?.querySelectorAll<HTMLElement>("[data-chip], [data-more]") ?? [])], { reduced });
  const morphKey = $derived(`${expanded}|${value.join(",")}`);
  let lastKey = morphKey;
  $effect.pre(() => {
    if (lastKey !== morphKey) heightFrame?.pin();
    lastKey = morphKey;
    visible;
    flip.measure();
  });
  $effect(() => {
    visible;
    morphKey;
    flip.play();
  });
  onMount(() => {
    heightFrame = createChipHeight(frame, content, reduced);
    return () => heightFrame?.destroy();
  });

  // Revealed chips grow in with a short stagger; chips that fold away leave faster than they came.
  const delayOf = (index: number) => (expanded ? Math.min(Math.max(0, index - maxVisible) * stagger.item, 0.3) : 0);
  const chipIn = (node: HTMLElement) => {
    const delay = Number(node.dataset.delay ?? 0);
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, reduced ? { duration: 0.15, ease: "standard" } : { spring: "snappy", fade: duration.fast, delay, fadeDelay: delay })(node);
  };
  const chipOut = (node: HTMLElement) => {
    node.setAttribute("aria-hidden", "true");
    node.tabIndex = -1;
    const at = flip.origin(node);
    Object.assign(node.style, { position: "absolute", left: `${at?.x ?? node.offsetLeft}px`, top: `${at?.y ?? node.offsetTop}px`, width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`, margin: "0" });
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, reduced ? { duration: 0.15, ease: "standard" } : { duration: duration.instant, ease: "standard" })(node);
  };
</script>

<div bind:this={frame} class={["mc-chip-group__frame", classNames?.frame]}>
  <div bind:this={content} class={["mc-chip-group__content", classNames?.content]}>
    <div bind:this={group} class={["mc-chip-group__group", className, classNames?.group]} role="group" aria-label={label} {onkeydown}>
      {#each visible as option, index (option.value)}
        <ChipGroupChip {option} selected={value.includes(option.value)} tabbable={tabStop === option.value} delay={delayOf(index)} {classNames} onToggle={toggle} onFocusChip={(key) => (active = key)} {chipIn} {chipOut} />
      {/each}
      {#if showMore}
        <ChipGroupMore {hidden} {expanded} tabbable={tabStop === MORE} {classNames} onToggle={toggleMore} onFocusChip={(key) => (active = key)} />
      {/if}
    </div>
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame follows the chip rows' height on a spring; the rows re-flow once and every chip glides to its new place. */
.mc-chip-group__frame { min-width: 0; }
.mc-chip-group__content { position: relative; }
.mc-chip-group__group { position: relative; isolation: isolate; display: flex; flex-wrap: wrap; gap: var(--space-2); }

/* The button is only the hit area and the layout box. What you see is the surface, which trails the box on a spring while the width morphs. */
.mc-chip-group__chip { position: relative; display: inline-flex; max-width: 100%; padding: 0; border: 0; border-radius: var(--radius-pill); background: none; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; letter-spacing: var(--tracking-body); line-height: 20px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard); }
/* Press answers on the body with the individual scale property, so it never fights the layout transform on the button. */
.mc-chip-group__body { position: relative; isolation: isolate; display: inline-flex; min-width: 0; height: var(--control-height-sm); align-items: center; padding: 0 14px; transition: scale var(--duration-spring) var(--ease-spring); }
.mc-chip-group__chip:active .mc-chip-group__body { scale: .97; transition-duration: var(--duration-instant); transition-timing-function: var(--ease-standard); }
.mc-chip-group__surface { position: absolute; z-index: -1; top: 0; bottom: 0; left: 0; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
/* The check grows from its left edge where the label started; the slot hands its width to the label in one layout step, and the label's offset springs it over. */
.mc-chip-group__check { position: absolute; top: calc(50% - 7px); left: 12px; display: grid; width: 14px; height: 14px; place-items: center; color: var(--accent-strong); transform-origin: 0 50%; }
.mc-chip-group__check svg { display: block; overflow: visible; }
.mc-chip-group__slot { width: 0; flex: none; }
.mc-chip-group__body[data-selected="true"] .mc-chip-group__slot { width: 18px; }
.mc-chip-group__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Selected reads as a quiet tint of the accent (neutral by default) plus the check, never color alone. */
.mc-chip-group__body[data-selected="true"] .mc-chip-group__surface { border-color: color-mix(in oklab, var(--accent) 42%, var(--border)); background: color-mix(in oklab, var(--accent) 11%, var(--surface)); }
.mc-chip-group__chip[aria-pressed="true"] { color: var(--foreground); }
@media (hover: hover) and (pointer: fine) {
  .mc-chip-group__chip:hover { color: var(--foreground); }
  .mc-chip-group__chip:hover .mc-chip-group__surface { border-color: var(--border-strong); }
  .mc-chip-group__chip[aria-pressed="true"]:hover .mc-chip-group__surface { border-color: color-mix(in oklab, var(--accent) 60%, var(--border)); background: color-mix(in oklab, var(--accent) 16%, var(--surface)); }
}

/* The overflow chip travels under the chips it reveals, so they seem to come out of it. */
.mc-chip-group__chip:not(.mc-chip-group__more) { z-index: 1; }
.mc-chip-group__more { color: var(--text-muted); }
.mc-chip-group__more .mc-chip-group__surface { border-color: var(--border); background: var(--surface-muted); }
.mc-chip-group__moreText { position: relative; display: inline-flex; justify-content: center; font-variant-numeric: tabular-nums; }
.mc-chip-group__moreLine { display: block; white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-chip-group__chip, .mc-chip-group__body, .mc-chip-group__surface { transition: none; }
  .mc-chip-group__chip:active .mc-chip-group__body { scale: none; }
}
}
</style>
