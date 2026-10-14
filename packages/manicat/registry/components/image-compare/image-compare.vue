<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { createImageCompare } from "@/lib/image-compare";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Vertical stacks the images top and bottom. Changing it swings the divider a quarter turn instead of swapping layouts. */
    orientation?: "horizontal" | "vertical";
    defaultPosition?: number;
    /** Captions over each side. They fade as the divider reaches them. Pass false to hide them. */
    labels?: [string, string] | false;
    /** Accessible name of the divider. */
    label?: string;
    /** Frame proportions, as a CSS aspect-ratio. */
    aspectRatio?: string;
    /** Extend the inner, named parts of the image-compare: root, layer, chip, pivot, rotor, handleSlot, handle, chevrons or chevron. */
    classNames?: { root?: string; layer?: string; chip?: string; pivot?: string; rotor?: string; handleSlot?: string; handle?: string; chevrons?: string; chevron?: string };
  }>(),
  { orientation: "horizontal", defaultPosition: 50, labels: () => ["Before", "After"], label: "Before and after", aspectRatio: "3 / 2" },
);

/** `v-model` binds where the divider sits, in percent from the left (or top). The original is the `before` slot, the result the `after` slot. */
const model = defineModel<number | undefined>();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const internal = ref(props.defaultPosition);
const vertical = computed(() => props.orientation === "vertical");
const current = computed(() => Math.min(100, Math.max(0, model.value ?? internal.value)));
const afterShare = computed(() => Math.round(100 - current.value));
const root = ref<HTMLElement>();
const beforeLayer = ref<HTMLElement>();
const beforeChip = ref<HTMLElement>();
const afterChip = ref<HTMLElement>();
const afterBottom = ref<HTMLElement>();
const pivot = ref<HTMLElement>();
const rotor = ref<HTMLElement>();
const handleSlot = ref<HTMLElement>();
const handle = ref<HTMLElement>();
const chevrons = ref<HTMLElement>();
const left = ref<HTMLElement>();
const right = ref<HTMLElement>();
let compare: ReturnType<typeof createImageCompare> | undefined;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => {
  compare = createImageCompare(
    { root: root.value!, before: beforeLayer.value!, beforeChip: beforeChip.value, afterChip: afterChip.value, afterBottom: afterBottom.value, pivot: pivot.value!, rotor: rotor.value!, handleSlot: handleSlot.value!, handle: handle.value!, chevrons: chevrons.value!, left: left.value!, right: right.value! },
    { position: current.value, vertical: vertical.value, reduced, onCommit: (value) => { internal.value = value; model.value = value; } },
  );
});
onBeforeUnmount(() => compare?.destroy());
watch(current, (value) => compare?.setPosition(value));
watch(vertical, (value) => compare?.setOrientation(value));
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, class: undefined, style: undefined }" :class="cn('mc-image-compare__root', [attrs.class as string | undefined, classNames?.root].filter(Boolean).join(' '))" :data-orientation="orientation" data-frame-keep="" :style="[{ aspectRatio }, attrs.style as never]">
    <div class="mc-image-compare__layer"><slot name="after" /></div>
    <div ref="beforeLayer" :class="cn('mc-image-compare__layer', classNames?.layer)"><slot name="before" /></div>
    <template v-if="labels">
      <span ref="beforeChip" :class="cn('mc-image-compare__chip', classNames?.chip)" aria-hidden="true">{{ labels[0] }}</span>
      <span ref="afterChip" :class="cn('mc-image-compare__chip', classNames?.chip)" data-place="end" aria-hidden="true">{{ labels[1] }}</span>
      <span ref="afterBottom" :class="cn('mc-image-compare__chip', classNames?.chip)" data-place="bottom" aria-hidden="true">{{ labels[1] }}</span>
    </template>
    <div ref="pivot" :class="cn('mc-image-compare__pivot', classNames?.pivot)">
      <span ref="rotor" :class="cn('mc-image-compare__rotor', classNames?.rotor)"><span class="mc-image-compare__line" /></span>
      <span ref="handleSlot" :class="cn('mc-image-compare__handleSlot', classNames?.handleSlot)">
        <div ref="handle" data-handle="" :class="cn('mc-image-compare__handle', classNames?.handle)" role="slider" tabindex="0" :aria-label="label" :aria-orientation="orientation" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="afterShare" :aria-valuetext="`${afterShare}% after`">
          <span ref="chevrons" :class="cn('mc-image-compare__chevrons', classNames?.chevrons)" aria-hidden="true">
            <span ref="left" :class="cn('mc-image-compare__chevron', classNames?.chevron)"><ChevronLeft :size="16" :stroke-width="1.75" /></span>
            <span ref="right" :class="cn('mc-image-compare__chevron', classNames?.chevron)"><ChevronRight :size="16" :stroke-width="1.75" /></span>
          </span>
        </div>
      </span>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame is a size container, so the divider's line can span any angle with container units. Vertical pans still scroll the page on touch. */
.mc-image-compare__root { position: relative; display: block; width: 100%; overflow: clip; container-type: size; isolation: isolate; border-radius: var(--radius-panel); background: var(--surface-muted); cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-image-compare__root[data-orientation="vertical"] { cursor: ns-resize; touch-action: pan-x; }
/* A hairline keeps light photos from bleeding into the page. */
.mc-image-compare__root::after { content: ""; position: absolute; z-index: 3; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent); pointer-events: none; }
.mc-image-compare__layer { position: absolute; inset: 0; }
.mc-image-compare__layer :where(img, picture, video) { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; -webkit-user-drag: none; }
/* Captions sit on a frosted chip so they read over any photo, below the divider. */
.mc-image-compare__chip { position: absolute; z-index: 1; top: var(--space-3); left: var(--space-3); padding: 3px 10px; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--background) 74%, transparent); color: var(--foreground); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); pointer-events: none; -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4); }
.mc-image-compare__chip[data-place="end"] { right: var(--space-3); left: auto; }
.mc-image-compare__chip[data-place="bottom"] { top: auto; bottom: var(--space-3); }
/* The pivot is a frame-sized layer moved by a percentage of itself; its top-left corner is the divider's center. */
.mc-image-compare__pivot { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.mc-image-compare__rotor { position: absolute; top: 0; left: 0; width: 0; height: 0; }
.mc-image-compare__line { position: absolute; top: calc((100cqw + 100cqh) * -1); left: -1px; width: 2px; height: calc((100cqw + 100cqh) * 2); background: var(--surface-raised); box-shadow: 0 0 0 .5px oklch(0% 0 0 / .14); }
/* The line sits on photography, not on the theme, so it stays light in dark mode too. */
:root[data-theme="dark"] .mc-image-compare__line { background: var(--foreground); }
.mc-image-compare__handleSlot { position: absolute; top: 0; left: 0; }
/* Centered with the translate property; Motion only animates its width and height, so the shape morphs without scaling the icons. */
.mc-image-compare__handle { position: absolute; top: 0; left: 0; display: grid; box-sizing: border-box; width: 40px; height: 40px; place-items: center; translate: -50% -50%; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-raised); box-shadow: var(--shadow-raised); color: var(--foreground); pointer-events: auto; outline: 0 solid transparent; transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-image-compare__handle::after { content: ""; position: absolute; inset: -8px; border-radius: inherit; }
@media (hover: hover) and (pointer: fine) { .mc-image-compare__root:hover .mc-image-compare__handle { border-color: var(--border-strong); } }
.mc-image-compare__chevrons { display: flex; align-items: center; }
.mc-image-compare__chevron { display: grid; margin-inline: -2.5px; place-items: center; }
@media (prefers-reduced-motion: reduce) { .mc-image-compare__handle { transition: none; } }
</style>
