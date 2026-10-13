<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { ChevronDown, Clock3 } from "lucide-vue-next";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = withDefaults(
  defineProps<{
    label: string;
    description?: string;
    placeholder?: string;
    minuteStep?: 1 | 5 | 10 | 15 | 30;
    format?: "12h" | "24h";
    disabled?: boolean;
    /** Extend the inner, named parts of the time picker: label, anchor, trigger, valueText, value, placeholder, chevron, menu, option, dot or description. */
    classNames?: { label?: string; anchor?: string; trigger?: string; valueText?: string; value?: string; placeholder?: string; chevron?: string; menu?: string; option?: string; dot?: string; description?: string };
  }>(),
  { placeholder: "Select a time", minuteStep: 15, format: "12h", disabled: false },
);

/** `v-model` binds the time as "HH:MM", on a 24 hour clock. */
const model = defineModel<string>({ default: "09:00" });
const id = useId();
const labelId = `${id}-label`;
const valueId = `${id}-value`;
const root = ref<HTMLElement>();
const menu = ref<HTMLElement>();
const open = ref(false);
const activeIndex = ref(-1);
let centerOnOpen = false;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;

const pad = (value: number) => String(value).padStart(2, "0");
const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
};
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const options = computed(() => Array.from({ length: Math.ceil(1440 / props.minuteStep) }, (_, index) => `${pad(Math.floor((index * props.minuteStep) / 60))}:${pad((index * props.minuteStep) % 60)}`));
const display = (raw: string) => {
  const minutes = toMinutes(raw);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return props.format === "24h" ? `${pad(hour)}:${pad(minute)}` : `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? "AM" : "PM"}`;
};

// The shown time rolls like a clock face: a later time rises from below, an earlier one drops from above.
let direction = 1;
watch(model, (next, previous) => (direction = toMinutes(next) >= toMinutes(previous) ? 1 : -1), { flush: "sync" });

function close(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener("pointerdown", close));
onBeforeUnmount(() => document.removeEventListener("pointerdown", close));

// Scroll only the menu, never the page: the selected time opens centered, arrow keys then keep the highlight in view.
watch([activeIndex, open], async () => {
  if (!open.value || activeIndex.value < 0) return;
  await nextTick();
  const list = menu.value;
  const option = list?.children[activeIndex.value] as HTMLElement | undefined;
  if (!option || !list) return;
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (centerOnOpen) {
    centerOnOpen = false;
    list.scrollTop = top - (list.clientHeight - option.offsetHeight) / 2;
  } else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}, { flush: "post" });

const choose = (next: string) => {
  model.value = next;
  open.value = false;
};
const openMenu = () => {
  const selectedIndex = options.value.indexOf(model.value);
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
  centerOnOpen = true;
  open.value = true;
};
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") { event.preventDefault(); open.value = false; return; }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (open.value && activeIndex.value >= 0) choose(options.value[activeIndex.value]);
    else openMenu();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!open.value) return void openMenu();
    activeIndex.value = (activeIndex.value + (event.key === "ArrowDown" ? 1 : -1) + options.value.length) % options.value.length;
  }
}

const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterValue(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, direction * 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveValue(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, direction * -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
function enterMenu(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveMenu(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -4, scale: 0.98 }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div ref="root" class="mc-time-picker__field">
    <span :id="labelId" :class="cn('mc-time-picker__label', classNames?.label)">{{ label }}</span>
    <div :class="cn('mc-time-picker__anchor', classNames?.anchor)">
      <button type="button" :class="cn('mc-time-picker__trigger', classNames?.trigger)" :disabled="disabled" :aria-labelledby="`${labelId} ${valueId}`" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-listbox`" @click="open ? (open = false) : openMenu()" @keydown="onKeydown">
        <Clock3 :size="16" aria-hidden="true" />
        <span :id="valueId" class="mc-time-picker__srOnly">{{ model ? display(model) : placeholder }}</span>
        <span :class="cn('mc-time-picker__valueText', classNames?.valueText)" aria-hidden="true">
          <Transition :css="false" @enter="enterValue" @leave="leaveValue">
            <span :key="model || 'placeholder'" :class="model ? cn('mc-time-picker__value', classNames?.value) : cn('mc-time-picker__placeholder', classNames?.placeholder)">{{ model ? display(model) : placeholder }}</span>
          </Transition>
        </span>
        <ChevronDown :class="cn('mc-time-picker__chevron', classNames?.chevron)" :size="16" aria-hidden="true" />
      </button>
      <Transition :css="false" @enter="enterMenu" @leave="leaveMenu">
        <div v-if="open" :id="`${id}-listbox`" ref="menu" :class="cn('mc-time-picker__menu', classNames?.menu)" role="listbox" :aria-label="`${label} options`">
          <button v-for="(option, index) in options" :id="`${id}-option-${index}`" :key="option" type="button" role="option" :aria-selected="option === model" :data-active="activeIndex === index || undefined" :class="cn('mc-time-picker__option', classNames?.option)" @pointermove="activeIndex = index" @click="choose(option)">
            {{ display(option) }}<span v-if="option === model" :class="cn('mc-time-picker__dot', classNames?.dot)" aria-hidden="true" />
          </button>
        </div>
      </Transition>
    </div>
    <span v-if="description" :class="cn('mc-time-picker__description', classNames?.description)">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-time-picker__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-time-picker__label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-time-picker__anchor { position: relative; min-width: 0; }
/* The trigger anchors the menu, so press feedback stays in color; it never scales. */
.mc-time-picker__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-time-picker__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-time-picker__trigger:active:not(:disabled), .mc-time-picker__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-time-picker__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-time-picker__trigger > svg:first-child { flex: 0 0 auto; color: var(--text-muted); }
.mc-time-picker__valueText { display: grid; flex: 1; min-width: 0; grid-template-columns: minmax(0, 1fr); }
.mc-time-picker__valueText > span { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-time-picker__value { font-variant-numeric: tabular-nums; }
.mc-time-picker__placeholder, .mc-time-picker__description { color: var(--text-muted); }
.mc-time-picker__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-time-picker__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-time-picker__trigger[aria-expanded="true"] .mc-time-picker__chevron { transform: rotate(180deg); }
.mc-time-picker__description { font-size: var(--text-xs); }
.mc-time-picker__menu { position: absolute; z-index: 80; top: calc(100% + 6px); right: 0; left: 0; max-height: 250px; overflow-y: auto; overscroll-behavior: contain; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: top center; will-change: transform, opacity; }
/* Arrow keys move the highlight often, so it changes almost instantly. The dot marks the chosen time, so only one row is ever highlighted. */
.mc-time-picker__option { display: flex; width: 100%; min-height: 36px; align-items: center; justify-content: space-between; border: 0; border-radius: calc(var(--radius-panel) - 5px); padding: 0 12px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: left; cursor: pointer; transition: background-color 80ms var(--ease-standard); }
.mc-time-picker__option[data-active="true"] { background: var(--surface-muted); }
.mc-time-picker__dot { width: 6px; height: 6px; border-radius: 999px; background: var(--foreground); }
@media (prefers-reduced-motion: reduce) { .mc-time-picker__trigger, .mc-time-picker__chevron, .mc-time-picker__option { transition: none; } }
</style>
