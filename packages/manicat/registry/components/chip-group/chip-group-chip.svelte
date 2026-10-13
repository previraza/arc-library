<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createChipBody } from "@/lib/chip-group";

  let { option, selected, tabbable, delay, classNames, onToggle, onFocusChip, chipIn, chipOut }: {
    option: { value: string; label: string };
    selected: boolean;
    tabbable: boolean;
    delay: number;
    classNames?: { chip?: string; body?: string; surface?: string; check?: string; slot?: string; label?: string };
    onToggle: (value: string) => void;
    onFocusChip: (value: string) => void;
    chipIn: (node: HTMLElement) => object;
    chipOut: (node: HTMLElement) => object;
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let body: HTMLElement;
  let surface: HTMLElement;
  let check: HTMLElement;
  let label: HTMLElement;
  let chip: ReturnType<typeof createChipBody> | undefined;

  onMount(() => {
    chip = createChipBody({ body, surface, label, check, path: check.querySelector("path") }, { selected, reduced });
    return () => chip?.destroy();
  });
  let first = true;
  $effect(() => {
    const next = selected;
    if (first) {
      first = false;
      return;
    }
    queueMicrotask(() => chip?.update(next));
  });
</script>

<button type="button" class={["mc-chip-group__chip", classNames?.chip]} data-chip={option.value} data-delay={delay} aria-pressed={selected} tabindex={tabbable ? 0 : -1} onclick={() => onToggle(option.value)} onfocus={() => onFocusChip(option.value)} in:chipIn out:chipOut>
  <span bind:this={body} class={["mc-chip-group__body", classNames?.body]} data-selected={selected}>
    <span bind:this={surface} class={["mc-chip-group__surface", classNames?.surface]} aria-hidden="true"></span>
    <span bind:this={check} class="mc-chip-group__check" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg></span>
    <span class="mc-chip-group__slot" aria-hidden="true"></span>
    <span bind:this={label} class={["mc-chip-group__label", classNames?.label]}>{option.label}</span>
  </span>
</button>
