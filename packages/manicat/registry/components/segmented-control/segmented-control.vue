<script setup lang="ts">
// @manicat-dependencies motion
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { createSegmentedControl } from "@/lib/motion-dom";

export interface Segment {
  value: string;
  label: string;
}

const props = defineProps<{
  options: Segment[];
  label?: string;
  /** Extend the inner, named parts of the control: track, button, selection or label. */
  classNames?: { track?: string; button?: string; selection?: string; label?: string };
}>();

const emit = defineEmits<{
  /** The pointer or focus reached an option, before it is chosen. Use it to start loading what that option shows. */
  optionIntent: [value: string];
}>();

const model = defineModel<string>({ required: true });
const id = useId();
const track = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let controller: ReturnType<typeof createSegmentedControl> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const selectedIndex = () => Math.max(0, props.options.findIndex((option) => option.value === model.value));

onMounted(() => {
  controller = createSegmentedControl(track.value!, { selectionClass: cn("mc-segmented-control__selection", props.classNames?.selection), reduced });
  controller.update();
});
watch([model, () => props.options.length], async () => {
  await nextTick();
  controller?.update();
});
onBeforeUnmount(() => controller?.destroy());

// Arrow keys, Home and End move the selection like a tab list; only the selected option is a tab stop.
function onKeyDown(event: KeyboardEvent) {
  const last = props.options.length - 1;
  const index = selectedIndex();
  const target = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index === last ? 0 : index + 1) : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index === 0 ? last : index - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
  if (target < 0 || !props.options[target]) return;
  event.preventDefault();
  model.value = props.options[target].value;
  track.value?.querySelector<HTMLElement>(`[data-value="${CSS.escape(props.options[target].value)}"]`)?.focus({ preventScroll: true });
}
</script>

<template>
  <div class="mc-segmented-control__root" role="group" :aria-label="label">
    <div ref="track" :class="cn('mc-segmented-control__track', classNames?.track)">
      <button
        v-for="(option, index) in options"
        :id="`${id}-${option.value}`"
        :key="option.value"
        :class="cn('mc-segmented-control__button', classNames?.button)"
        type="button"
        :data-value="option.value"
        :aria-pressed="model === option.value"
        :tabindex="index === selectedIndex() ? 0 : -1"
        @click="model = option.value"
        @keydown="onKeyDown"
        @pointerenter="emit('optionIntent', option.value)"
        @focus="emit('optionIntent', option.value)"
      >
        <span :class="cn('mc-segmented-control__label', classNames?.label)">{{ option.label }}<slot name="accessory" :option="option" /></span>
      </button>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame can shrink below its content inside flex and grid parents; the track then scrolls inside it. */
.mc-segmented-control__root { display: inline-flex; min-width: 0; max-width: 100%; flex-shrink: 1; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); }
/* The track owns the stacking context so the gliding highlight passes under every label, not over earlier ones. */
.mc-segmented-control__track { --fade-start: 0px; --fade-end: 0px; isolation: isolate; display: flex; min-width: 0; gap: 2px; overflow-x: auto; overscroll-behavior-x: contain; padding: 3px; border-radius: inherit; scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent); mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent); }
.mc-segmented-control__track::-webkit-scrollbar { display: none; }
.mc-segmented-control__track[data-fade-start] { --fade-start: 20px; }
.mc-segmented-control__track[data-fade-end] { --fade-end: 20px; }
/* Items never scale or change weight; only the highlight travels and the label color follows it. */
.mc-segmented-control__button { position: relative; flex: 0 0 auto; min-height: var(--control-height-sm); border: 0; border-radius: calc(var(--radius-control) - 4px); padding: 0 12px; background: transparent; color: var(--text-muted); font: inherit; font-size: var(--text-sm); font-weight: 500; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-segmented-control__button:hover { color: var(--foreground); } }
.mc-segmented-control__button:active, .mc-segmented-control__button[aria-pressed="true"] { color: var(--foreground); }
.mc-segmented-control__selection { position: absolute; z-index: -1; inset: 0; border: 1px solid var(--border); border-radius: inherit; background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-segmented-control__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px; }
@media (max-width: 380px) { .mc-segmented-control__button { padding: 0 10px; } }
@media (prefers-reduced-motion: reduce) { .mc-segmented-control__button { transition: none; } }
</style>
