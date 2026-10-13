<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate } from "motion";
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { ChevronDown, X } from "lucide-vue-next";
import { animateSize, playPose, pressable } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: MultiSelectOption[];
    placeholder?: string;
    description?: string;
    /** How many chosen labels show in the trigger before it summarises as "+N". */
    maxVisible?: number;
    disabled?: boolean;
    /** Extend the inner, named parts of the multi select: slot or clear. */
    classNames?: { slot?: string; clear?: string };
  }>(),
  { placeholder: "Select options", maxVisible: 2, disabled: false },
);

/** `v-model` binds the chosen values. */
const model = defineModel<string[]>({ default: () => [] });
const id = useId();
const labelId = `${id}-label`;
const valueId = `${id}-value`;
const root = ref<HTMLElement>();
const open = ref(false);
const activeIndex = ref(-1);
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { ease, duration, blur } = motionTokens;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const selected = computed(() => model.value);
const selectedSet = computed(() => new Set(selected.value));
const labelFor = (item: string) => props.options.find((option) => option.value === item)?.label ?? item;
const visible = computed(() => selected.value.slice(0, props.maxVisible).map((item) => ({ value: item, label: labelFor(item) })));
const remaining = computed(() => Math.max(0, selected.value.length - visible.value.length));
// A larger count rises from below, a smaller one drops from above.
let countDirection = 1;
watch(remaining, (next, previous) => (countDirection = next > previous ? 1 : -1), { flush: "sync" });
// A closed menu forgets its highlight, so the next open starts clean instead of on a stale hovered row.
watch(open, (now) => { if (!now) activeIndex.value = -1; });

function close(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener("pointerdown", close));
onBeforeUnmount(() => document.removeEventListener("pointerdown", close));

const toggle = (option: MultiSelectOption) => {
  if (props.disabled || option.disabled) return;
  model.value = selectedSet.value.has(option.value) ? selected.value.filter((item) => item !== option.value) : [...selected.value, option.value];
};
const clear = () => {
  model.value = [];
  open.value = false;
};
const enabled = computed(() => props.options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0));
function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === "Enter" && open.value && activeIndex.value >= 0) { event.preventDefault(); toggle(props.options[activeIndex.value]); return; }
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open.value = !open.value; return; }
  if (event.key === "Escape") { open.value = false; return; }
  if ((event.key === "ArrowDown" || event.key === "ArrowUp") && enabled.value.length) {
    event.preventDefault();
    open.value = true;
    const list = enabled.value;
    const current = list.indexOf(activeIndex.value);
    const next = current < 0 ? (event.key === "ArrowDown" ? 0 : list.length - 1) : event.key === "ArrowDown" ? (current + 1) % list.length : (current - 1 + list.length) % list.length;
    activeIndex.value = list[next];
  }
}

// Each chip sits in a slot whose width opens and collapses on a spring, so neighbours travel with it and nothing overlaps.
const chipAway = { scale: 0.9, blur: blur.soft };
const chipGone = { scale: 0.9, blur: blur.subtle };
const chipRest = { scale: 1, blur: 0 };
const placeholderOf = (el: Element) => el.classList.contains("mc-multi-select__placeholder");
function enterValue(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (placeholderOf(node)) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  if (reduced) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  node.style.width = "0px";
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast, ease: "enter" });
  if (node.firstElementChild) playPose(node.firstElementChild, chipAway, chipRest, { spring: "snappy", fade: duration.standard });
  animateSize(node, "width", "open", { spring: "smooth" }).finished.then(done);
}
function leaveValue(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (placeholderOf(node) || reduced) return void playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant, ease: "standard" });
  if (node.firstElementChild) playPose(node.firstElementChild, chipRest, chipGone, { duration: duration.instant, ease: "standard" });
  animateSize(node, "width", "close", { spring: "smooth" }).finished.then(done);
}

// The overflow count rolls: a larger number rises from below, a smaller one drops from above.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterCount(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.5 * countDirection), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveCount(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.5 * countDirection), blur: blur.subtle }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}

// The clear button scales and blurs in on a spring and leaves a little faster.
const clearAway = { opacity: 0, scale: 0.6, blur: blur.subtle };
const clearRest = { opacity: 1, scale: 1, blur: 0 };
function enterClear(el: Element, done: () => void) {
  pressable(el as HTMLElement, { reduced, enabled: () => true, scale: 0.96 });
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, clearAway, clearRest, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveClear(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, clearRest, clearAway, { duration: duration.instant, ease: "standard" }).finished.then(done);
}

// The menu drops in from just above on a spring.
function enterMenu(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveMenu(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -4, scale: 0.98 }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}

// A check that draws itself when an option is picked and retracts when it is removed.
function enterCheck(el: Element, done: () => void) {
  const path = el.querySelector("path");
  if (!path) return done();
  if (reduced) return void animate(path, { opacity: [0, 1] }, { duration: duration.instant }).finished.then(done);
  animate(path, { pathLength: [0, 1], opacity: [0, 1] }, { pathLength: { duration: duration.standard, ease: [...ease.enter] }, opacity: { duration: duration.instant } } as never).finished.then(done);
}
function leaveCheck(el: Element, done: () => void) {
  const path = el.querySelector("path");
  if (!path) return done();
  if (reduced) return void animate(path, { opacity: [1, 0] }, { duration: duration.instant }).finished.then(done);
  animate(path, { pathLength: [1, 0], opacity: [1, 0] }, { pathLength: { duration: duration.standard, ease: [...ease.enter] }, opacity: { duration: duration.instant } } as never).finished.then(done);
}
</script>

<template>
  <div ref="root" class="mc-multi-select__field">
    <span :id="labelId" class="mc-multi-select__label">{{ label }}</span>
    <div class="mc-multi-select__control">
      <button type="button" :class="['mc-multi-select__trigger', selected.length ? 'mc-multi-select__hasClear' : '']" :disabled="disabled" :aria-labelledby="`${labelId} ${valueId}`" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-listbox`" @click="open = !open" @keydown="onKeydown">
        <span :id="valueId" class="mc-multi-select__srOnly">{{ selected.length ? selected.map(labelFor).join(", ") : placeholder }}</span>
        <TransitionGroup tag="span" class="mc-multi-select__value" aria-hidden="true" :css="false" @enter="enterValue" @leave="leaveValue">
          <span v-for="item in visible" :key="`chip-${item.value}`" :class="cn('mc-multi-select__slot', classNames?.slot)"><span class="mc-multi-select__chip">{{ item.label }}</span></span>
          <span v-if="remaining > 0" key="more" :class="cn('mc-multi-select__slot', classNames?.slot)">
            <span class="mc-multi-select__more">+<span class="mc-multi-select__count"><Transition :css="false" @enter="enterCount" @leave="leaveCount"><span :key="remaining">{{ remaining }}</span></Transition></span></span>
          </span>
          <span v-if="!selected.length" key="placeholder" class="mc-multi-select__placeholder">{{ placeholder }}</span>
        </TransitionGroup>
        <ChevronDown class="mc-multi-select__chevron" :size="16" aria-hidden="true" />
      </button>
      <Transition :css="false" @enter="enterClear" @leave="leaveClear">
        <button v-if="selected.length > 0 && !disabled" type="button" aria-label="Clear selections" :class="cn('mc-multi-select__clear', classNames?.clear)" @click="clear"><X :size="14" aria-hidden="true" /></button>
      </Transition>
      <Transition :css="false" @enter="enterMenu" @leave="leaveMenu">
        <div v-if="open" :id="`${id}-listbox`" class="mc-multi-select__menu" role="listbox" :aria-label="label" aria-multiselectable="true">
          <button v-for="(option, index) in options" :key="option.value" type="button" role="option" :aria-selected="selectedSet.has(option.value)" :aria-disabled="option.disabled || undefined" class="mc-multi-select__option" :data-active="activeIndex === index" :disabled="option.disabled" @pointermove="activeIndex = index" @click="toggle(option)">
            <span>{{ option.label }}</span>
            <Transition :css="false" @enter="enterCheck" @leave="leaveCheck">
              <svg v-if="selectedSet.has(option.value)" key="check" class="mc-multi-select__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 9 17.5 20 6.5" /></svg>
            </Transition>
          </button>
        </div>
      </Transition>
    </div>
    <span v-if="description" class="mc-multi-select__description">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-multi-select__field { position: relative; display: grid; gap: var(--space-2); min-width: 0; }
.mc-multi-select__control { position: relative; min-width: 0; }
.mc-multi-select__label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
/* The trigger anchors the menu, so press feedback stays in color; it never scales. */
.mc-multi-select__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 5px 11px 5px 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-multi-select__trigger:active:not(:disabled), .mc-multi-select__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-multi-select__trigger:disabled { opacity: .5; cursor: not-allowed; }
/* The chevron stays pinned to the trailing edge; a selection only reserves room for the clear button beside it, so nothing jumps. */
.mc-multi-select__hasClear .mc-multi-select__chevron { margin-left: 26px; }
.mc-multi-select__value { position: relative; display: flex; min-width: 0; min-height: 26px; flex: 1; align-items: center; overflow: hidden; }
.mc-multi-select__placeholder, .mc-multi-select__description { color: var(--text-muted); }
/* The placeholder sits outside the flow so the first chip can open its slot from the leading edge. */
.mc-multi-select__placeholder { position: absolute; inset: 0; display: flex; align-items: center; overflow: hidden; white-space: nowrap; }
/* The slot clips while its width springs open or closed; the chip keeps its natural width so the label never re-truncates mid-flight. */
.mc-multi-select__slot { display: flex; flex: 0 1 auto; min-width: 0; overflow: hidden; }
.mc-multi-select__slot:has(.mc-multi-select__more) { flex-shrink: 0; }
.mc-multi-select__chip, .mc-multi-select__more { box-sizing: border-box; flex: 0 0 auto; max-width: 9rem; overflow: hidden; margin-right: 5px; border-radius: var(--radius-pill); padding: 4px 8px; background: var(--surface-muted); box-shadow: inset 0 0 0 1px var(--border-subtle); color: var(--foreground); text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-xs); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__chip, .mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__more { background: var(--surface); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__trigger:hover:not(:disabled) .mc-multi-select__chip, .mc-multi-select__trigger:hover:not(:disabled) .mc-multi-select__more { background: var(--surface); } }
.mc-multi-select__more { display: inline-flex; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.mc-multi-select__count { display: inline-grid; }
.mc-multi-select__count > span { grid-area: 1 / 1; }
.mc-multi-select__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-multi-select__clear { position: absolute; top: 0; bottom: 0; right: 36px; display: grid; width: 22px; height: 22px; margin: auto 0; place-items: center; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__clear:hover { background: var(--surface); color: var(--foreground); } }
.mc-multi-select__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__chevron { transform: rotate(180deg); }
.mc-multi-select__description { font-size: var(--text-xs); }
.mc-multi-select__menu { position: absolute; z-index: 80; top: calc(100% + 8px); right: 0; left: 0; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: top center; will-change: transform, opacity; }
/* Arrow keys move the highlight often, so it changes almost instantly. Selection is shown by the check, not by weight, so labels never reflow. */
.mc-multi-select__option { display: flex; width: 100%; min-height: 38px; align-items: center; justify-content: space-between; gap: 12px; border: 0; border-radius: calc(var(--radius-panel) - 5px); padding: 0 11px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: background-color 80ms var(--ease-standard), color 80ms var(--ease-standard); }
.mc-multi-select__option > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-multi-select__option[data-active="true"] { background: var(--surface-muted); }
.mc-multi-select__option:disabled { opacity: .42; cursor: not-allowed; }
.mc-multi-select__check { flex: 0 0 auto; }
@media (prefers-reduced-motion: reduce) { .mc-multi-select__trigger, .mc-multi-select__chevron, .mc-multi-select__option, .mc-multi-select__clear, .mc-multi-select__chip, .mc-multi-select__more { transition: none; } }
</style>
