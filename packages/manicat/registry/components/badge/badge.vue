<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, useSlots } from "vue";
import { createAutoSize, createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";

export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

withDefaults(
  defineProps<{
    tone?: BadgeTone;
    size?: BadgeSize;
    /** Extend the inner, named parts of the badge: body, content, icon, glyph, label or text. */
    classNames?: { body?: string; content?: string; icon?: string; glyph?: string; label?: string; text?: string };
  }>(),
  { tone: "neutral", size: "md" },
);

const slots = useSlots();
const body = ref<HTMLElement>();
const content = ref<HTMLElement>();
const iconBox = ref<HTMLElement>();
const glyph = ref<HTMLElement>();
const label = ref<HTMLElement>();
const text = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const swaps: LabelSwap[] = [];
let autosize: ReturnType<typeof createAutoSize> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  // Width stays auto at rest. Only a new label or icon springs it from the old size to the new one.
  autosize = createAutoSize(body.value!, content.value!, { axis: "width", reduced });
  const follower = { arm: () => autosize?.changed(), destroy: () => undefined };
  if (iconBox.value && glyph.value) swaps.push(createLabelSwap(iconBox.value, iconBox.value, glyph.value, { reduced, icon: true, follower, variant: "badge" }));
  if (label.value && text.value) swaps.push(createLabelSwap(label.value, label.value, text.value, { reduced, follower, variant: "badge" }));
});
onBeforeUnmount(() => {
  swaps.forEach((swap) => swap.destroy());
  autosize?.destroy();
});
</script>

<template>
  <!-- The pill follows its content: text and icon swap in place while the width springs to the new size. -->
  <span :class="['mc-badge__badge', `mc-badge__${tone}`, `mc-badge__${size}`]">
    <span ref="body" :class="cn('mc-badge__body', classNames?.body)">
      <span ref="content" :class="cn('mc-badge__content', classNames?.content)">
        <span v-if="slots.icon" ref="iconBox" :class="cn('mc-badge__icon', classNames?.icon)" aria-hidden="true"><span ref="glyph" :class="cn('mc-badge__glyph', classNames?.glyph)"><slot name="icon" /></span></span>
        <span ref="label" :class="cn('mc-badge__label', classNames?.label)"><span ref="text" :class="cn('mc-badge__text', classNames?.text)"><slot /></span></span>
      </span>
    </span>
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-badge__badge {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  border: 1px solid var(--badge-border, var(--border));
  border-radius: var(--radius-pill);
  padding: 0 10px;
  color: var(--badge-foreground, var(--foreground));
  background: var(--badge-background, var(--surface));
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: -.01em;
  line-height: 1;
  white-space: nowrap;
  /* Clip keeps the inline baseline while the pill morphs around swapped text. */
  overflow: clip;
  transition: border-color var(--duration-standard) var(--ease-standard), background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .mc-badge__badge:hover { border-color: color-mix(in oklab, var(--badge-color, var(--foreground)) 32%, var(--border)); background: color-mix(in oklab, var(--badge-color, var(--foreground)) 10%, var(--surface)); }
}
.mc-badge__sm { min-height: 22px; padding: 0 8px; font-size: 11px; }
.mc-badge__md { font-size: var(--text-xs); }

.mc-badge__body { display: block; }
.mc-badge__content { position: relative; display: inline-flex; width: max-content; align-items: center; gap: 5px; }
.mc-badge__sm .mc-badge__content { gap: 4px; }
.mc-badge__label, .mc-badge__glyph { position: relative; display: inline-flex; align-items: center; }
.mc-badge__text { display: block; }

.mc-badge__icon {
  position: relative;
  display: inline-flex;
  width: auto;
  height: auto;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: var(--badge-color, var(--foreground));
  line-height: 1;
}

.mc-badge__neutral { --badge-color: var(--text-secondary); --badge-foreground: var(--text-secondary); --badge-background: var(--surface-muted); --badge-border: var(--border); }
.mc-badge__success { --badge-color: var(--success); --badge-foreground: var(--success); --badge-background: color-mix(in oklab, var(--success) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--success) 25%, var(--border)); }
.mc-badge__info { --badge-color: var(--accent); --badge-foreground: var(--accent-strong); --badge-background: var(--accent-subtle); --badge-border: color-mix(in oklab, var(--accent) 24%, var(--border)); }
.mc-badge__warning { --badge-color: var(--warning); --badge-foreground: var(--warning); --badge-background: color-mix(in oklab, var(--warning) 11%, var(--surface)); --badge-border: color-mix(in oklab, var(--warning) 27%, var(--border)); }
.mc-badge__danger { --badge-color: var(--danger); --badge-foreground: var(--danger); --badge-background: color-mix(in oklab, var(--danger) 10%, var(--surface)); --badge-border: color-mix(in oklab, var(--danger) 26%, var(--border)); }

@media (prefers-reduced-motion: reduce) {
  .mc-badge__badge { transition-duration: var(--duration-instant); }
}
</style>
