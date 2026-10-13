<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createChipBody } from "@/lib/chip-group";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  let { hidden, expanded, tabbable, classNames, onToggle, onFocusChip }: {
    hidden: number;
    expanded: boolean;
    tabbable: boolean;
    classNames?: { chip?: string; body?: string; surface?: string; moreText?: string; moreLine?: string };
    onToggle: () => void;
    onFocusChip: (value: string) => void;
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let body: HTMLElement;
  let surface: HTMLElement;
  let line: HTMLElement | undefined;
  let chip: ReturnType<typeof createChipBody> | undefined;
  const text = $derived(expanded ? "Show less" : `+${hidden} more`);

  // The text stays centred on the visible surface while its edge catches up; a leaving line holds the offset it had when it left.
  onMount(() => {
    chip = createChipBody({ body, surface }, { selected: false, reduced, onLag: (lag) => { if (line) line.style.transform = `translateX(${lag / 2}px)`; } });
    return () => chip?.destroy();
  });
  let first = true;
  $effect(() => {
    text;
    if (first) {
      first = false;
      return;
    }
    queueMicrotask(() => chip?.update(false));
  });

  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const lineIn = (node: HTMLElement) => {
    line = node;
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0.15, ease: "standard" } : { duration: duration.standard, ease: "enter" })(node);
  };
  const lineOut = (node: HTMLElement) => {
    node.setAttribute("aria-hidden", "true");
    return poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0.15, ease: "standard" } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  };
</script>

<button type="button" class={["mc-chip-group__chip", classNames?.chip, "mc-chip-group__more"]} data-more aria-expanded={expanded} tabindex={tabbable ? 0 : -1} onclick={onToggle} onfocus={() => onFocusChip("\u0000more")}>
  <span bind:this={body} class={["mc-chip-group__body", classNames?.body]}>
    <span bind:this={surface} class={["mc-chip-group__surface", classNames?.surface]} aria-hidden="true"></span>
    <span class={["mc-chip-group__moreText", classNames?.moreText]}>
      {#key text}<span class={["mc-chip-group__moreLine", classNames?.moreLine]} in:lineIn out:lineOut>{text}</span>{/key}
    </span>
  </span>
</button>
