<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useAttrs, useId, watch } from "vue";
import { CalendarDays, ChevronDown } from "lucide-vue-next";
import Calendar from "@/registry/components/calendar/calendar.vue";
import { startOfMonth } from "@/lib/calendar";
import type { CalendarDateMatcher } from "@/lib/calendar";
import { createFlip, playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    description?: string;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: CalendarDateMatcher;
    locale?: string;
    format?: Intl.DateTimeFormatOptions;
    /** Adds a Today button to the calendar header. */
    showToday?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the date picker: label, anchor, trigger, valueText, value, part, partValue, placeholder, chevron, popover, footer, status or description. */
    classNames?: { label?: string; anchor?: string; trigger?: string; valueText?: string; value?: string; part?: string; partValue?: string; placeholder?: string; chevron?: string; popover?: string; footer?: string; status?: string; description?: string };
  }>(),
  { placeholder: "Select a date", locale: "en-US", format: () => ({ month: "short", day: "numeric", year: "numeric" }), showToday: false, disabled: false },
);

/** `v-model` binds the chosen date. */
const value = defineModel<Date | undefined>();
const attrs = useAttrs();
const generated = useId();
const controlId = computed(() => (attrs.id as string | undefined) ?? generated);
const hintId = computed(() => (props.description ? `${controlId.value}-description` : undefined));
const open = ref(false);
const month = ref(startOfMonth(value.value ?? new Date()));
const root = ref<HTMLElement>();
const trigger = ref<HTMLElement>();
const popover = ref<HTMLElement>();
const valueEl = ref<HTMLElement>();
let closeTimer: number | undefined;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const formatter = computed(() => new Intl.DateTimeFormat(props.locale, props.format));
const time = computed(() => value.value?.getTime() ?? null);
// Each part of the date rolls with time: a later date rises from below, an earlier one drops from above. Parts that did not change stay still.
const direction = ref(1);
watch(time, (next, previous) => (direction.value = next === null || previous === null || next >= previous ? 1 : -1), { flush: "sync" });
const shown = computed(() => (value.value ? formatter.value.format(value.value) : props.placeholder));
const parts = computed(() => (value.value ? formatter.value.formatToParts(value.value) : []));
// Parts after a wider or narrower segment move on the same curve the new text arrives on, so they never overlap it.
const flip = createFlip(() => [...(valueEl.value?.querySelectorAll<HTMLElement>("[data-part]") ?? [])], { reduced, transition: { duration: duration.standard, ease: "enter" } });
onBeforeUpdate(() => flip.measure());
onUpdated(() => flip.play());

function onPointerdown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) {
    window.clearTimeout(closeTimer);
    open.value = false;
  }
}
onMounted(() => document.addEventListener("pointerdown", onPointerdown));
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerdown);
  window.clearTimeout(closeTimer);
});

/** Opening moves focus to the day that owns the tab stop, so arrows work at once; a pointer open shows no ring. */
watch(open, async (now) => {
  if (!now) return;
  await nextTick();
  popover.value?.querySelector<HTMLButtonElement>('[data-present] [data-date][tabindex="0"]')?.focus({ preventScroll: true });
});

/** Closing hands focus back to the trigger when it was inside the calendar, so keyboard users never land on the page body. */
const close = () => {
  window.clearTimeout(closeTimer);
  if (popover.value?.contains(document.activeElement)) trigger.value?.focus();
  open.value = false;
};
/** The calendar always opens on the month of the current value, or today's month. */
const show = () => {
  window.clearTimeout(closeTimer);
  month.value = startOfMonth(value.value ?? new Date());
  open.value = true;
};
/** A picked day lets the highlight glide onto it and the footer confirm it, then the calendar returns to the field. */
const selectDate = (date: Date | undefined) => {
  value.value = date;
  window.clearTimeout(closeTimer);
  if (reduced || !date) close();
  else closeTimer = window.setTimeout(close, 300);
};
function onTriggerKeydown(event: KeyboardEvent) {
  if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open.value) {
    event.preventDefault();
    show();
  }
  if (event.key === "Escape") close();
}
/** Tabbing past the popover closes it; focus moving within the field keeps it open. */
function onBlur(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (open.value && next && !root.value?.contains(next)) {
    window.clearTimeout(closeTimer);
    open.value = false;
  }
}

const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterRoll(el: Element, done: () => void, custom = direction.value) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, custom * 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveRoll(el: Element, done: () => void, custom = direction.value) {
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, custom * -0.3), blur: blur.subtle }, { duration: 0.14, ease: "standard" }).finished.then(done);
}
// The value and the placeholder swap: the value rises in, the placeholder drops in, and whichever leaves goes up.
const enterWhole = (el: Element, done: () => void) => enterRoll(el, done, el.classList.contains("mc-date-picker__placeholder") ? -1 : 1);
const leaveWhole = (el: Element, done: () => void) => leaveRoll(el, done, 1);
function enterStatus(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveStatus(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: 0.14, ease: "standard" }).finished.then(done);
}
function enterPopover(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  else playPose(el, { opacity: 0, y: -8, scale: 0.95 }, { opacity: 1, y: 0, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leavePopover(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0.14, ease: "standard" }).finished.then(done);
  else playPose(el, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -6, scale: 0.97 }, { duration: 0.14, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div ref="root" :class="cn('mc-date-picker__field', attrs.class as string | undefined)" @focusout="onBlur">
    <label :class="cn('mc-date-picker__label', classNames?.label)" :for="controlId">{{ label }}</label>
    <div :class="cn('mc-date-picker__anchor', classNames?.anchor)">
      <button v-bind="{ ...attrs, class: undefined }" :id="controlId" ref="trigger" type="button" :disabled="disabled" aria-haspopup="dialog" :aria-expanded="open" :aria-describedby="hintId" :class="cn('mc-date-picker__trigger', classNames?.trigger)" @click="open ? close() : show()" @keydown="onTriggerKeydown">
        <CalendarDays :size="16" :stroke-width="1.75" aria-hidden="true" />
        <span class="mc-date-picker__srOnly">{{ shown }}</span>
        <span :class="cn('mc-date-picker__valueText', classNames?.valueText)" aria-hidden="true">
          <Transition :css="false" @enter="enterWhole" @leave="leaveWhole">
            <span v-if="value" key="value" ref="valueEl" :class="cn('mc-date-picker__value', classNames?.value)">
              <span v-for="(part, index) in parts" :key="`${index}-${part.type}`" :class="cn('mc-date-picker__part', classNames?.part)" data-part>
                <span v-if="part.type === 'literal'" :class="cn('mc-date-picker__partValue', classNames?.partValue)">{{ part.value }}</span>
                <Transition v-else :css="false" @enter="(el, done) => enterRoll(el, done)" @leave="(el, done) => leaveRoll(el, done)"><span :key="part.value" :class="cn('mc-date-picker__partValue', classNames?.partValue)">{{ part.value }}</span></Transition>
              </span>
            </span>
            <span v-else key="placeholder" :class="cn('mc-date-picker__placeholder', classNames?.placeholder)">{{ placeholder }}</span>
          </Transition>
        </span>
        <ChevronDown :class="cn('mc-date-picker__chevron', classNames?.chevron)" :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <Transition :css="false" @enter="enterPopover" @leave="leavePopover">
        <div v-if="open" ref="popover" :class="cn('mc-date-picker__popover', classNames?.popover)" role="dialog" :aria-label="`${label} calendar`" @keydown="(event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }">
          <Calendar :model-value="value" :month="month" :min-date="minDate" :max-date="maxDate" :disabled-dates="disabledDates" :locale="locale" :show-today="showToday" @update:model-value="selectDate" @update:month="month = $event" />
          <div :class="cn('mc-date-picker__footer', classNames?.footer)">
            <button type="button" :disabled="!value" @click="selectDate(undefined)">Clear</button>
            <span :class="cn('mc-date-picker__status', classNames?.status)"><Transition :css="false" @enter="enterStatus" @leave="leaveStatus"><span :key="time ?? 'none'">{{ value ? `Selected ${formatter.format(value)}` : "Choose a day" }}</span></Transition></span>
          </div>
        </div>
      </Transition>
    </div>
    <span v-if="description" :id="hintId" :class="cn('mc-date-picker__description', classNames?.description)">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-date-picker__field { display: grid; gap: 7px; min-width: 0; }
.mc-date-picker__label { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-date-picker__anchor { position: relative; min-width: 0; }
/* The trigger anchors the calendar, so press feedback stays in color; it never scales. */
.mc-date-picker__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-date-picker__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-date-picker__trigger:active:not(:disabled), .mc-date-picker__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-date-picker__trigger:disabled { cursor: not-allowed; opacity: .5; }
.mc-date-picker__trigger > svg:first-child { flex: 0 0 auto; color: var(--text-muted); }
/* Old and new values cross in place; each part of a date is its own box so a wider day or month moves the rest along on a spring. */
.mc-date-picker__valueText { position: relative; display: flex; flex: 1; min-width: 0; }
.mc-date-picker__value, .mc-date-picker__part { position: relative; display: inline-flex; white-space: pre; }
.mc-date-picker__value { font-variant-numeric: tabular-nums; }
.mc-date-picker__partValue { display: inline-block; white-space: pre; }
.mc-date-picker__placeholder { min-width: 0; overflow: hidden; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; }
.mc-date-picker__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-date-picker__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-date-picker__trigger[aria-expanded="true"] .mc-date-picker__chevron { transform: rotate(180deg); }
/* Grows out of the trigger's calendar icon and returns there on close. */
.mc-date-picker__popover { position: absolute; z-index: 20; top: calc(100% + 8px); left: 0; width: min(320px, calc(100vw - 32px)); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 16px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: 22px -8px; will-change: transform, opacity; }
/* On phone widths the calendar matches the field instead of running past the screen edge, and a tighter inset keeps the month and its controls on one row. */
@media (max-width: 360px) { .mc-date-picker__popover { right: 0; width: auto; padding: 12px; } }
.mc-date-picker__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 11px; color: var(--text-muted); font-size: var(--text-xs); }
/* Old and new status lines share one cell, pinned to the trailing edge so a shorter line never shifts. */
.mc-date-picker__status { display: grid; min-width: 0; justify-items: end; }
.mc-date-picker__status > span { grid-area: 1 / 1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-date-picker__footer button { border: 0; border-radius: var(--radius-control); padding: 4px 8px; background: transparent; color: var(--text-secondary); font: inherit; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-date-picker__footer button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); } }
.mc-date-picker__footer button:active:not(:disabled) { transform: scale(.97); transition-duration: var(--duration-fast), var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard); }
.mc-date-picker__footer button:disabled { cursor: not-allowed; opacity: .4; }
.mc-date-picker__description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); transition: opacity var(--duration-fast) var(--ease-standard); }
/* The open calendar covers the hint; fading it keeps its first letters from peeking past the popover's rounded corner. */
.mc-date-picker__anchor:has(.mc-date-picker__popover) + .mc-date-picker__description { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .mc-date-picker__trigger, .mc-date-picker__chevron, .mc-date-picker__footer button, .mc-date-picker__description { transition: none; } .mc-date-picker__footer button:active:not(:disabled) { transform: none; } }
</style>
