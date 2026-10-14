<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { Comment, Fragment, computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from "vue";
import type { VNode } from "vue";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-vue-next";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";
import { clamp, createCarousel, defaultSlideLabel } from "@/lib/carousel";

defineOptions({ inheritAttrs: false });

/**
 * A row of slides people browse by dragging, flicking, a trackpad swipe, the arrow keys, or the controls below it. Use it for a short,
 * ordered set of peers such as products or case studies, where the neighbours stay in view as a hint that there is more.
 */
const props = withDefaults(
  defineProps<{
    /** Names the carousel for assistive technology, for example "From the Harbour suites". */
    label: string;
    defaultIndex?: number;
    /** Width of one slide as a CSS length. Use `cqw` for a share of the carousel width. */
    slideSize?: string;
    /** Names each slide and its indicator. Defaults to "2 of 5". */
    slideLabel?: (index: number, count: number) => string;
    /** Milliseconds per slide. Adds a play control that rotates through the slides; rotation pauses on hover, keyboard focus, and drag, and is unavailable with reduced motion. */
    interval?: number;
    /** Starts rotating on mount. Off by default, so motion begins with the viewer. */
    autoplay?: boolean;
    /** Extend the inner, named parts of the carousel: root, viewport, track, controls, control, icon, tabs or arrows. */
    classNames?: { root?: string; viewport?: string; track?: string; controls?: string; control?: string; icon?: string; tabs?: string; arrows?: string };
  }>(),
  { defaultIndex: 0, slideSize: "min(80cqw, 340px)", slideLabel: defaultSlideLabel, autoplay: false },
);

/** `v-model` binds the active slide. Give each slide its own element in the default slot. */
const model = defineModel<number | undefined>({ default: undefined });
const slots = useSlots();
const attrs = useAttrs();
const id = useId();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

const flatten = (nodes: VNode[]): VNode[] => nodes.flatMap((node) => (node.type === Fragment && Array.isArray(node.children) ? flatten(node.children as VNode[]) : node.type === Comment ? [] : [node]));
const slides = computed(() => flatten(slots.default?.() ?? []));
const count = computed(() => slides.value.length);
const last = computed(() => Math.max(0, count.value - 1));
const own = ref(clamp(props.defaultIndex, 0, Math.max(0, slides.value.length - 1)));
const index = computed(() => clamp(model.value ?? own.value, 0, last.value));
const startIndex = index.value;
const playing = ref(props.autoplay);
const dragging = ref(false);
const announcement = ref("");
const canRotate = computed(() => Boolean(props.interval) && count.value > 1 && !reduced);

const root = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const track = ref<HTMLElement>();
let carousel: ReturnType<typeof createCarousel> | undefined;

onMounted(() => {
  carousel = createCarousel({ root: root.value!, viewport: viewport.value!, track: track.value! }, {
    reduced,
    count: () => count.value,
    index: () => index.value,
    interval: () => props.interval,
    canRotate: () => canRotate.value,
    autoplay: props.autoplay,
    change: (next) => { own.value = next; model.value = next; },
    announce: (text) => (announcement.value = text),
    label: (at) => props.slideLabel(at, count.value),
    onPlaying: (value) => (playing.value = value),
    onDragging: (value) => (dragging.value = value),
  });
});
onBeforeUnmount(() => carousel?.destroy());
watch([index, count, () => props.interval, canRotate, slides], () => carousel?.sync(), { flush: "post" });

// The play control's icon scales and blurs in on a spring and out a little faster.
const { blur, duration } = motionTokens;
const iconIn = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle };
const iconRest = { opacity: 1, scale: 1, blur: 0 };
const enterIcon = (el: Element, done: () => void) => playPose(el, iconIn, iconRest, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast }).finished.then(done);
const leaveIcon = (el: Element, done: () => void) => playPose(el, iconRest, iconIn, { duration: reduced ? duration.instant : duration.fast, ease: "standard" }).finished.then(done);
</script>

<template>
  <section ref="root" v-bind="{ ...attrs, class: undefined }" :class="cn('mc-carousel__root', attrs.class as string | undefined, classNames?.root)" :style="{ '--carousel-slide': slideSize, '--carousel-start': startIndex }" aria-roledescription="carousel" :aria-label="label">
    <div ref="viewport" :class="cn('mc-carousel__viewport', classNames?.viewport)" role="group" aria-label="Slides" tabindex="0" :data-dragging="dragging || undefined">
      <div ref="track" :class="cn('mc-carousel__track', classNames?.track)">
        <div v-for="(slide, i) in slides" :id="`${id}-slide-${i}`" :key="slide.key ?? i" class="mc-carousel__slide" role="tabpanel" aria-roledescription="slide" :aria-label="slideLabel(i, count)" :inert="i !== index ? '' : undefined"><component :is="slide" /></div>
      </div>
    </div>
    <div v-if="count > 1" :class="cn('mc-carousel__controls', classNames?.controls)">
      <button v-if="canRotate" data-play type="button" :class="cn('mc-carousel__control', classNames?.control)" :aria-label="playing ? 'Pause slide rotation' : 'Start slide rotation'" @click="carousel?.toggleRotation()">
        <span class="mc-carousel__iconSlot">
          <Transition :css="false" @enter="enterIcon" @leave="leaveIcon">
            <span :key="playing ? 'pause' : 'play'" :class="cn('mc-carousel__icon', classNames?.icon)">
              <Pause v-if="playing" :size="15" :stroke-width="1.75" fill="currentColor" aria-hidden="true" />
              <Play v-else :size="15" :stroke-width="1.75" fill="currentColor" aria-hidden="true" />
            </span>
          </Transition>
        </span>
      </button>
      <div :class="cn('mc-carousel__tabs', classNames?.tabs)" role="tablist" aria-label="Choose a slide">
        <button v-for="(_, i) in slides" :key="i" type="button" role="tab" class="mc-carousel__tab" :aria-selected="i === index" :aria-controls="`${id}-slide-${i}`" :aria-label="slideLabel(i, count)" :tabindex="i === index ? 0 : -1" @click="carousel?.select(i)">
          <span class="mc-carousel__dot" aria-hidden="true"><span class="mc-carousel__dotFill" /><span class="mc-carousel__dotDrain" /></span>
        </button>
      </div>
      <div :class="cn('mc-carousel__arrows', classNames?.arrows)">
        <button type="button" :class="cn('mc-carousel__control', classNames?.control)" aria-label="Previous slide" :aria-disabled="index === 0" @click="() => { if (carousel && carousel.target() > 0) carousel.select(carousel.target() - 1); }"><ChevronLeft :size="18" :stroke-width="1.75" aria-hidden="true" /></button>
        <button type="button" :class="cn('mc-carousel__control', classNames?.control)" aria-label="Next slide" :aria-disabled="index === last" @click="() => { if (carousel && carousel.target() < last) carousel.select(carousel.target() + 1); }"><ChevronRight :size="18" :stroke-width="1.75" aria-hidden="true" /></button>
      </div>
    </div>
    <span class="mc-carousel__visuallyHidden" aria-live="polite" aria-atomic="true">{{ announcement }}</span>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The root is the size container, so slide widths, centering padding, and the control row all share one measure. It needs a definite width. */
.mc-carousel__root { --carousel-gap: var(--space-4); display: grid; width: 100%; grid-template-columns: minmax(0, 1fr); min-width: 0; gap: var(--space-4); container-type: inline-size; }
/* Only the horizontal axis clips, so focus rings inside the active slide are never cut off at the top or bottom. */
.mc-carousel__viewport { position: relative; min-width: 0; overflow-x: clip; overflow-y: visible; border-radius: var(--radius-panel); cursor: grab; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
.mc-carousel__viewport[data-dragging] { cursor: grabbing; }
.mc-carousel__viewport:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 4px; }
/* Side padding centers the first and last slides; before hydration the start slide is placed with CSS so nothing moves on first paint. */
.mc-carousel__track { display: flex; gap: var(--carousel-gap); padding-inline: calc((100cqw - var(--carousel-slide)) / 2); user-select: none; -webkit-user-select: none; }
.mc-carousel__track:not([data-measured]) { translate: calc(var(--carousel-start) * -1 * (var(--carousel-slide) + var(--carousel-gap))) 0; }
.mc-carousel__slide { flex: 0 0 var(--carousel-slide); min-width: 0; transform-origin: 50% 50%; will-change: transform, opacity; }
.mc-carousel__slide img { -webkit-user-drag: none; }

/* Controls line up with the edges of the centered slide. */
.mc-carousel__controls { display: flex; min-width: 0; align-items: center; gap: var(--space-2); padding-inline: calc((100cqw - var(--carousel-slide)) / 2); }
.mc-carousel__tabs { display: flex; min-width: 0; align-items: center; }
.mc-carousel__tab { display: grid; height: var(--control-height-sm); flex: none; place-items: center; border: 0; border-radius: var(--radius-pill); padding: 0 5px; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* Resting dots use the strong border color; the fill fades in as the pill forms, and the drain covers it from the right while rotation runs. */
.mc-carousel__dot { position: relative; display: block; width: 6px; height: 6px; overflow: hidden; border-radius: var(--radius-pill); background: var(--border-strong); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-carousel__dotFill, .mc-carousel__dotDrain { position: absolute; inset: 0; }
.mc-carousel__dotFill { background: var(--foreground); }
.mc-carousel__dotDrain { background: var(--border-strong); transform-origin: 100% 50%; }
@media (hover: hover) and (pointer: fine) { .mc-carousel__tab:hover .mc-carousel__dot { background: var(--text-muted); } }
.mc-carousel__tab:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -4px; }

.mc-carousel__arrows { display: flex; flex: none; gap: var(--space-2); margin-left: auto; }
.mc-carousel__control { display: grid; width: var(--control-height-sm); height: var(--control-height-sm); flex: none; place-items: center; border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 0; background: var(--surface); color: var(--foreground); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-carousel__control:hover:not([aria-disabled="true"]) { background: var(--surface-muted); } }
.mc-carousel__control:active:not([aria-disabled="true"]) { transform: scale(.97); transition: transform 100ms var(--ease-standard); }
.mc-carousel__control[aria-disabled="true"] { color: var(--text-muted); cursor: default; opacity: .5; }
.mc-carousel__control:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-carousel__iconSlot { display: grid; width: 16px; height: 16px; place-items: center; }
.mc-carousel__icon { grid-area: 1 / 1; display: grid; place-items: center; }
/* On phone widths the row tightens so play, indicators, and arrows still fit beside a narrow slide. */
@container (max-width: 340px) {
  .mc-carousel__controls { gap: var(--space-1); padding-inline: max(0px, calc((100cqw - var(--carousel-slide)) / 2 - var(--space-2))); }
  .mc-carousel__arrows { gap: var(--space-1); }
  .mc-carousel__tab { padding: 0 4px; }
}
.mc-carousel__visuallyHidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .mc-carousel__dot, .mc-carousel__control, .mc-carousel__control:active:not([aria-disabled="true"]) { transition: none; transform: none; }
}
</style>
