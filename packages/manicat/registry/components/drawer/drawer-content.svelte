<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { animate } from "motion";
  import { Dialog } from "bits-ui";
  import type { DialogContentProps } from "bits-ui";
  import { X } from "@lucide/svelte";
  import { createLabelSwap } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  let {
    title,
    description,
    children,
    side = "right",
    container,
    classNames,
    class: className,
    ...rest
  }: DialogContentProps & {
    title: string;
    description?: string;
    side?: "left" | "right" | "top" | "bottom";
    /** Renders the drawer inside this element instead of the page body, anchored to its edges. The element needs position: relative and overflow: hidden. */
    container?: HTMLElement | null;
    /** Extend the inner, named parts of the drawer content: header, title, description, close, body or overlay. */
    classNames?: { header?: string; title?: string; description?: string; close?: string; body?: string; overlay?: string };
  } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let titleText: HTMLElement | undefined = $state();
  let descriptionText: HTMLElement | undefined = $state();
  let panel = $state<HTMLElement | null>(null);
  let closeButton = $state<HTMLElement | null>(null);

  // When the title or description changes while open, the new copy rises in and the old copy leaves upward.
  $effect(() => {
    const swaps = [titleText, descriptionText].flatMap((text) => {
      const box = text?.parentElement;
      return text && box ? [createLabelSwap(box, box, text, { reduced, width: false, variant: "badge" })] : [];
    });
    return () => swaps.forEach((swap) => swap.destroy());
  });

  // The header is the grab handle. It follows the pointer toward the edge and rubber-bands the other way.
  const axis = $derived(side === "left" || side === "right" ? "x" : "y");
  const sign = $derived(side === "right" || side === "bottom" ? 1 : -1);
  let start: { x: number; y: number } | null = null;
  let offset = 0;
  let samples: { v: number; t: number }[] = [];
  function down(event: PointerEvent) {
    if (reduced || (event.target as Element).closest("button, a, input, select, textarea, [role='button']")) return;
    start = { x: event.clientX, y: event.clientY };
    samples = [];
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (!start || !panel) return;
    const delta = axis === "x" ? event.clientX - start.x : event.clientY - start.y;
    const toward = delta * sign;
    offset = sign * (toward >= 0 ? toward : -Math.sqrt(-toward));
    samples = [...samples.slice(-4), { v: axis === "x" ? event.clientX : event.clientY, t: event.timeStamp }];
    panel.style.translate = axis === "x" ? `${offset}px 0` : `0 ${offset}px`;
  }
  // Past a third of the panel, or on a quick flick toward the edge, the drawer closes; otherwise it springs back.
  function up() {
    if (!start || !panel) return;
    start = null;
    const size = axis === "x" ? panel.offsetWidth : panel.offsetHeight;
    const toward = offset * sign;
    const [a, b] = [samples[0], samples[samples.length - 1]];
    const velocity = a && b && b.t > a.t ? ((b.v - a.v) / (b.t - a.t)) * 1000 : 0;
    if (toward > size / 3 || (toward > 0 && velocity * sign > 500)) {
      closeButton?.click();
      return;
    }
    const node = panel;
    animate(node, { translate: axis === "x" ? [`${offset}px 0`, "0px 0"] : [`0 ${offset}px`, "0 0px"] } as never, motionTokens.spring.snappy as never).finished.then(() => (node.style.translate = ""));
    offset = 0;
  }
</script>

<Dialog.Portal to={container ?? undefined}>
  <Dialog.Overlay class={["mc-drawer__overlay", "mc-drawer__keyframes", classNames?.overlay]} data-contained={container ? "" : undefined} />
  <Dialog.Content {...rest} bind:ref={panel} data-side={side} data-contained={container ? "" : undefined} class={["mc-drawer__content", "mc-drawer__keyframes", className]}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class={["mc-drawer__header", !reduced && "mc-drawer__handle", classNames?.header]} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <div>
        <Dialog.Title class={["mc-drawer__title", classNames?.title]}><span bind:this={titleText} class="mc-drawer__swap">{title}</span></Dialog.Title>
        {#if description}<Dialog.Description class={["mc-drawer__description", classNames?.description]}><span bind:this={descriptionText} class="mc-drawer__swap">{description}</span></Dialog.Description>{/if}
      </div>
      <Dialog.Close bind:ref={closeButton} class={["mc-drawer__close", classNames?.close]} aria-label="Close drawer"><X size={16} strokeWidth={1.75} aria-hidden="true" /></Dialog.Close>
    </div>
    <div class={["mc-drawer__body", classNames?.body]}>{@render children?.()}</div>
  </Dialog.Content>
</Dialog.Portal>
