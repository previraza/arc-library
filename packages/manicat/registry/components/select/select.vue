<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue, SelectViewport } from "reka-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-vue-next";
import { createLabelSwap } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";

const props = withDefaults(
  defineProps<{
    label: string;
    description?: string;
    placeholder?: string;
    id?: string;
    disabled?: boolean;
    options: { value: string; label: string; disabled?: boolean }[];
    /** Extend the inner, named parts of the select: trigger, valueText, chevron, content, scrollButton, viewport, item, indicator or hint. */
    classNames?: { trigger?: string; valueText?: string; chevron?: string; content?: string; scrollButton?: string; viewport?: string; item?: string; indicator?: string; hint?: string };
  }>(),
  { placeholder: "Select an option" },
);

const model = defineModel<string>();
const generated = useId();
const controlId = computed(() => props.id ?? generated);
const hintId = computed(() => (props.description ? `${controlId.value}-description` : undefined));
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const index = computed(() => props.options.findIndex((option) => option.value === model.value));
const shown = computed(() => (model.value ? props.options[index.value]?.label ?? "" : props.placeholder));
const valueText = ref<HTMLElement>();
const valueSpan = ref<HTMLElement>();
let swap: LabelSwap | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
// The shown value rolls in the direction of the list: a later option rises from below, an earlier one drops from above.
const labelIndex = (text: string) => props.options.findIndex((option) => option.label === text);
const direction = (next: string, previous: string) => (labelIndex(next) >= labelIndex(previous) ? 1 : -1);

onMounted(() => {
  if (valueText.value && valueSpan.value) swap = createLabelSwap(valueText.value, valueText.value, valueSpan.value, { reduced, width: false, pop: false, variant: "rise", direction });
});
onBeforeUnmount(() => swap?.destroy());
</script>

<template>
  <div class="mc-select__field">
    <label :for="controlId">{{ label }}</label>
    <SelectRoot v-model="model" :disabled="disabled">
      <SelectTrigger :id="controlId" :aria-describedby="hintId" :class="cn('mc-select__trigger', classNames?.trigger)">
        <!-- The real value stays for assistive tech; the visible copy below animates between values. -->
        <span class="mc-select__srOnly"><SelectValue :placeholder="placeholder" /></span>
        <span ref="valueText" :class="cn('mc-select__valueText', classNames?.valueText)" aria-hidden="true">
          <span ref="valueSpan" :data-placeholder="model ? undefined : ''">{{ shown }}</span>
        </span>
        <SelectIcon :class="cn('mc-select__chevron', classNames?.chevron)"><ChevronDown :size="16" :stroke-width="1.75" aria-hidden="true" /></SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent :class="cn('mc-select__content', classNames?.content)" position="popper" :side-offset="4" :collision-padding="12">
          <SelectScrollUpButton :class="cn('mc-select__scrollButton', classNames?.scrollButton)"><ChevronUp :size="16" :stroke-width="1.75" aria-hidden="true" /></SelectScrollUpButton>
          <SelectViewport :class="cn('mc-select__viewport', classNames?.viewport)">
            <SelectItem v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled" :class="cn('mc-select__item', classNames?.item)">
              <SelectItemText>{{ option.label }}</SelectItemText>
              <SelectItemIndicator :class="cn('mc-select__indicator', classNames?.indicator)"><Check :size="16" :stroke-width="1.75" aria-hidden="true" /></SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
          <SelectScrollDownButton :class="cn('mc-select__scrollButton', classNames?.scrollButton)"><ChevronDown :size="16" :stroke-width="1.75" aria-hidden="true" /></SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <span v-if="description" :id="hintId" :class="cn('mc-select__hint', classNames?.hint)">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-select__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-select__field label { font-size: var(--text-sm); font-weight: 500; }
/* The trigger anchors the floating menu. Radix opens on pointerdown and measures this box, so it never scales: press feedback is color only. */
.mc-select__trigger { position: relative; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-select__trigger:hover:not([data-disabled]) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-select__trigger:active:not([data-disabled]), .mc-select__trigger[data-state="open"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-select__trigger:focus-visible { border-color: var(--border-strong); }
.mc-select__trigger[data-disabled] { opacity: .5; cursor: not-allowed; }
.mc-select__valueText { display: grid; flex: 1; min-width: 0; grid-template-columns: minmax(0, 1fr); }
.mc-select__valueText > span { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-select__valueText > [data-placeholder] { color: var(--text-muted); }
.mc-select__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-select__chevron { display: inline-flex; flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard); }
.mc-select__trigger[data-state="open"] .mc-select__chevron { transform: rotate(180deg); }
.mc-select__hint { color: var(--text-muted); font-size: var(--text-xs); }
/* Radix holds the animation until the menu is positioned, so it always grows from the trigger edge. */
.mc-select__content { --menu-x: 0px; --menu-y: -6px; box-sizing: border-box; z-index: 1000; width: var(--reka-select-trigger-width); min-width: var(--reka-select-trigger-width); max-width: min(24rem, calc(100vw - 20px)); max-height: min(320px, var(--reka-select-content-available-height)); overflow: hidden; border: 1px solid var(--border); border-radius: calc(var(--radius-control) + 2px); padding: 6px; background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); transform-origin: var(--reka-select-content-transform-origin); animation: mc-select-select-in var(--duration-standard) var(--ease-enter) both; }
.mc-select__content[data-side="top"] { --menu-y: 6px; }
.mc-select__content[data-side="left"] { --menu-x: 6px; --menu-y: 0px; }
.mc-select__content[data-side="right"] { --menu-x: -6px; --menu-y: 0px; }
.mc-select__content[data-state="closed"] { animation: mc-select-select-out var(--duration-instant) var(--ease-standard) both; }
.mc-select__viewport { padding: 2px 0; }
.mc-select__item { position: relative; display: flex; align-items: center; min-height: 36px; border-radius: calc(var(--radius-control) - 4px); padding: 0 34px 0 11px; color: var(--foreground); font-size: var(--text-sm); cursor: default; outline: none; user-select: none; transition: background-color var(--duration-instant) var(--ease-standard), color var(--duration-instant) var(--ease-standard); }
.mc-select__item[data-highlighted] { background: var(--surface-muted); }
.mc-select__item[data-disabled] { opacity: .45; }
.mc-select__indicator { position: absolute; right: 10px; display: inline-flex; align-items: center; color: var(--foreground); animation: mc-select-indicator-in var(--duration-standard) var(--ease-enter) 40ms both; }
.mc-select__scrollButton { display: grid; height: 28px; place-items: center; color: var(--text-muted); }
@keyframes mc-select-select-in { from { opacity: 0; transform: translate(var(--menu-x), var(--menu-y)) scale(.97); } }
@keyframes mc-select-select-out { to { opacity: 0; transform: translate(calc(var(--menu-x) / 2), calc(var(--menu-y) / 2)) scale(.98); } }
@keyframes mc-select-indicator-in { from { opacity: 0; transform: scale(.6); filter: blur(2px); } }
@media (prefers-reduced-transparency: reduce) { .mc-select__content { background: var(--surface-raised); backdrop-filter: none; -webkit-backdrop-filter: none; } }
@media (prefers-reduced-motion: reduce) { .mc-select__trigger, .mc-select__chevron, .mc-select__item { transition: none; } .mc-select__content { animation: mc-select-select-fade var(--duration-instant) var(--ease-standard) both; } .mc-select__content[data-state="closed"] { animation: mc-select-select-fade-out var(--duration-instant) var(--ease-standard) both; } .mc-select__indicator { animation: none; } }
@keyframes mc-select-select-fade { from { opacity: 0; } }
@keyframes mc-select-select-fade-out { to { opacity: 0; } }
</style>
