<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from "vue";
import { Check, CircleX, Info, TriangleAlert, X } from "lucide-vue-next";
import { animateSize, createAutoSize, createLabelSwap, playPose, popOut } from "@/lib/motion-dom";
import type { LabelSwap } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export type AlertTone = "info" | "success" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    tone?: AlertTone;
    title: string;
    /** Controls presence. Hiding the alert collapses its height and fades it out. Bind it with `v-model:open`. */
    open?: boolean;
    /** Shows a dismiss button. An uncontrolled alert collapses first, then emits `dismiss`. */
    dismissible?: boolean;
    /** Extend the inner, named parts of the alert: presence, icon, glyph, copy, content, title, line, description or dismiss. */
    classNames?: { presence?: string; icon?: string; glyph?: string; copy?: string; content?: string; title?: string; line?: string; description?: string; dismiss?: string };
  }>(),
  { tone: "info", open: undefined },
);

const emit = defineEmits<{ dismiss: []; "update:open": [open: boolean] }>();
const slots = useSlots();
const icons = { info: Info, success: Check, warning: TriangleAlert, danger: CircleX };
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const dismissed = ref(false);
const isOpen = computed(() => props.open ?? !dismissed.value);
const hasDetails = computed(() => Boolean(slots.default));

const frame = ref<HTMLElement>();
const content = ref<HTMLElement>();
const glyph = ref<HTMLElement>();
const titleLine = ref<HTMLElement>();
const descriptionLine = ref<HTMLElement>();
const swaps: LabelSwap[] = [];
let size: ReturnType<typeof createAutoSize> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The copy column follows its content height, and the icon, title and message morph in place when they change.
function attach() {
  swaps.splice(0).forEach((swap) => swap.destroy());
  size?.destroy();
  if (frame.value && content.value) size = createAutoSize(frame.value, content.value, { axis: "height", reduced });
  const follower = { arm: () => size?.changed(), destroy: () => undefined };
  if (glyph.value?.parentElement) swaps.push(createLabelSwap(glyph.value.parentElement, glyph.value.parentElement, glyph.value, { reduced, icon: true, width: false, variant: "badge" }));
  for (const line of [titleLine.value, descriptionLine.value]) {
    const box = line?.parentElement;
    if (line && box) swaps.push(createLabelSwap(box, box, line, { reduced, follower, variant: "badge" }));
  }
}
watch([frame, glyph, titleLine, descriptionLine], async () => {
  await nextTick();
  attach();
}, { flush: "post" });
onBeforeUnmount(() => {
  swaps.forEach((swap) => swap.destroy());
  size?.destroy();
});

// Presence collapses the height with the fade, so the content below closes the gap instead of jumping.
const timing = reduced ? ({ duration: 0 } as const) : ({ spring: "smooth" } as const);
function presenceIn(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  playPose(el, { opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: motionTokens.duration.standard, ease: "enter" });
  animateSize(node, "height", "open", timing).finished.then(() => {
    node.style.overflow = "";
    done();
  });
}
function presenceOut(el: Element, done: () => void) {
  (el as HTMLElement).style.overflow = "hidden";
  playPose(el, { opacity: 1 }, { opacity: 0 }, reduced ? { duration: 0 } : { duration: motionTokens.duration.fast, ease: "standard" });
  animateSize(el as HTMLElement, "height", "close", timing).finished.then(done);
}
function detailsIn(el: Element, done: () => void) {
  playPose(el, reduced ? { opacity: 0 } : { opacity: 0, y: 0.3 * parseFloat(getComputedStyle(el).fontSize), blur: motionTokens.blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.standard, ease: "enter" }).finished.then(done);
}
function detailsOut(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, reduced ? { opacity: 0 } : { opacity: 0, y: -0.3 * parseFloat(getComputedStyle(el).fontSize), blur: motionTokens.blur.subtle }, { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: "standard" }).finished.then(done);
}

function dismiss() {
  if (props.open === undefined) dismissed.value = true;
  else {
    emit("update:open", false);
    emit("dismiss");
  }
}
const afterLeave = () => {
  if (props.open === undefined && props.dismissible) emit("dismiss");
};
</script>

<template>
  <Transition :css="false" @enter="presenceIn" @leave="presenceOut" @after-leave="afterLeave">
    <div v-if="isOpen" key="alert" :class="cn('mc-alert__presence', classNames?.presence)">
      <div :class="['mc-alert__alert', `mc-alert__${tone}`]" :role="tone === 'danger' ? 'alert' : 'status'">
        <!-- A new tone morphs its icon in place. -->
        <span :class="cn('mc-alert__icon', classNames?.icon)"><span ref="glyph" :class="cn('mc-alert__glyph', classNames?.glyph)"><component :is="icons[tone]" :size="18" aria-hidden="true" /></span></span>
        <!-- The copy column follows its content height, so longer or shorter messages never snap the alert. -->
        <div ref="frame" :class="cn('mc-alert__copy', classNames?.copy)">
          <div ref="content" :class="cn('mc-alert__content', classNames?.content)">
            <strong :class="cn('mc-alert__title', classNames?.title)"><span ref="titleLine" :class="cn('mc-alert__line', classNames?.line)">{{ title }}</span></strong>
            <Transition :css="false" @enter="detailsIn" @leave="detailsOut">
              <p v-if="hasDetails" key="details" :class="cn('mc-alert__description', classNames?.description)"><span ref="descriptionLine" :class="cn('mc-alert__line', classNames?.line)"><slot /></span></p>
            </Transition>
          </div>
        </div>
        <button v-if="dismissible" type="button" :class="cn('mc-alert__dismiss', classNames?.dismiss)" :aria-label="`Dismiss: ${title}`" @click="dismiss"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
      </div>
    </div>
  </Transition>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-alert__presence { min-width: 0; }
.mc-alert__alert { display: flex; align-items: start; gap: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); padding: var(--space-4); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-alert__icon, .mc-alert__glyph { position: relative; display: grid; flex: 0 0 auto; place-items: center; }
.mc-alert__icon { width: 18px; height: 18px; margin-top: 1px; }
.mc-alert__icon svg { display: block; }
.mc-alert__copy { flex: 1; min-width: 0; }
.mc-alert__content { position: relative; }
.mc-alert__title { position: relative; display: block; font-size: var(--text-sm); font-weight: 500; }
.mc-alert__line { display: block; }
.mc-alert__description { position: relative; margin: var(--space-1) 0 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-alert__info .mc-alert__icon { color: var(--accent); } .mc-alert__success .mc-alert__icon { color: var(--success); } .mc-alert__warning .mc-alert__icon { color: var(--warning); } .mc-alert__danger .mc-alert__icon { color: var(--danger); }
.mc-alert__dismiss { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; margin: -5px -6px -5px 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-alert__dismiss:active { transform: scale(.96); transition-duration: var(--duration-instant); transition-timing-function: var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-alert__dismiss:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-alert__dismiss { transition: none; } .mc-alert__dismiss:active { transform: none; } }
</style>
