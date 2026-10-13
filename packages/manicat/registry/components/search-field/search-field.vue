<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { ref, useAttrs, useId } from "vue";
import { Search, X } from "lucide-vue-next";
import { playPose, pressable } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  /** Extend the inner, named parts of the search field: shell, input or clearSlot. */
  classNames?: { shell?: string; input?: string; clearSlot?: string };
}>();

const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const generated = useId();
const input = ref<HTMLInputElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

// Clearing returns focus to the field, since the clear button unmounts under the pointer.
function clear() {
  model.value = "";
  input.value?.focus();
}

// The clear button scales and blurs in on a spring and leaves a little faster; its slot is reserved, so the field never resizes.
const away = { opacity: 0, scale: 0.8, blur: motionTokens.blur.subtle };
const rest = { opacity: 1, scale: 1, blur: 0 };
function enter(el: Element, done: () => void) {
  pressable(el as HTMLElement, { reduced, enabled: () => true, scale: 0.96 });
  if (reduced) playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: motionTokens.duration.instant }).finished.then(done);
  else playPose(el, away, rest, { spring: "snappy", fade: motionTokens.duration.fast }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  if (reduced) playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0 }).finished.then(done);
  else playPose(el, rest, away, { duration: motionTokens.duration.instant, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div :class="cn('mc-search-field__field', attrs.class as string | undefined)">
    <label :for="(attrs.id as string | undefined) ?? generated">{{ label }}</label>
    <div :class="cn('mc-search-field__shell', classNames?.shell)" :data-filled="model ? 'true' : undefined">
      <Search :size="18" aria-hidden="true" />
      <input
        v-bind="{ ...attrs, class: undefined }"
        :id="(attrs.id as string | undefined) ?? generated"
        ref="input"
        type="search"
        :value="model"
        :class="cn('mc-search-field__input', classNames?.input)"
        @input="model = ($event.target as HTMLInputElement).value"
      />
      <!-- The clear button has a reserved slot, so the field never changes width when it appears or leaves. -->
      <span :class="cn('mc-search-field__clearSlot', classNames?.clearSlot)">
        <Transition :css="false" @enter="enter" @leave="leave">
          <button v-if="model" key="clear" type="button" tabindex="0" aria-label="Clear search" @click="clear"><X :size="16" aria-hidden="true" /></button>
        </Transition>
      </span>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-search-field__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-search-field__field label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); }
/* Focus darkens the border; the shell never changes size. */
.mc-search-field__shell { display: flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-2); border: 1px solid var(--border-strong); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-search-field__shell:hover:not(:focus-within) { border-color: var(--foreground); } }
.mc-search-field__shell:focus-within { border-color: var(--foreground); }
/* The glass wakes up with the field: muted at rest, full contrast while searching. */
.mc-search-field__shell > svg { flex: 0 0 auto; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-search-field__shell:focus-within > svg, .mc-search-field__shell[data-filled="true"] > svg { color: var(--foreground); }
.mc-search-field__input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); letter-spacing: var(--tracking-body); outline: 0; }
.mc-search-field__input:focus-visible { outline: 0; }
.mc-search-field__input::placeholder { color: var(--text-muted); }
.mc-search-field__input::-webkit-search-cancel-button { display: none; }
.mc-search-field__clearSlot { display: grid; width: 24px; height: 24px; flex: 0 0 auto; place-items: center; }
.mc-search-field__shell button { display: grid; width: 24px; height: 24px; flex: 0 0 auto; place-items: center; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-search-field__shell button:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-search-field__shell, .mc-search-field__shell > svg, .mc-search-field__shell button { transition: none; } }
</style>
