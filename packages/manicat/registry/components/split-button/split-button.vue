<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import type { Component } from "vue";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from "reka-ui";
import { ChevronDown } from "lucide-vue-next";
import { createLabelSwap, createMorphText, followWidth } from "@/lib/motion-dom";
import type { LabelSwap, MorphText, WidthFollower } from "@/lib/motion-dom";

export interface SplitButtonAction {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: Component;
}

const props = withDefaults(
  defineProps<{
    label: string;
    actions: SplitButtonAction[];
    disabled?: boolean;
    variant?: "primary" | "secondary";
    /** Extend the inner, named parts of the split button: primary, primarySlot, primaryContent, mainIcon, trigger, chevron, menu, item, icon or itemIcon. */
    classNames?: { primary?: string; primarySlot?: string; primaryContent?: string; mainIcon?: string; trigger?: string; chevron?: string; menu?: string; item?: string; icon?: string; itemIcon?: string };
  }>(),
  { disabled: false, variant: "primary" },
);

const emit = defineEmits<{ click: [] }>();
const slots = useSlots();

const primarySlot = ref<HTMLElement>();
const primaryContent = ref<HTMLElement>();
const glyphHost = ref<HTMLElement>();
const mainIcon = ref<HTMLElement>();
const iconPhase = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let follower: WidthFollower | undefined;
let morph: MorphText | undefined;
let swap: LabelSwap | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  // The slot springs to the width of the next label (and icon); the letters and the icon move inside it.
  follower = followWidth(primarySlot.value!, primaryContent.value!, reduced);
  morph = createMorphText(glyphHost.value!, {
    text: props.label,
    reduced,
    arm: () => follower?.arm(),
    classes: { morph: "", glyphs: "mc-split-button__glyphs", glyph: "mc-split-button__glyph" },
  });
  if (mainIcon.value && iconPhase.value) swap = createLabelSwap(mainIcon.value, mainIcon.value, iconPhase.value, { reduced, follower, icon: true, pop: false });
});

watch(() => props.label, (next) => morph?.set(next));

onBeforeUnmount(() => {
  swap?.destroy();
  morph?.destroy();
  follower?.destroy();
});
</script>

<template>
  <DropdownMenuRoot>
    <div :class="[cn('mc-split-button__group', variant === 'secondary' ? 'mc-split-button__secondary' : undefined)]">
      <button :class="cn('mc-split-button__primary', classNames?.primary)" type="button" :disabled="disabled" @click="emit('click')">
        <span ref="primarySlot" :class="cn('mc-split-button__primarySlot', classNames?.primarySlot)" aria-hidden="true">
          <span ref="primaryContent" :class="cn('mc-split-button__primaryContent', classNames?.primaryContent)">
            <span v-if="slots.icon" ref="mainIcon" :class="cn('mc-split-button__mainIcon', classNames?.mainIcon)">
              <span ref="iconPhase" class="mc-split-button__iconPhase"><slot name="icon" /></span>
            </span>
            <span ref="glyphHost" style="display: contents" />
          </span>
        </span>
        <span class="mc-split-button__srOnly" aria-live="polite">{{ label }}</span>
      </button>
      <DropdownMenuTrigger :class="cn('mc-split-button__trigger', classNames?.trigger)" type="button" :aria-label="`${label} more actions`" :disabled="disabled">
        <ChevronDown :class="cn('mc-split-button__chevron', classNames?.chevron)" :size="16" :stroke-width="1.75" aria-hidden="true" />
      </DropdownMenuTrigger>
    </div>
    <DropdownMenuPortal>
      <DropdownMenuContent :class="cn('mc-split-button__menu', classNames?.menu)" :side-offset="4" align="end" :collision-padding="12" loop>
        <DropdownMenuItem
          v-for="(action, index) in actions"
          :key="action.label"
          :class="[cn('mc-split-button__item', classNames?.item), action.destructive ? 'mc-split-button__destructive' : '']"
          :style="{ '--i': index }"
          :disabled="action.disabled"
          @select="action.onSelect?.()"
        >
          <span v-if="action.icon" :class="cn('mc-split-button__icon', classNames?.icon)" aria-hidden="true"><component :is="action.icon" :size="16" /></span>
          {{ action.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* One pill, two actions. The whole pill presses in for the main action; the menu half answers in color only, because Radix measures it on pointerdown to place the menu. */
.mc-split-button__group { display: inline-flex; align-items: stretch; border: 1px solid var(--foreground); border-radius: var(--radius-control); background: var(--foreground); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-split-button__group:has(> .mc-split-button__primary:active:not(:disabled)) { transform: scale(.97); transition-duration: var(--duration-instant); transition-timing-function: var(--ease-standard); }
.mc-split-button__primary, .mc-split-button__trigger { border: 0; background: var(--foreground); color: var(--background); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
.mc-split-button__primary { position: relative; display: inline-grid; min-height: var(--control-height-md); place-items: center; padding: 0 var(--space-4); border-radius: calc(var(--radius-control) - 1px) 0 0 calc(var(--radius-control) - 1px); font-size: var(--text-sm); font-weight: 500; }
/* The slot springs to the width of the next label; the content leads from the start edge and is clipped only while it morphs. */
.mc-split-button__primarySlot { display: inline-flex; min-width: 0; align-items: center; }
.mc-split-button__primarySlot[data-morphing] { clip-path: inset(-50% calc(var(--space-2) * -1)); }
.mc-split-button__primaryContent { display: inline-flex; flex: none; align-items: center; gap: var(--space-2); white-space: nowrap; }
.mc-split-button__mainIcon { display: inline-grid; flex: none; place-items: center; }
.mc-split-button__iconPhase { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; }
.mc-split-button__glyphs { position: relative; display: inline-flex; flex: none; white-space: pre; }
.mc-split-button__glyph { display: inline-block; }
.mc-split-button__trigger { display: grid; width: 38px; min-height: var(--control-height-md); place-items: center; border-left: 1px solid color-mix(in oklab, var(--background) 18%, var(--foreground)); border-radius: 0 calc(var(--radius-control) - 1px) calc(var(--radius-control) - 1px) 0; }
.mc-split-button__chevron { transition: transform var(--duration-spring) var(--ease-spring); }
.mc-split-button__trigger[data-state="open"] .mc-split-button__chevron { transform: rotate(180deg); }
@media (hover: hover) and (pointer: fine) {
  .mc-split-button__primary:hover:not(:disabled), .mc-split-button__trigger:hover:not(:disabled) { background: color-mix(in oklab, var(--foreground) 88%, var(--background)); }
  .mc-split-button__secondary .mc-split-button__primary:hover:not(:disabled), .mc-split-button__secondary .mc-split-button__trigger:hover:not(:disabled) { background: var(--surface-muted); }
}
.mc-split-button__primary:active:not(:disabled), .mc-split-button__trigger:active:not(:disabled), .mc-split-button__trigger[data-state="open"] { background: color-mix(in oklab, var(--foreground) 80%, var(--background)); }
.mc-split-button__primary:disabled, .mc-split-button__trigger:disabled { cursor: not-allowed; opacity: .52; }
.mc-split-button__secondary { border-color: var(--border); border-radius: var(--radius-pill); background: var(--surface); }
.mc-split-button__secondary .mc-split-button__primary, .mc-split-button__secondary .mc-split-button__trigger { min-height: var(--control-height-sm); background: var(--surface); color: var(--foreground); }
.mc-split-button__secondary .mc-split-button__primary { min-width: 142px; border-radius: var(--radius-pill) 0 0 var(--radius-pill); padding-inline: var(--space-3); font-size: var(--text-xs); }
.mc-split-button__secondary .mc-split-button__trigger { width: 32px; border-left-color: var(--border-subtle); border-radius: 0 var(--radius-pill) var(--radius-pill) 0; }
.mc-split-button__secondary .mc-split-button__primary:active:not(:disabled), .mc-split-button__secondary .mc-split-button__trigger:active:not(:disabled), .mc-split-button__secondary .mc-split-button__trigger[data-state="open"] { background: color-mix(in oklab, var(--surface-muted), var(--border) 55%); }
.mc-split-button__icon { display: inline-flex; }
.mc-split-button__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
/* The menu grows from the trigger edge: offset toward the trigger, scale from the Radix origin, fade quickly; it leaves faster than it arrives.
   Transitions instead of keyframes, so a close that interrupts the open reverses from where the menu is instead of snapping to rest first. */
.mc-split-button__menu { --menu-x: 0px; --menu-y: -5px; z-index: 60; min-width: min(12rem, var(--reka-dropdown-menu-content-available-width)); max-width: var(--reka-dropdown-menu-content-available-width); padding: 5px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); transform-origin: var(--reka-dropdown-menu-content-transform-origin); transition: opacity var(--duration-fast) var(--ease-enter), transform var(--duration-spring) var(--ease-spring); }
.mc-split-button__menu[data-side="top"] { --menu-y: 5px; }
.mc-split-button__menu[data-side="left"] { --menu-x: 5px; --menu-y: 0px; }
.mc-split-button__menu[data-side="right"] { --menu-x: -5px; --menu-y: 0px; }
@starting-style {
  .mc-split-button__menu[data-state="open"] { opacity: 0; transform: translate(var(--menu-x), var(--menu-y)) scale(.97); }
  .mc-split-button__menu[data-state="open"] .mc-split-button__item { opacity: 0; transform: translate(calc(var(--menu-x) * .4), calc(var(--menu-y) * .4)); }
}
/* Radix unmounts when the exit animation ends, so a no-op keyframe times the exit while the transition does the visual work. */
.mc-split-button__menu[data-state="closed"] { opacity: 0; transform: translate(calc(var(--menu-x) * .5), calc(var(--menu-y) * .5)) scale(.985); transition: opacity 130ms var(--ease-standard), transform 130ms var(--ease-standard); animation: mc-split-button-menu-exit 130ms linear both; pointer-events: none; }
/* Highlight follows the pointer and arrow keys instantly, like a native menu. */
.mc-split-button__item { display: flex; min-height: var(--control-height-sm); align-items: center; gap: 10px; padding: 0 11px; border-radius: calc(var(--radius-panel) - 6px); font-size: var(--text-sm); cursor: pointer; outline: none; transition: opacity var(--duration-standard) var(--ease-enter) calc(min(var(--i, 0), 4) * 35ms), transform var(--duration-standard) var(--ease-enter) calc(min(var(--i, 0), 4) * 35ms); }
.mc-split-button__item[data-highlighted] { background: var(--surface-muted); }
.mc-split-button__item[data-disabled] { cursor: default; opacity: .45; }
.mc-split-button__destructive { color: var(--danger); }
.mc-split-button__destructive[data-highlighted] { background: color-mix(in oklab, var(--danger) 8%, var(--surface)); }
@keyframes mc-split-button-menu-exit { to { --menu-exit: 1; } }
@media (prefers-reduced-motion: reduce) {
  .mc-split-button__group, .mc-split-button__primary, .mc-split-button__trigger, .mc-split-button__chevron { transition: none; }
  .mc-split-button__group:has(> .mc-split-button__primary:active:not(:disabled)) { transform: none; }
  .mc-split-button__item { transition: none; }
  .mc-split-button__menu, .mc-split-button__menu[data-state="closed"] { transform: none; transition: opacity var(--duration-instant) linear; }
}
</style>
