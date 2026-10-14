<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate } from "motion";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { Check, ChevronDown, Search, X } from "lucide-vue-next";
import { followHeight } from "@/lib/command-palette";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  keywords?: string[];
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboboxOption[];
    defaultValue?: string;
    description?: string;
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    /** Extend the inner, named parts of the combobox: control, searchIcon, clear, chevron, hint, popover, listbox, option, check or empty. */
    classNames?: { control?: string; searchIcon?: string; clear?: string; chevron?: string; hint?: string; popover?: string; listbox?: string; option?: string; check?: string; empty?: string };
  }>(),
  { defaultValue: "", placeholder: "Search or select…", emptyMessage: "No matches found", disabled: false },
);

/** `v-model` binds the value of the chosen option. */
const model = defineModel<string | undefined>();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur, ease } = motionTokens;
const generated = useId();
const controlId = computed(() => (attrs.id as string | undefined) ?? generated);
const listboxId = computed(() => `${controlId.value}-listbox`);
const hintId = computed(() => (props.description ? `${controlId.value}-description` : undefined));
const root = ref<HTMLElement>();
const input = ref<HTMLInputElement>();
const auto = ref<HTMLElement>();
const inner = ref<HTMLElement>();
const internal = ref(props.defaultValue);
const open = ref(false);
const query = ref("");
const activeIndex = ref(-1);
let stopHeight: (() => void) | undefined;

const cn = (base: string, ...extra: (string | undefined | false)[]) => [base, ...extra].filter(Boolean).join(" ");
const selectedValue = computed(() => model.value ?? internal.value);
const selectedOption = computed(() => props.options.find((option) => option.value === selectedValue.value));
const filtered = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase();
  if (!normalized) return props.options;
  return props.options.filter((option) => [option.label, ...(option.keywords ?? [])].some((term) => term.toLocaleLowerCase().includes(normalized)));
});
const enabledIndices = computed(() => filtered.value.reduce<number[]>((indices, option, index) => { if (!option.disabled) indices.push(index); return indices; }, []));
const inputValue = computed(() => (open.value ? query.value : (selectedOption.value?.label ?? "")));
const activeOption = computed(() => (activeIndex.value >= 0 ? filtered.value[activeIndex.value] : undefined));

// A chosen label settles into the field: it rises in from below with a soft blur. Clearing fades the placeholder in instead of snapping from the old label.
watch(selectedValue, (value) => {
  const field = input.value;
  if (!field || reduced || (value && open.value)) return;
  if (value) animate(field, { opacity: [0, 1], y: ["0.35em", "0em"], filter: [`blur(${blur.soft}px)`, "blur(0px)"] } as never, { duration: duration.standard, ease: [...ease.enter] });
  else animate(field, { opacity: [0, 1] }, { duration: duration.fast, ease: [...ease.enter] });
});

// The highlighted option stays in view.
watch([activeIndex, filtered, open], async () => {
  if (!open.value) return;
  await nextTick();
  const option = activeOption.value ? root.value?.querySelector<HTMLElement>(`[id="${controlId.value}-option-${activeOption.value.value}"]`) : null;
  const listbox = option?.parentElement;
  if (option && listbox) {
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < listbox.scrollTop) listbox.scrollTop = top;
    else if (bottom > listbox.scrollTop + listbox.clientHeight) listbox.scrollTop = bottom - listbox.clientHeight;
  }
}, { flush: "post" });

function onPointerdown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false;
    query.value = "";
  }
}
onMounted(() => document.addEventListener("pointerdown", onPointerdown));
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerdown);
  stopHeight?.();
});
// The listbox follows its content height with a critically damped spring, so filtering never snaps the menu.
watch(inner, (node) => {
  stopHeight?.();
  stopHeight = node && auto.value ? followHeight(auto.value, node, reduced) : undefined;
}, { flush: "post" });

const choose = (option: ComboboxOption) => {
  if (option.disabled) return;
  internal.value = option.value;
  model.value = option.value;
  query.value = "";
  open.value = false;
  input.value?.focus();
};
function clear(event: MouseEvent) {
  event.preventDefault();
  internal.value = "";
  model.value = "";
  query.value = "";
  open.value = true;
  input.value?.focus();
}
function openMenu() {
  if (props.disabled) return;
  open.value = true;
  query.value = "";
  activeIndex.value = -1;
}
function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!open.value) return void openMenu();
    const list = enabledIndices.value;
    if (!list.length) return;
    const current = list.indexOf(activeIndex.value);
    const next = event.key === "ArrowDown" ? (current + 1) % list.length : (current - 1 + list.length) % list.length;
    activeIndex.value = list[next];
    return;
  }
  if (event.key === "Enter" && open.value && activeIndex.value >= 0) {
    event.preventDefault();
    const option = filtered.value[activeIndex.value];
    if (option) choose(option);
    return;
  }
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    open.value = false;
    query.value = "";
  }
}

function enterClear(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveClear(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.6, blur: blur.subtle }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
function enterPopover(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leavePopover(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -4, scale: 0.98 }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
function enterEmpty(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, y: 4, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
</script>

<template>
  <div ref="root" :class="cn('mc-combobox__field', attrs.class as string | undefined)">
    <label :for="controlId">{{ label }}</label>
    <div :class="cn('mc-combobox__control', open && 'mc-combobox__open', disabled && 'mc-combobox__disabled', attrs.class as string | undefined, classNames?.control)">
      <Search :class="cn('mc-combobox__searchIcon', classNames?.searchIcon)" :size="16" :stroke-width="1.75" aria-hidden="true" />
      <input
        v-bind="{ ...attrs, class: undefined }"
        :id="controlId"
        ref="input"
        type="text"
        role="combobox"
        :value="inputValue"
        :placeholder="selectedOption?.label ?? placeholder"
        :disabled="disabled"
        :aria-describedby="hintId"
        :aria-expanded="open"
        :aria-controls="open ? listboxId : undefined"
        aria-autocomplete="list"
        :aria-activedescendant="open && activeOption ? `${controlId}-option-${activeOption.value}` : undefined"
        @focus="openMenu"
        @click="openMenu"
        @input="query = ($event.target as HTMLInputElement).value; open = true; activeIndex = -1"
        @keydown="onKeydown"
      />
      <Transition :css="false" @enter="enterClear" @leave="leaveClear">
        <button v-if="selectedOption && !disabled" type="button" :class="cn('mc-combobox__clear', classNames?.clear)" aria-label="Clear selection" @mousedown.prevent @click="clear"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
      </Transition>
      <ChevronDown :class="cn('mc-combobox__chevron', classNames?.chevron)" :size="16" :stroke-width="1.75" aria-hidden="true" />
    </div>
    <span v-if="description" :id="hintId" :class="cn('mc-combobox__hint', classNames?.hint)">{{ description }}</span>
    <Transition :css="false" @enter="enterPopover" @leave="leavePopover">
      <div v-if="open" :class="cn('mc-combobox__popover', classNames?.popover)" role="presentation">
        <div ref="auto" class="mc-combobox__autoHeight">
          <div ref="inner">
            <div :id="listboxId" :class="cn('mc-combobox__listbox', classNames?.listbox)" role="listbox" :aria-label="`${label} options`">
              <template v-if="filtered.length">
                <div v-for="(option, index) in filtered" :id="`${controlId}-option-${option.value}`" :key="option.value" :class="cn('mc-combobox__option', classNames?.option)" :data-active="index === activeIndex ? 'true' : undefined" :data-disabled="option.disabled ? 'true' : undefined" role="option" :aria-selected="option.value === selectedValue" :aria-disabled="option.disabled || undefined" @mousedown.prevent @mouseenter="!option.disabled && (activeIndex = index)" @click="choose(option)">
                  <span>{{ option.label }}</span>
                  <Check v-if="option.value === selectedValue" :class="cn('mc-combobox__check', classNames?.check)" :size="16" :stroke-width="1.75" aria-hidden="true" />
                </div>
              </template>
              <Transition v-else appear :css="false" @enter="enterEmpty"><div :class="cn('mc-combobox__empty', classNames?.empty)" role="status">{{ emptyMessage }}</div></Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-combobox__field { position: relative; display: grid; gap: var(--space-2); min-width: 0; }
.mc-combobox__field label { font-size: var(--text-sm); font-weight: 500; }
.mc-combobox__control { position: relative; z-index: 2; display: flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-2); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-combobox__control:hover:not(.mc-combobox__disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-combobox__control:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--focus-ring); }
.mc-combobox__control.mc-combobox__open { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-combobox__control.mc-combobox__disabled { opacity: .5; cursor: not-allowed; }
.mc-combobox__searchIcon { flex: 0 0 auto; color: var(--text-muted); }
.mc-combobox__control input { width: 100%; min-width: 0; border: 0; outline: 0; padding: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-combobox__control input:focus-visible { outline: none; }
.mc-combobox__control input::placeholder { color: var(--text-muted); }
.mc-combobox__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-combobox__open .mc-combobox__chevron { transform: rotate(180deg); }
.mc-combobox__clear { display: grid; width: 22px; height: 22px; flex: 0 0 auto; place-items: center; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-combobox__clear:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-combobox__clear:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
.mc-combobox__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-combobox__popover { position: absolute; z-index: 80; top: calc(100% + 8px); right: 0; left: 0; overflow: hidden; transform-origin: top center; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); will-change: transform, opacity; }
.mc-combobox__autoHeight { overflow: hidden; }
.mc-combobox__listbox { max-height: min(300px, 40vh); overflow-y: auto; overscroll-behavior: contain; }
/* Arrow keys move the highlight often, so it changes almost instantly. */
.mc-combobox__option { display: flex; min-height: 36px; align-items: center; justify-content: space-between; gap: var(--space-3); border-radius: calc(var(--radius-panel) - 5px); padding: 0 12px; color: var(--foreground); font-size: var(--text-sm); cursor: pointer; outline: none; user-select: none; transition: background-color 80ms var(--ease-standard), color 80ms var(--ease-standard); }
.mc-combobox__option > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-combobox__option[data-active="true"] { background: var(--surface-muted); }
.mc-combobox__option[data-disabled="true"] { opacity: .42; cursor: not-allowed; }
.mc-combobox__check { flex: 0 0 auto; color: var(--foreground); }
.mc-combobox__empty { padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
@media (prefers-reduced-motion: reduce) { .mc-combobox__control, .mc-combobox__chevron, .mc-combobox__clear, .mc-combobox__option { transition: none; } }
</style>
