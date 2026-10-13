<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createChipBody } from "@/lib/chip-group";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = defineProps<{ hidden: number; expanded: boolean; tabbable: boolean; classNames?: { chip?: string; body?: string; surface?: string; moreText?: string; moreLine?: string } }>();
const emit = defineEmits<{ toggle: []; focusChip: [value: string] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const body = ref<HTMLElement>();
const surface = ref<HTMLElement>();
let chip: ReturnType<typeof createChipBody> | undefined;
let line: HTMLElement | undefined;
const text = () => (props.expanded ? "Show less" : `+${props.hidden} more`);
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

// The text stays centred on the visible surface while its edge catches up; a leaving line holds the offset it had when it left.
onMounted(() => {
  chip = createChipBody({ body: body.value!, surface: surface.value! }, { selected: false, reduced, onLag: (lag) => { if (line) line.style.transform = `translateX(${lag / 2}px)`; } });
});
onBeforeUnmount(() => chip?.destroy());
watch(text, () => chip?.update(false), { flush: "post" });

const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enter(el: Element, done: () => void) {
  line = el as HTMLElement;
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: 0.15, ease: "standard" }).finished.then(done);
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  el.setAttribute("aria-hidden", "true");
  popOut(el as HTMLElement);
  if (reduced) return void playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: 0.15, ease: "standard" }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
function setLine(el: unknown) {
  if (el instanceof HTMLElement) line = el;
}
</script>

<template>
  <button type="button" :class="cn('mc-chip-group__chip', classNames?.chip) + ' mc-chip-group__more'" data-more :aria-expanded="expanded" :tabindex="tabbable ? 0 : -1" @click="emit('toggle')" @focus="emit('focusChip', '\u0000more')">
    <span ref="body" :class="cn('mc-chip-group__body', classNames?.body)">
      <span ref="surface" :class="cn('mc-chip-group__surface', classNames?.surface)" aria-hidden="true" />
      <span :class="cn('mc-chip-group__moreText', classNames?.moreText)">
        <Transition :css="false" @enter="enter" @leave="leave"><span :key="text()" :ref="setLine" :class="cn('mc-chip-group__moreLine', classNames?.moreLine)">{{ text() }}</span></Transition>
      </span>
    </span>
  </button>
</template>
