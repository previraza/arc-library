<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { BY_ISO, PHONE_COUNTRIES, capDigits, flagOf, formatNational, onlyDigits, parsePhoneNumber, statusOf, toE164 } from "@/lib/phone";
import type { PhoneCountry, PhoneStatus } from "@/lib/phone";

export interface PhoneInputDetails {
  country: PhoneCountry;
  formatted: string;
  status: PhoneStatus;
  valid: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    defaultCountry?: string;
    countries?: string[];
    preferredCountries?: string[];
    description?: string;
    error?: string;
    /** Show a message after blur when the number has the wrong length. */
    validate?: boolean;
    disabled?: boolean;
    /** Extend the inner, named parts of the phone input: shell, flag, input, list, option or hint. */
    classNames?: { shell?: string; flag?: string; input?: string; list?: string; option?: string; hint?: string };
  }>(),
  { defaultCountry: "US", preferredCountries: () => ["US", "CA", "GB"], validate: true, disabled: false },
);

const emit = defineEmits<{ change: [details: PhoneInputDetails]; countryChange: [iso: string] }>();
/** `v-model` binds the number in E.164, such as "+14155550132". */
const model = defineModel<string>({ default: "" });
const id = useId();
const root = ref<HTMLElement>();
const search = ref<HTMLInputElement>();
const open = ref(false);
const query = ref("");
const active = ref(0);
const touched = ref(false);

const pool = computed(() => (props.countries ? PHONE_COUNTRIES.filter((entry) => props.countries!.includes(entry.iso)) : PHONE_COUNTRIES));
const start = parsePhoneNumber(model.value, pool.value);
const iso = ref(start?.country.iso ?? props.defaultCountry);
const digits = ref(start?.national ?? "");

const country = computed(() => BY_ISO.get(iso.value) ?? pool.value[0]);
const status = computed(() => statusOf(country.value, digits.value));
const formatted = computed(() => formatNational(country.value, digits.value));

// A model changed from outside replaces what was typed.
watch(model, (next) => {
  if (next === toE164(country.value, digits.value)) return;
  const parsed = parsePhoneNumber(next, pool.value);
  if (parsed) {
    iso.value = parsed.country.iso;
    digits.value = parsed.national;
  } else if (!next) digits.value = "";
});

const needle = computed(() => query.value.trim().toLowerCase().replace(/^\+/, ""));
const matches = computed(() => pool.value.filter((entry) => !needle.value || entry.name.toLowerCase().includes(needle.value) || entry.dial.startsWith(needle.value) || entry.iso.toLowerCase() === needle.value));
const suggested = computed(() => (needle.value ? [] : pool.value.filter((entry) => props.preferredCountries.includes(entry.iso))));
const flat = computed(() => [...suggested.value, ...matches.value]);
const message = computed(() => props.error ?? (props.validate && touched.value && status.value !== "empty" && status.value !== "valid" ? (status.value === "too-long" ? "This number is too long." : "This number looks incomplete.") : undefined));

function publish(entry: PhoneCountry, next: string) {
  const nextStatus = statusOf(entry, next);
  model.value = toE164(entry, next);
  emit("change", { country: entry, formatted: formatNational(entry, next), status: nextStatus, valid: nextStatus === "valid" });
}

function onInput(event: Event) {
  const text = (event.target as HTMLInputElement).value;
  if (text.trim().startsWith("+")) {
    const parsed = parsePhoneNumber(text, pool.value);
    if (parsed) {
      if (parsed.country.iso !== iso.value) emit("countryChange", parsed.country.iso);
      iso.value = parsed.country.iso;
      digits.value = parsed.national;
      return publish(parsed.country, parsed.national);
    }
    if (text.trim() === "+") return show();
  }
  digits.value = capDigits(country.value, onlyDigits(text));
  (event.target as HTMLInputElement).value = formatNational(country.value, digits.value);
  publish(country.value, digits.value);
}

async function show() {
  open.value = true;
  query.value = "";
  active.value = 0;
  await nextTick();
  search.value?.focus();
}

function hide() {
  open.value = false;
  root.value?.querySelector<HTMLElement>(".mc-phone__flag")?.focus();
}

function choose(entry: PhoneCountry) {
  iso.value = entry.iso;
  digits.value = capDigits(entry, digits.value);
  emit("countryChange", entry.iso);
  publish(entry, digits.value);
  hide();
}

function onSearchKeydown(event: KeyboardEvent) {
  const count = flat.value.length;
  if (event.key === "ArrowDown" && count) active.value = (active.value + 1) % count;
  else if (event.key === "ArrowUp" && count) active.value = (active.value - 1 + count) % count;
  else if (event.key === "Home") active.value = 0;
  else if (event.key === "End") active.value = Math.max(0, count - 1);
  else if (event.key === "Enter" && flat.value[active.value]) choose(flat.value[active.value]);
  else if (event.key === "Escape") hide();
  else return;
  event.preventDefault();
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-phone" :data-disabled="disabled || undefined">
    <label :for="`${id}-input`" class="mc-phone__label">{{ label }}</label>
    <div class="mc-phone__anchor">
      <div :class="['mc-phone__shell', classNames?.shell]" :data-invalid="message ? '' : undefined">
        <button type="button" :class="['mc-phone__flag', classNames?.flag]" :aria-label="`Country, ${country.name} +${country.dial}`" aria-haspopup="listbox" :aria-expanded="open" :disabled="disabled" @click="open ? hide() : show()" @keydown.down.prevent="show()">
          <span aria-hidden="true">{{ flagOf(country.iso) }}</span><span>+{{ country.dial }}</span>
        </button>
        <input :id="`${id}-input`" type="tel" autocomplete="tel" inputmode="tel" :value="formatted" :placeholder="country.example" :disabled="disabled" :aria-invalid="message ? true : undefined" :aria-describedby="message || description ? `${id}-hint` : undefined" :class="['mc-phone__input', classNames?.input]" @input="onInput" @blur="touched = true" />
        <svg v-if="status === 'valid'" class="mc-phone__valid" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </div>
      <div v-if="open" :class="['mc-phone__list', classNames?.list]">
        <input ref="search" v-model="query" class="mc-phone__search" type="text" role="combobox" autocomplete="off" placeholder="Search country or +code" aria-label="Search country" aria-expanded="true" :aria-controls="`${id}-list`" :aria-activedescendant="flat.length ? `${id}-option-${active}` : undefined" @keydown="onSearchKeydown" @input="active = 0" />
        <div :id="`${id}-list`" role="listbox" aria-label="Countries" class="mc-phone__options">
          <div v-if="suggested.length" class="mc-phone__group" role="presentation">Suggested</div>
          <div v-for="(entry, index) in suggested" :id="`${id}-option-${index}`" :key="`s-${entry.iso}`" role="option" :aria-selected="entry.iso === iso" :data-active="active === index || undefined" :class="['mc-phone__option', classNames?.option]" @pointermove="active = index" @click="choose(entry)"><span aria-hidden="true">{{ flagOf(entry.iso) }}</span><span class="mc-phone__name">{{ entry.name }}</span><span class="mc-phone__dial">+{{ entry.dial }}</span></div>
          <div class="mc-phone__group" role="presentation">{{ needle ? "Results" : "All countries" }}</div>
          <div v-for="(entry, index) in matches" :id="`${id}-option-${suggested.length + index}`" :key="entry.iso" role="option" :aria-selected="entry.iso === iso" :data-active="active === suggested.length + index || undefined" :class="['mc-phone__option', classNames?.option]" @pointermove="active = suggested.length + index" @click="choose(entry)"><span aria-hidden="true">{{ flagOf(entry.iso) }}</span><span class="mc-phone__name">{{ entry.name }}</span><span class="mc-phone__dial">+{{ entry.dial }}</span></div>
          <p v-if="matches.length === 0" class="mc-phone__empty">No country matches.</p>
        </div>
      </div>
    </div>
    <span v-if="message" :id="`${id}-hint`" role="alert" :class="['mc-phone__hint', 'mc-phone__hint--error', classNames?.hint]">{{ message }}</span>
    <span v-else-if="description" :id="`${id}-hint`" :class="['mc-phone__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-phone { display: grid; gap: var(--space-2); min-width: 0; }
.mc-phone[data-disabled] { opacity: .5; }
.mc-phone__label { font-size: var(--text-sm); font-weight: 500; }
.mc-phone__anchor { position: relative; }
.mc-phone__shell { display: flex; align-items: center; min-height: var(--control-height-md); overflow: hidden; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-phone__shell:focus-within { border-color: var(--foreground); }
.mc-phone__shell[data-invalid] { border-color: var(--danger); }
.mc-phone__flag { display: inline-flex; align-items: center; gap: 6px; align-self: stretch; padding: 0 var(--space-3); border: 0; border-right: 1px solid var(--border); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-phone__flag:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-phone__input { flex: 1; min-width: 0; padding: 0 var(--space-3); border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
.mc-phone__valid { margin-right: var(--space-3); color: var(--success); }
.mc-phone__list { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: min(100%, 340px); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-phone-in .18s var(--ease-enter) both; transform-origin: top left; }
.mc-phone__search { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 0; border-bottom: 1px solid var(--border); outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-phone__options { max-height: 260px; padding: 4px; overflow: auto; }
.mc-phone__group { padding: var(--space-2) var(--space-3) 2px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; }
.mc-phone__option { display: flex; align-items: center; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-phone__option[data-active] { background: var(--surface-muted); }
.mc-phone__option[aria-selected="true"] { font-weight: 600; }
.mc-phone__name { flex: 1; } .mc-phone__dial { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-phone__empty { margin: 0; padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
.mc-phone__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-phone__hint--error { color: var(--danger); }
@keyframes mc-phone-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-phone__shell { transition: none; } .mc-phone__list { animation: none; } }
</style>
