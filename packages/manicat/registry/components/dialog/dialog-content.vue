<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, useForwardPropsEmits } from "reka-ui";
import type { DialogContentEmits, DialogContentProps } from "reka-ui";
import { X } from "lucide-vue-next";
import { createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";

const props = defineProps<
  DialogContentProps & {
    title: string;
    description?: string;
    /** Extend the inner, named parts of the dialog content: header, title, description, close, body or overlay. */
    classNames?: { header?: string; title?: string; description?: string; close?: string; body?: string; overlay?: string };
  }
>();
const emits = defineEmits<DialogContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const titleText = ref<HTMLElement>();
const descriptionText = ref<HTMLElement>();
const swaps: LabelSwap[] = [];

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

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
</script>

<template>
  <DialogPortal>
    <DialogOverlay :class="cn('mc-dialog__overlay', 'mc-dialog__keyframes', classNames?.overlay)" />
    <DialogContent v-bind="{ ...forwarded, ...$attrs }" :class="cn('mc-dialog__content', 'mc-dialog__keyframes')">
      <div :class="cn('mc-dialog__header', classNames?.header)">
        <div>
          <DialogTitle :class="cn('mc-dialog__title', classNames?.title)"><span ref="titleText" class="mc-dialog__swap">{{ title }}</span></DialogTitle>
          <DialogDescription v-if="description" :class="cn('mc-dialog__description', classNames?.description)"><span ref="descriptionText" class="mc-dialog__swap">{{ description }}</span></DialogDescription>
        </div>
        <DialogClose :class="cn('mc-dialog__close', classNames?.close)" aria-label="Close dialog"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></DialogClose>
      </div>
      <div :class="cn('mc-dialog__body', classNames?.body)"><slot /></div>
    </DialogContent>
  </DialogPortal>
</template>
