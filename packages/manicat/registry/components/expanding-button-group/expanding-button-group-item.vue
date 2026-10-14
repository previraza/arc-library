<script setup lang="ts">
// @manicat-dependencies motion
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Component } from "vue";
import { drawPath, playPose } from "@/lib/motion-dom";
import { animateLabel, createExpandingItem, swapPoses } from "@/lib/expanding-button-group";
import type { ExpandingButtonGroupSize } from "@/lib/expanding-button-group";

type Item = { id: string; label: string; icon: Component; doneLabel?: string; tone?: "neutral" | "danger"; disabled?: boolean };

const props = defineProps<{ item: Item; size: ExpandingButtonGroupSize; expanded: boolean; done: boolean; busy: boolean; tabStop: boolean; classNames?: Record<string, string | undefined> }>();
const emit = defineEmits<{ pointerdown: [item: Item, event: PointerEvent]; click: [item: Item]; focus: [item: Item, event: FocusEvent] }>();

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const button = ref<HTMLElement>();
const label = ref<HTMLElement>();
const sizerLabel = ref<HTMLElement>();
const sizerDone = ref<HTMLElement>();
let controller: ReturnType<typeof createExpandingItem> | undefined;

const showDone = computed(() => props.done && !!props.item.doneLabel);
const word = computed(() => (showDone.value ? props.item.doneLabel! : props.item.label));

onMounted(() => {
  controller = createExpandingItem(button.value!, { size: () => props.size, expanded: () => props.expanded, sizers: () => [sizerLabel.value ?? null, sizerDone.value ?? null], reduced });
  animateLabel(label.value!, props.expanded, { reduced, animated: false });
});
onBeforeUnmount(() => controller?.destroy());
watch(() => [props.item.label, props.item.doneLabel, props.size, props.expanded], async () => { await nextTick(); controller?.sync(); }, { flush: "post" });
watch(() => props.expanded, (on) => animateLabel(label.value!, on, { reduced, animated: true }), { flush: "post" });

const enterGlyph = (el: Element, done: () => void) => {
  const poses = swapPoses(el as HTMLElement, "icon", reduced);
  const path = el.querySelector("path");
  if (path) drawPath(path, { reduced, delay: 0.06 });
  void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done);
};
const leaveGlyph = (el: Element, done: () => void) => {
  const poses = swapPoses(el as HTMLElement, "icon", reduced);
  void playPose(el, poses.rest, poses.out, poses.leaveTiming).finished.then(done);
};
const enterWord = (el: Element, done: () => void) => {
  const poses = swapPoses(el as HTMLElement, "word", reduced);
  void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done);
};
const leaveWord = (el: Element, done: () => void) => {
  const poses = swapPoses(el as HTMLElement, "word", reduced);
  void playPose(el, poses.rest, poses.out, poses.leaveTiming).finished.then(done);
};
</script>

<template>
  <button ref="button" type="button" :class="cn('mc-expanding-button-group__item', 'item')" data-ebg-item="" :data-id="item.id" :data-tone="item.tone ?? 'neutral'" :data-state="showDone ? 'done' : 'idle'" :data-expanded="expanded || undefined" :aria-label="item.label" :aria-disabled="item.disabled || undefined" :aria-busy="busy || undefined" :tabindex="tabStop ? 0 : -1" @pointerdown="emit('pointerdown', item, $event)" @click="emit('click', item)" @focus="emit('focus', item, $event)">
    <span :class="cn('mc-expanding-button-group__icon', 'icon')" aria-hidden="true">
      <Transition :css="false" @enter="enterGlyph" @leave="leaveGlyph">
        <span :key="showDone ? 'done' : 'icon'" :class="cn('mc-expanding-button-group__glyph', 'glyph')">
          <svg v-if="showDone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
          <component :is="item.icon" v-else />
        </span>
      </Transition>
    </span>
    <span ref="label" :class="cn('mc-expanding-button-group__label', 'label')" aria-hidden="true">
      <Transition :css="false" @enter="enterWord" @leave="leaveWord">
        <span :key="word" :class="cn('mc-expanding-button-group__word', 'word')">{{ word }}</span>
      </Transition>
      <span ref="sizerLabel" :class="cn('mc-expanding-button-group__sizer', 'sizer')">{{ item.label }}</span>
      <span v-if="item.doneLabel" ref="sizerDone" :class="cn('mc-expanding-button-group__sizer', 'sizer')">{{ item.doneLabel }}</span>
    </span>
  </button>
</template>
