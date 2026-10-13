<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { createRadioGroup } from "@/lib/motion-dom";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

const props = defineProps<{
  label: string;
  options: RadioOption[];
  name?: string;
  /** Extend the inner, named parts of the radio group: options, highlight, option, mark or dot. */
  classNames?: { options?: string; highlight?: string; option?: string; mark?: string; dot?: string };
}>();

const model = defineModel<string>({ required: true });
const id = useId();
const list = ref<HTMLElement>();
const highlight = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let controller: ReturnType<typeof createRadioGroup> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const selected = () => props.options.findIndex((option) => option.value === model.value);

onMounted(() => {
  controller = createRadioGroup(list.value!, highlight.value!, { reduced });
  controller.select(selected());
});
watch(() => [model.value, props.options.length], () => controller?.select(selected()), { flush: "post" });
onBeforeUnmount(() => controller?.destroy());
</script>

<template>
  <fieldset class="mc-radio-group__group">
    <legend>{{ label }}</legend>
    <div ref="list" :class="cn('mc-radio-group__options', classNames?.options)">
      <span ref="highlight" :class="cn('mc-radio-group__highlight', classNames?.highlight)" aria-hidden="true" />
      <label v-for="option in options" :key="option.value" :class="cn('mc-radio-group__option', classNames?.option)">
        <input v-model="model" type="radio" :name="name ?? id" :value="option.value" />
        <span :class="cn('mc-radio-group__mark', classNames?.mark)" aria-hidden="true"><span data-dot :class="cn('mc-radio-group__dot', classNames?.dot)" /></span>
        <span><strong>{{ option.label }}</strong><small v-if="option.description">{{ option.description }}</small></span>
      </label>
    </div>
  </fieldset>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-radio-group__group { display: grid; min-width: 0; margin: 0; border: 0; padding: 0; }
.mc-radio-group__group legend { margin-bottom: var(--space-2); padding: 0; font-size: var(--text-sm); font-weight: 500; }
/* One highlight travels between the rows: above their borders and fills, below their text, so it never crosses a label. */
.mc-radio-group__options { position: relative; display: grid; gap: var(--space-2); }
.mc-radio-group__highlight { position: absolute; top: 0; right: 0; left: 0; z-index: 1; box-sizing: border-box; border: 1px solid var(--control-on); border-radius: var(--radius-control); background: color-mix(in oklab, var(--control-on) 5%, transparent); opacity: 0; pointer-events: none; }
/* Rows answer a press with color only; the mark is what moves. */
/* The mark sits centered on the left edge of the row, whether or not the option has a description. */
.mc-radio-group__option { position: relative; display: flex; align-items: center; gap: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); padding: var(--space-3); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-radio-group__option:hover { background: var(--surface-muted); } }
.mc-radio-group__option:active { background: var(--surface-muted); }
/* Until the highlight is placed (server paint or no script), the checked row carries the same look itself. */
.mc-radio-group__options:not([data-ready]) .mc-radio-group__option:has(input:checked) { border-color: var(--control-on); background: color-mix(in oklab, var(--control-on) 5%, transparent); }
.mc-radio-group__option input { position: absolute; opacity: 0; }
/* Rows are not stacking contexts, so their mark and copy rise above the highlight while their border and fill stay below it. */
.mc-radio-group__option > span { position: relative; z-index: 2; }
.mc-radio-group__mark { display: grid; width: 17px; height: 17px; flex: 0 0 auto; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
/* 7px keeps the dot on whole pixels inside the 15px interior of the mark. */
.mc-radio-group__mark::after, .mc-radio-group__dot { grid-area: 1 / 1; width: 7px; height: 7px; border-radius: 50%; background: var(--foreground); }
/* A faint dot previews the choice while the pointer is down, then the real dot springs in on release. */
.mc-radio-group__mark::after { content: ""; opacity: 0; transition: opacity var(--duration-instant) var(--ease-standard); }
.mc-radio-group__option:active:not(:has(input:checked)) .mc-radio-group__mark::after { opacity: .22; }
/* The mark alone answers a press: a quick dip, then a spring back. */
.mc-radio-group__option:active .mc-radio-group__mark { transform: scale(.88); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform 100ms var(--ease-standard); }
.mc-radio-group__option:has(input:checked) .mc-radio-group__mark { border-color: var(--control-on); background: var(--control-on); }
.mc-radio-group__option:has(input:checked) .mc-radio-group__dot { background: var(--control-glyph); }
.mc-radio-group__option strong, .mc-radio-group__option small { display: block; }
.mc-radio-group__option strong { color: var(--text-secondary); font-size: var(--text-sm); font-weight: 500; transition: color var(--duration-standard) var(--ease-standard); }
.mc-radio-group__option:has(input:checked) strong { color: var(--foreground); }
.mc-radio-group__option small { margin-top: 2px; color: var(--text-muted); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-radio-group__option, .mc-radio-group__mark, .mc-radio-group__mark::after, .mc-radio-group__option strong { transition: none; } .mc-radio-group__option:active .mc-radio-group__mark { transform: none; } }
</style>
