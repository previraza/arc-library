<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { animate } from "motion";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, useForwardPropsEmits } from "reka-ui";
import type { DialogContentEmits, DialogContentProps } from "reka-ui";
import { X } from "lucide-vue-next";
import { createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      title: string;
      description?: string;
      side?: "left" | "right" | "top" | "bottom";
      /** Renders the drawer inside this element instead of the page body, anchored to its edges. The element needs position: relative and overflow: hidden. */
      container?: HTMLElement | null;
      /** Extend the inner, named parts of the drawer content: header, title, description, close, body or overlay. */
      classNames?: { header?: string; title?: string; description?: string; close?: string; body?: string; overlay?: string };
    }
  >(),
  { side: "right" },
);
const emits = defineEmits<DialogContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const titleText = ref<HTMLElement>();
const descriptionText = ref<HTMLElement>();
const closeButton = ref<{ $el: HTMLElement }>();
const header = ref<HTMLElement>();
const swaps: LabelSwap[] = [];
const cn = (base: string, ...extra: (string | undefined | false)[]) => [base, ...extra].filter(Boolean).join(" ");

// When the title or description changes while open, the new copy rises in and the old copy leaves upward.
function attach() {
  swaps.splice(0).forEach((swap) => swap.destroy());
  for (const text of [titleText.value, descriptionText.value]) {
    const box = text?.parentElement;
    if (text && box) swaps.push(createLabelSwap(box, box, text, { reduced, width: false, variant: "badge" }));
  }
}
onMounted(attach);
watch([titleText, descriptionText], attach, { flush: "post" });
onBeforeUnmount(() => swaps.forEach((swap) => swap.destroy()));

// The header is the grab handle. It follows the pointer toward the edge and rubber-bands the other way.
const axis = () => (props.side === "left" || props.side === "right" ? "x" : "y");
const sign = () => (props.side === "right" || props.side === "bottom" ? 1 : -1);
let panel: HTMLElement | null = null;
let start: { x: number; y: number } | null = null;
let offset = 0;
let samples: { v: number; t: number }[] = [];
const setPanel = (el: unknown) => { panel = el instanceof HTMLElement ? el : (el as { $el?: HTMLElement } | null)?.$el ?? null; };
function down(event: PointerEvent) {
  if (reduced || (event.target as Element).closest("button, a, input, select, textarea, [role='button']")) return;
  start = { x: event.clientX, y: event.clientY };
  samples = [];
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!start || !panel) return;
  const delta = axis() === "x" ? event.clientX - start.x : event.clientY - start.y;
  const toward = delta * sign();
  offset = sign() * (toward >= 0 ? toward : -Math.sqrt(-toward));
  samples = [...samples.slice(-4), { v: axis() === "x" ? event.clientX : event.clientY, t: event.timeStamp }];
  panel.style.translate = axis() === "x" ? `${offset}px 0` : `0 ${offset}px`;
}
// Past a third of the panel, or on a quick flick toward the edge, the drawer closes; otherwise it springs back.
function up() {
  if (!start || !panel) return;
  start = null;
  const size = axis() === "x" ? panel.offsetWidth : panel.offsetHeight;
  const toward = offset * sign();
  const [a, b] = [samples[0], samples[samples.length - 1]];
  const velocity = a && b && b.t > a.t ? ((b.v - a.v) / (b.t - a.t)) * 1000 : 0;
  if (toward > size / 3 || (toward > 0 && velocity * sign() > 500)) {
    closeButton.value?.$el.click();
    return;
  }
  animate(panel, { translate: axis() === "x" ? ["" + offset + "px 0", "0px 0"] : ["0 " + offset + "px", "0 0px"] } as never, motionTokens.spring.snappy as never).finished.then(() => panel && (panel.style.translate = ""));
  offset = 0;
}
</script>

<template>
  <DialogPortal :to="container ?? undefined">
    <DialogOverlay :class="cn('mc-drawer__overlay', 'mc-drawer__keyframes', classNames?.overlay)" :data-contained="container ? '' : undefined" />
    <DialogContent :ref="setPanel" v-bind="{ ...forwarded, ...$attrs }" :data-side="side" :data-contained="container ? '' : undefined" :class="cn('mc-drawer__content', 'mc-drawer__keyframes')">
      <div ref="header" :class="cn('mc-drawer__header', !reduced && 'mc-drawer__handle', classNames?.header)" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
        <div>
          <DialogTitle :class="cn('mc-drawer__title', classNames?.title)"><span ref="titleText" class="mc-drawer__swap">{{ title }}</span></DialogTitle>
          <DialogDescription v-if="description" :class="cn('mc-drawer__description', classNames?.description)"><span ref="descriptionText" class="mc-drawer__swap">{{ description }}</span></DialogDescription>
        </div>
        <DialogClose ref="closeButton" :class="cn('mc-drawer__close', classNames?.close)" aria-label="Close drawer"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></DialogClose>
      </div>
      <div :class="cn('mc-drawer__body', classNames?.body)"><slot /></div>
    </DialogContent>
  </DialogPortal>
</template>
