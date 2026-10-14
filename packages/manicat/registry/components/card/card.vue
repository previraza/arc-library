<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { animate } from "motion";
import { computed, onBeforeUnmount, ref, useAttrs, useSlots } from "vue";
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from "reka-ui";
import { X } from "lucide-vue-next";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  title: string;
  description?: string;
  /** A short status under the meta, such as "Updated 2 hours ago". Changed words rise in and are announced politely. */
  status?: string;
  defaultOpen?: boolean;
  /** Extend the inner, named parts of the card: card, footer, byline, avatar, meta, action, media, zoom, content, title, description, panel, closeSlot, close or details. */
  classNames?: { card?: string; footer?: string; byline?: string; avatar?: string; meta?: string; action?: string; media?: string; zoom?: string; content?: string; title?: string; description?: string; panel?: string; close?: string; closeSlot?: string; details?: string };
}>();

/** `v-model:open` binds the quick look, which exists when the `details` slot is filled. */
const openModel = defineModel<boolean | undefined>("open");
const slots = useSlots();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur, ease, spring, stagger } = motionTokens;
const grow = { ...spring.smooth, visualDuration: 0.3 };
const settle = { ...spring.smooth, visualDuration: 0.26 };
/** The photo drifts in slowly while the card is pointed at, and eases back a little faster. */
const ZOOM = 1.04;
const internal = ref(props.defaultOpen ?? false);
const hovered = ref(false);
const card = ref<HTMLElement>();
const zoom = ref<HTMLElement>();
const hasDetails = computed(() => Boolean(slots.details));
const open = computed(() => (hasDetails.value ? (openModel.value ?? internal.value) : false));
const hidden = ref(false);
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

function setOpen(next: boolean) {
  internal.value = next;
  openModel.value = next;
}

function hover(on: boolean) {
  hovered.value = on;
  if (reduced) return;
  if (card.value) animate(card.value, { y: on ? -2 : 0 } as never, motionTokens.spring.snappy as never);
  if (zoom.value) animate(zoom.value, { scale: on ? ZOOM : 1 } as never, { duration: on ? duration.considered * 2 : duration.considered, ease: [...ease.standard] } as never);
}

// The quick look grows out of the card's box: the surface travels on one critically damped spring, and the details settle in beneath it.
const radiusOf = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
let origin: DOMRect | undefined;
function enterPanel(el: Element, done: () => void) {
  const node = el as HTMLElement;
  const from = origin ?? card.value?.getBoundingClientRect();
  hidden.value = true;
  if (reduced || !from) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  const target = node.getBoundingClientRect();
  const radius = radiusOf(node);
  const cardRadius = card.value ? radiusOf(card.value) : radius;
  node.style.setProperty("--card-measure", `${card.value?.querySelector("p")?.getBoundingClientRect().width ?? 0}px`);
  Object.assign(node.style, { inset: "auto", margin: "0", maxHeight: "none", overflow: "hidden", top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: `${cardRadius}px` });
  animate(node, { top: [from.top, target.top], left: [from.left, target.left], width: [from.width, target.width], height: [from.height, target.height], borderRadius: [cardRadius, radius] } as never, grow as never).finished.then(() => {
    for (const key of ["inset", "margin", "maxHeight", "overflow", "top", "left", "width", "height", "borderRadius"]) node.style.removeProperty(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`));
    done();
  });
  const details = node.querySelector<HTMLElement>("[data-details]");
  if (details) playPose(details, { opacity: 0, y: 6 }, { opacity: 1, y: 0 }, { duration: duration.standard, ease: "enter", delay: duration.instant });
  const closeSlot = node.querySelector<HTMLElement>("[data-close-slot]");
  if (closeSlot) playPose(closeSlot, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, { duration: duration.fast, ease: "enter", delay: duration.instant });
}
function leavePanel(el: Element, done: () => void) {
  const node = el as HTMLElement;
  const to = card.value?.getBoundingClientRect();
  const finish = () => {
    hidden.value = false;
    done();
  };
  if (reduced || !to) return void playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant }).finished.then(finish);
  const from = node.getBoundingClientRect();
  const radius = radiusOf(node);
  const cardRadius = card.value ? radiusOf(card.value) : radius;
  Object.assign(node.style, { inset: "auto", margin: "0", maxHeight: "none", overflow: "hidden", top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px` });
  node.dataset.returning = "";
  animate(node, { top: [from.top, to.top], left: [from.left, to.left], width: [from.width, to.width], height: [from.height, to.height], borderRadius: [radius, cardRadius] } as never, settle as never).finished.then(finish);
}
function enterOverlay(el: Element, done: () => void) {
  playPose(el, { opacity: 0 }, { opacity: 1 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveOverlay(el: Element, done: () => void) {
  playPose(el, { opacity: 1 }, { opacity: 0 }, reduced ? { duration: duration.instant } : { duration: duration.exit, ease: "standard" }).finished.then(done);
}

// A new status replaces the whole line: the old one lifts away quickly while the new words rise in one after another.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterStatus(el: Element, done: () => void) {
  if (reduced) return done();
  el.querySelectorAll<HTMLElement>("[data-word]").forEach((word) => {
    const order = Number(word.dataset.word);
    word.style.opacity = "0";
    playPose(word, { opacity: 0, y: em(word, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter", delay: order * stagger.word });
  });
  done();
}
function leaveStatus(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return done();
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
onBeforeUnmount(() => (origin = undefined));
function remember() {
  origin = card.value?.getBoundingClientRect();
}
</script>

<template>
  <DialogRoot :open="open" @update:open="setOpen">
    <article ref="card" v-bind="{ ...attrs, class: undefined }" :class="cn('mc-card__card', attrs.class as string | undefined, classNames?.card)" :data-hover="hovered || undefined" :style="[attrs.style as never, hidden ? { visibility: 'hidden' } : undefined]" @pointerenter="hover(true)" @pointerleave="hover(false)">
      <div v-if="slots.media" :class="cn('mc-card__media', classNames?.media)"><div ref="zoom" :class="cn('mc-card__zoom', classNames?.zoom)"><slot name="media" /></div></div>
      <div :class="cn('mc-card__content', classNames?.content)">
        <h3 :class="cn('mc-card__title', classNames?.title)">
          <DialogTrigger v-if="hasDetails" as-child><button type="button" class="mc-card__trigger" @click="remember">{{ title }}</button></DialogTrigger>
          <template v-else>{{ title }}</template>
        </h3>
        <p v-if="description" :class="cn('mc-card__description', classNames?.description)">{{ description }}</p>
        <slot />
        <div v-if="slots.avatar || slots.meta || status || slots.action" :class="cn('mc-card__footer', classNames?.footer)">
          <div v-if="slots.avatar || slots.meta || status" :class="cn('mc-card__byline', classNames?.byline)">
            <span v-if="slots.avatar" :class="cn('mc-card__avatar', classNames?.avatar)"><slot name="avatar" /></span>
            <span class="mc-card__bylineText">
              <span v-if="slots.meta" :class="cn('mc-card__meta', classNames?.meta)"><slot name="meta" /></span>
              <span v-if="status" class="mc-card__status" role="status">
                <span class="mc-card__srOnly">{{ status }}</span>
                <span class="mc-card__roll" aria-hidden="true"><Transition :css="false" @enter="enterStatus" @leave="leaveStatus"><span :key="status" class="mc-card__line"><span v-for="(part, index) in status.split(/(\s+)/)" :key="index" class="mc-card__word" :data-word="index / 2">{{ part }}</span></span></Transition></span>
              </span>
            </span>
          </div>
          <div v-if="slots.action" :class="cn('mc-card__action', classNames?.action)"><slot name="action" /></div>
        </div>
      </div>
    </article>
    <DialogPortal v-if="hasDetails" force-mount>
      <Transition :css="false" @enter="enterOverlay" @leave="leaveOverlay"><DialogOverlay v-if="open" key="overlay" class="mc-card__overlay" /></Transition>
      <Transition :css="false" @enter="enterPanel" @leave="leavePanel">
        <DialogContent v-if="open" key="panel" force-mount :class="cn('mc-card__panel', classNames?.panel)" :aria-describedby="description ? undefined : undefined">
          <div v-if="slots.media" :class="cn('mc-card__media', classNames?.media)"><div :class="cn('mc-card__zoom', classNames?.zoom)"><slot name="media" /></div></div>
          <span data-close-slot :class="cn('mc-card__closeSlot', classNames?.closeSlot)"><DialogClose as-child><button type="button" :class="cn('mc-card__close', classNames?.close)" aria-label="Close quick look"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></button></DialogClose></span>
          <div :class="cn('mc-card__content', classNames?.content)">
            <DialogTitle as-child><h2 class="mc-card__title">{{ title }}</h2></DialogTitle>
            <DialogDescription v-if="description" as-child><p class="mc-card__description">{{ description }}</p></DialogDescription>
            <slot />
            <div v-if="slots.avatar || slots.meta || status || slots.action" :class="cn('mc-card__footer', classNames?.footer)">
              <div v-if="slots.avatar || slots.meta || status" :class="cn('mc-card__byline', classNames?.byline)">
                <span v-if="slots.avatar" :class="cn('mc-card__avatar', classNames?.avatar)"><slot name="avatar" /></span>
                <span class="mc-card__bylineText"><span v-if="slots.meta" :class="cn('mc-card__meta', classNames?.meta)"><slot name="meta" /></span><span v-if="status" class="mc-card__status"><span class="mc-card__roll">{{ status }}</span></span></span>
              </div>
              <div v-if="slots.action" :class="cn('mc-card__action', classNames?.action)"><slot name="action" /></div>
            </div>
            <div data-details :class="cn('mc-card__details', classNames?.details)"><slot name="details" /></div>
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Isolation keeps the rounded clip on the media while the card lifts on its own layer (Safari drops it otherwise).
   Motion drives the lift and the quick look morph, so transform never gets a CSS transition here. */
.mc-card__card { position: relative; min-width: 0; overflow: hidden; isolation: isolate; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
/* A pointed-at card floats a little, so the shadow arrives with the lift. Touch and pen never lift. */
.mc-card__card[data-hover] { border-color: var(--border-strong); box-shadow: var(--shadow-raised); }
.mc-card__card:has(.mc-card__trigger:focus-visible) { border-color: var(--border-strong); }
.mc-card__media { position: relative; overflow: hidden; background: var(--surface-muted); }
.mc-card__zoom { display: grid; min-height: 112px; place-items: center; }
.mc-card__content { padding: var(--space-5); }
/* Fit-content width keeps the title's box the shape of its text, so it scales evenly when it grows into the quick look. */
.mc-card__title { width: fit-content; max-width: 100%; margin: 0; font-size: var(--text-lg); font-weight: 500; letter-spacing: var(--tracking-body); line-height: 1.3; text-wrap: balance; }
.mc-card__trigger { padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* The title's hit area stretches over the whole card, so pointing anywhere opens the quick look while the action stays on top. */
.mc-card__trigger::after { content: ""; position: absolute; inset: 0; }
.mc-card__trigger:focus-visible { outline: none; }
.mc-card__description { max-width: 34ch; margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); text-wrap: pretty; }
.mc-card__footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-5); }
.mc-card__byline { display: flex; flex: 1 1 auto; align-items: center; gap: var(--space-3); min-width: 0; }
.mc-card__avatar { display: grid; flex: none; width: var(--space-8); height: var(--space-8); overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-card__avatar > * { width: 100%; height: 100%; object-fit: cover; }
/* A shrinkable column, so a narrow footer truncates the byline instead of sliding it under the action. */
.mc-card__bylineText { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-card__meta { overflow: hidden; color: var(--foreground); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.mc-card__status { position: relative; overflow: clip visible; color: var(--text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* The line clips sideways only, so a status too long for its column ends in an ellipsis while its words still rise in unclipped. */
.mc-card__roll { position: relative; display: block; }
.mc-card__line { display: block; overflow: clip visible; text-overflow: ellipsis; }
.mc-card__word { display: inline-block; white-space: pre; }
.mc-card__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-card__action { position: relative; z-index: 1; display: flex; flex: none; flex-wrap: wrap; gap: var(--space-3); }

.mc-card__overlay { position: fixed; inset: 0; z-index: 50; background: oklch(10% 0 0 / .46); backdrop-filter: blur(7px); }
/* Centered with auto margins, so transform stays free for the morph. */
.mc-card__panel { position: fixed; inset: 0; z-index: 51; width: min(calc(100vw - var(--space-8)), 30rem); height: fit-content; max-height: calc(100dvh - var(--space-8)); margin: auto; overflow: hidden auto; overscroll-behavior: contain; border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); transition: background-color var(--duration-standard) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
.mc-card__panel:focus { outline: none; }
/* Closing: the panel takes the card's box and look, so it lands exactly where the card sits and hands back without a seam. */
.mc-card__panel[data-returning] { inset: auto; top: var(--landing-top); left: var(--landing-left); width: var(--landing-width); height: var(--landing-height); max-height: none; margin: 0; overflow: hidden; border-color: var(--border); background: var(--surface); box-shadow: none; pointer-events: none; }
.mc-card__panel[data-returning] .mc-card__content { padding: var(--space-5); }
.mc-card__panel[data-returning] .mc-card__title { font-size: var(--text-lg); }
.mc-card__panel .mc-card__content { padding: var(--space-6); }
.mc-card__panel .mc-card__title { font-size: var(--text-xl); }
.mc-card__panel .mc-card__description { max-width: var(--card-measure, 34ch); }
/* The slot carries the entrance, so the button's own press answers instantly. */
.mc-card__closeSlot { position: absolute; top: var(--space-4); right: var(--space-4); z-index: 2; display: grid; }
.mc-card__close { display: grid; width: var(--space-8); height: var(--space-8); place-items: center; padding: 0; border: 1px solid color-mix(in oklab, var(--border) 70%, transparent); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--surface-raised) 74%, transparent); backdrop-filter: blur(12px); color: var(--foreground); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-card__close:hover { background: var(--surface-raised); } }
.mc-card__details { margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--border); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }

@media (prefers-reduced-motion: reduce) {
  .mc-card__card, .mc-card__close { transition-duration: var(--duration-instant); }
}
</style>
