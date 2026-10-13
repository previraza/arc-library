<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { onMount } from "svelte";
  import { Dialog } from "bits-ui";
  import type { DialogContentProps } from "bits-ui";
  import { X } from "@lucide/svelte";
  import { createLabelSwap } from "@/lib/motion-dom";

  let {
    title,
    description,
    children,
    classNames,
    class: className,
    ...rest
  }: DialogContentProps & {
    title: string;
    description?: string;
    /** Extend the inner, named parts of the dialog content: header, title, description, close, body or overlay. */
    classNames?: { header?: string; title?: string; description?: string; close?: string; body?: string; overlay?: string };
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let titleText: HTMLElement | undefined = $state();
  let descriptionText: HTMLElement | undefined = $state();

  // When the title or description changes while open, the new copy rises in and the old copy leaves upward.
  $effect(() => {
    const swaps = [titleText, descriptionText].flatMap((text) => {
      const box = text?.parentElement;
      return text && box ? [createLabelSwap(box, box, text, { reduced, width: false, variant: "badge" })] : [];
    });
    return () => swaps.forEach((swap) => swap.destroy());
  });
</script>

<Dialog.Portal>
  <Dialog.Overlay class={["mc-dialog__overlay", "mc-dialog__keyframes", classNames?.overlay]} />
  <Dialog.Content {...rest} class={["mc-dialog__content", "mc-dialog__keyframes", className]}>
    <div class={["mc-dialog__header", classNames?.header]}>
      <div>
        <Dialog.Title class={["mc-dialog__title", classNames?.title]}><span bind:this={titleText} class="mc-dialog__swap">{title}</span></Dialog.Title>
        {#if description}<Dialog.Description class={["mc-dialog__description", classNames?.description]}><span bind:this={descriptionText} class="mc-dialog__swap">{description}</span></Dialog.Description>{/if}
      </div>
      <Dialog.Close class={["mc-dialog__close", classNames?.close]} aria-label="Close dialog"><X size={16} strokeWidth={1.75} aria-hidden="true" /></Dialog.Close>
    </div>
    <div class={["mc-dialog__body", classNames?.body]}>{@render children?.()}</div>
  </Dialog.Content>
</Dialog.Portal>
