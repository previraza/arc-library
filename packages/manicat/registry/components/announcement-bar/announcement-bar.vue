<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate, motionValue } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { ArrowRight, ChevronDown, ChevronUp, Pause, Play, X } from "lucide-vue-next";
import AnnouncementBarCountdown from "@/registry/components/announcement-bar/announcement-bar-countdown.vue";
import { physical, storageKey } from "@/lib/announcement-bar";
import { animateSize, playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface AnnouncementAction {
  label: string;
  href?: string;
  onClick?: () => void;
}
export interface Announcement {
  /** Stable id, reported to callbacks. */
  id: string;
  message: string;
  action?: AnnouncementAction;
  /** Counts down to a moment, for example the end of a sale. */
  countdown?: { to: Date | string | number; label?: string };
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    messages: Announcement[];
    /** Remembers dismissal under this id. Change the id to show a new campaign to everyone again. */
    id?: string;
    defaultOpen?: boolean;
    defaultIndex?: number;
    /** Milliseconds each message stays before the next one. Defaults to 6000. */
    interval?: number;
    /** Rotate automatically. Pauses on hover, focus, or a hidden tab, and is turned off when the visitor prefers reduced motion. Defaults to true. */
    autoPlay?: boolean;
    /** Show previous, next, and pause controls when there are several messages. Defaults to false: only the close button shows. */
    controls?: boolean;
    dismissible?: boolean;
    tone?: "neutral" | "inverted";
    /** Accessible name of the region. */
    label?: string;
    /** Extend the inner, named parts of the announcement bar: bar, viewport, face, message, text, cta, countdown, countdownLabel, time, unit, unitMark, sep, digit, digitFace, controls, icon, ring, ringTrack, ringFill or ringIcon. */
    classNames?: Record<string, string | undefined>;
  }>(),
  { defaultOpen: true, defaultIndex: 0, interval: 6000, autoPlay: true, controls: false, dismissible: true, tone: "neutral", label: "Announcements" },
);

/** `v-model:open` binds whether the bar is shown; `v-model:index` binds the visible message. */
const openModel = defineModel<boolean | undefined>("open");
const indexModel = defineModel<number | undefined>("index");
const emit = defineEmits<{ action: [announcement: Announcement]; countdownEnd: [announcement: Announcement] }>();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const enterEase = [...motionTokens.ease.enter] as [number, number, number, number];
const standard = [...motionTokens.ease.standard] as [number, number, number, number];
const RISE = physical(0.46, 0.1);
const HEIGHT = physical(0.42, 0);
const COLLAPSE = physical(0.44, 0);
const RING = 2 * Math.PI * 8;
const uid = useId();
const total = computed(() => props.messages.length);
const cn = (base: string, key: string, extra?: string) => [base, props.classNames?.[key], extra].filter(Boolean).join(" ");

// Open state: controlled, or internal and hidden at once when this id was dismissed before.
const openInternal = ref(props.defaultOpen);
const remembered = ref(false);
onMounted(() => {
  if (!props.id || openModel.value !== undefined) return;
  let stored = false;
  try { stored = window.localStorage.getItem(storageKey(props.id)) === "dismissed"; } catch { /* Storage can be blocked. */ }
  if (stored) remembered.value = true;
});
const open = computed(() => openModel.value ?? (openInternal.value && !remembered.value));
function dismiss() {
  if (props.id) { try { window.localStorage.setItem(storageKey(props.id), "dismissed"); } catch { /* Storage can be blocked. */ } }
  openInternal.value = false;
  openModel.value = false;
}

// Rotation.
const indexInternal = ref(props.defaultIndex);
const current = computed(() => (total.value ? (((indexModel.value ?? indexInternal.value) % total.value) + total.value) % total.value : 0));
const direction = ref(1);
function go(step: number) {
  if (total.value < 2) return;
  const next = (((current.value + step) % total.value) + total.value) % total.value;
  direction.value = step > 0 ? 1 : -1;
  indexInternal.value = next;
  indexModel.value = next;
}
const userPaused = ref(false);
const hovered = ref(false);
const focused = ref(false);
const hidden = ref(false);
const onVisibility = () => (hidden.value = document.visibilityState === "hidden");
onMounted(() => document.addEventListener("visibilitychange", onVisibility));
const rotating = computed(() => props.autoPlay && !reduced && total.value > 1);
const running = computed(() => rotating.value && open.value && !userPaused.value && !hovered.value && !focused.value && !hidden.value);

// The ring is the clock: its progress runs to one, then advances. Pausing stops it where it is; resuming finishes the rest.
const progress = motionValue(0);
const ring = ref<SVGCircleElement>();
progress.on("change", (value) => ring.value && (ring.value.style.strokeDashoffset = String(RING * (1 - value))));
let run: AnimationPlaybackControls | null = null;
watch(current, () => progress.jump(0), { flush: "sync" });
watch([running, current, () => props.interval], () => {
  run?.stop();
  run = null;
  if (!running.value) return;
  const control = animate(progress as never, 1, { duration: (props.interval / 1000) * (1 - progress.get()), ease: "linear", onComplete: () => { run = null; go(1); } } as never);
  run = control;
}, { flush: "post", immediate: true });
onBeforeUnmount(() => {
  run?.stop();
  document.removeEventListener("visibilitychange", onVisibility);
});

// The viewport springs to the height of the current message, which can wrap on narrow screens.
const viewport = ref<HTMLElement>();
const heightValue = motionValue<number | "auto">("auto");
heightValue.on("change", (value) => viewport.value && (viewport.value.style.height = typeof value === "number" ? `${value}px` : value));
let measured = 0;
function onSize(next: number) {
  if (Math.abs(next - measured) < 0.5) return;
  const first = measured === 0;
  measured = next;
  if (first || reduced) heightValue.jump(next);
  else animate(heightValue as never, next, HEIGHT as never);
}
const observers = new WeakMap<Element, ResizeObserver>();
function watchFace(el: unknown) {
  if (!(el instanceof HTMLElement) || observers.has(el)) return;
  const report = () => { if (el.dataset.leaving === undefined) onSize(el.offsetHeight); };
  report();
  const observer = new ResizeObserver(report);
  observer.observe(el);
  observers.set(el, observer);
}

const announcement = computed(() => props.messages[current.value]);
const navigable = computed(() => props.controls && total.value > 1);
const controlCount = computed(() => (navigable.value ? 2 + (rotating.value ? 1 : 0) : 0) + (props.dismissible ? 1 : 0));

// Next rises from below and leaves upward; previous runs the other way.
function enterFace(el: Element, done: () => void) {
  watchFace(el);
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.standard, ease: "standard" }).finished.then(done);
  animate(el, { y: [`${direction.value * 70}%`, "0%"] } as never, RISE as never);
  animate(el, { opacity: [0, 1], filter: [`blur(${blur.soft}px)`, "blur(0px)"] } as never, { opacity: { duration: duration.standard, ease: enterEase }, filter: { duration: duration.standard, ease: enterEase } } as never).finished.then(done);
}
function leaveFace(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.dataset.leaving = "";
  node.setAttribute("inert", "");
  observers.get(node)?.disconnect();
  if (reduced) return void animate(node, { opacity: 0 }, { duration: duration.instant, ease: standard }).finished.then(done);
  animate(node, { y: `${direction.value * -60}%` } as never, RISE as never);
  animate(node, { opacity: 0, filter: `blur(${blur.soft}px)` } as never, { opacity: { duration: duration.fast, ease: standard }, filter: { duration: duration.fast, ease: standard } } as never).finished.then(done);
}
// Dismissing collapses the height smoothly so the page below eases up.
function leaveBar(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  if (reduced) return void animate(node, { opacity: 0 }, { duration: duration.fast }).finished.then(done);
  animate(node, { opacity: 0 }, { duration: duration.exit, ease: standard });
  animateSize(node, "height", "close", { spring: COLLAPSE }).finished.then(done);
}
</script>

<template>
  <Transition :css="false" @leave="leaveBar">
    <section v-if="open && announcement" v-bind="{ ...attrs, class: undefined }" :class="cn('mc-announcement-bar__collapse', '', attrs.class as string | undefined)" :aria-label="label" :aria-roledescription="total > 1 ? 'carousel' : undefined" @pointerenter="(event) => { if (event.pointerType === 'mouse') hovered = true; }" @pointerleave="hovered = false" @focusin="focused = true" @focusout="(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focused = false; }">
      <div :class="cn('mc-announcement-bar__bar', 'bar')" :data-tone="tone" :style="{ '--controls': controlCount }">
        <div class="mc-announcement-bar__side" aria-hidden="true" />
        <div ref="viewport" :class="cn('mc-announcement-bar__viewport', 'viewport')" :id="`${uid}-slides`" :aria-live="running ? 'off' : 'polite'" aria-atomic="false">
          <Transition :css="false" @enter="enterFace" @leave="leaveFace">
            <div :key="announcement.id" :class="cn('mc-announcement-bar__face', 'face')" :role="total > 1 ? 'group' : undefined" :aria-roledescription="total > 1 ? 'slide' : undefined" :aria-label="total > 1 ? `${current + 1} of ${total}` : undefined">
              <p :class="cn('mc-announcement-bar__message', 'message')">
                <span :class="cn('mc-announcement-bar__text', 'text')">{{ announcement.message }}</span>
                <AnnouncementBarCountdown v-if="announcement.countdown" :to="announcement.countdown.to" :label="announcement.countdown.label" :class-names="classNames" @end="emit('countdownEnd', announcement)" />
                <a v-if="announcement.action?.href" :class="cn('mc-announcement-bar__cta', 'cta')" :href="announcement.action.href" @click="announcement.action.onClick?.(); emit('action', announcement)">{{ announcement.action.label }}<ArrowRight :size="14" :stroke-width="1.75" aria-hidden="true" /></a>
                <button v-else-if="announcement.action" type="button" :class="cn('mc-announcement-bar__cta', 'cta')" @click="announcement.action.onClick?.(); emit('action', announcement)">{{ announcement.action.label }}<ArrowRight :size="14" :stroke-width="1.75" aria-hidden="true" /></button>
              </p>
            </div>
          </Transition>
        </div>
        <div :class="cn('mc-announcement-bar__controls', 'controls')">
          <template v-if="navigable">
            <button type="button" :class="cn('mc-announcement-bar__icon', 'icon')" aria-label="Previous announcement" :aria-controls="`${uid}-slides`" @click="go(-1)"><ChevronUp :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
            <button v-if="rotating" type="button" :class="cn('mc-announcement-bar__ring', 'ring')" :aria-label="userPaused ? 'Resume announcements' : 'Pause announcements'" :aria-pressed="userPaused" @click="userPaused = !userPaused">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="8" :class="cn('mc-announcement-bar__ringTrack', 'ringTrack')" />
                <circle ref="ring" cx="10" cy="10" r="8" :class="cn('mc-announcement-bar__ringFill', 'ringFill')" :stroke-dasharray="RING" :style="{ strokeDashoffset: RING }" />
              </svg>
              <span :class="cn('mc-announcement-bar__ringIcon', 'ringIcon')"><Play v-if="userPaused" :size="9" :stroke-width="2.4" aria-hidden="true" /><Pause v-else :size="9" :stroke-width="2.4" aria-hidden="true" /></span>
            </button>
            <button type="button" :class="cn('mc-announcement-bar__icon', 'icon')" aria-label="Next announcement" :aria-controls="`${uid}-slides`" @click="go(1)"><ChevronDown :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
          </template>
          <button v-if="dismissible" type="button" :class="cn('mc-announcement-bar__icon', 'icon')" aria-label="Dismiss" @click="dismiss"><X :size="16" :stroke-width="1.75" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The outer section animates its height to zero on dismiss, so whatever sits below eases up with it. */
.mc-announcement-bar__collapse { overflow: hidden; container-type: inline-size; font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* The side column mirrors the controls, so the message stays centered on the page rather than in the leftover space. */
.mc-announcement-bar__bar { --icon: 32px; --control-gap: 2px; --muted: var(--text-secondary); display: grid; grid-template-columns: calc(var(--controls, 0) * var(--icon) + max(var(--controls, 0) - 1, 0) * var(--control-gap)) minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: 6px 8px 6px 16px; border-bottom: 1px solid var(--border); background: var(--surface-muted); color: var(--foreground); }
.mc-announcement-bar__bar[data-tone="inverted"] { --muted: color-mix(in oklab, var(--background) 66%, transparent); border-bottom-color: transparent; background: var(--foreground); color: var(--background); }

.mc-announcement-bar__side { min-width: 0; }
.mc-announcement-bar__viewport { position: relative; min-height: 32px; overflow: hidden; }

/* Faces overlap in place; the entering one reports its height and the viewport springs to it. */
.mc-announcement-bar__face { position: absolute; top: 0; right: 0; left: 0; display: flex; min-height: 32px; align-items: center; justify-content: center; }
.mc-announcement-bar__message { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 2px 12px; margin: 0; padding: 6px 0; font-size: var(--text-sm); line-height: var(--leading-body); text-align: center; text-wrap: balance; }
.mc-announcement-bar__text { min-width: 0; }

/* The countdown is one run of text: every cell shares the line box, so digits, colons, and the day mark sit on the message baseline. */
.mc-announcement-bar__countdown { display: inline-flex; align-items: baseline; gap: 6px; color: var(--muted); white-space: nowrap; }
.mc-announcement-bar__countdownLabel { color: inherit; }
.mc-announcement-bar__time { display: inline-flex; align-items: baseline; color: var(--foreground); font-variant-numeric: tabular-nums; font-weight: 500; line-height: inherit; }
.mc-announcement-bar__time[data-pending] { opacity: 0; }
.mc-announcement-bar__bar[data-tone="inverted"] .mc-announcement-bar__time { color: var(--background); }
.mc-announcement-bar__digit { position: relative; display: inline-block; overflow: hidden; overflow: clip; text-align: center; }
.mc-announcement-bar__digitSizer { visibility: hidden; }
.mc-announcement-bar__digitFace { position: absolute; inset: 0; display: block; }
.mc-announcement-bar__unit { display: inline-flex; align-items: baseline; }
.mc-announcement-bar__unitMark { margin-left: 1px; color: var(--muted); font-weight: 400; }
/* "case" lifts the colon to the middle of the figures, which it loses once the digits are split into cells. */
.mc-announcement-bar__sep { display: inline-block; padding-inline: 1px; color: var(--muted); font-feature-settings: "case"; font-weight: 400; }
.mc-announcement-bar__gap { display: inline-block; width: .4em; }

.mc-announcement-bar__cta { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font: inherit; font-weight: 500; text-decoration: none; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
.mc-announcement-bar__cta svg { transition: transform var(--duration-fast) var(--ease-standard); }

.mc-announcement-bar__controls { display: flex; align-items: center; gap: var(--control-gap); }
.mc-announcement-bar__icon, .mc-announcement-bar__ring { position: relative; display: grid; width: var(--icon); height: var(--icon); flex: none; place-items: center; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--muted); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-announcement-bar__icon:active, .mc-announcement-bar__ring:active { background: color-mix(in oklab, currentColor 12%, transparent); color: inherit; }
.mc-announcement-bar__ring svg { width: 20px; height: 20px; overflow: visible; transform: rotate(-90deg); }
.mc-announcement-bar__ringTrack { fill: none; stroke: currentColor; stroke-opacity: .22; stroke-width: 1.75; }
.mc-announcement-bar__ringFill { fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.75; }
.mc-announcement-bar__ringIcon { position: absolute; inset: 0; display: grid; place-items: center; }
.mc-announcement-bar__ringIcon svg { width: 9px; height: 9px; transform: none; fill: currentColor; }
.mc-announcement-bar__bar[data-tone="inverted"] .mc-announcement-bar__icon, .mc-announcement-bar__bar[data-tone="inverted"] .mc-announcement-bar__ring { color: var(--muted); }

@media (hover: hover) and (pointer: fine) {
  .mc-announcement-bar__icon:hover, .mc-announcement-bar__ring:hover { background: color-mix(in oklab, currentColor 10%, transparent); }
  .mc-announcement-bar__bar .mc-announcement-bar__icon:hover, .mc-announcement-bar__bar .mc-announcement-bar__ring:hover { color: var(--foreground); }
  .mc-announcement-bar__bar[data-tone="inverted"] .mc-announcement-bar__icon:hover, .mc-announcement-bar__bar[data-tone="inverted"] .mc-announcement-bar__ring:hover { color: var(--background); }
  .mc-announcement-bar__cta:hover svg { transform: translateX(2px); }
}

/* Narrow bars drop the mirror column and read from the start edge. */
@container (max-width: 560px) {
  .mc-announcement-bar__bar { grid-template-columns: 0 minmax(0, 1fr) auto; gap: 0 var(--space-2); padding-left: 14px; }
  .mc-announcement-bar__face { justify-content: flex-start; }
  .mc-announcement-bar__message { justify-content: flex-start; column-gap: 10px; text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-announcement-bar__icon, .mc-announcement-bar__ring, .mc-announcement-bar__cta svg { transition: none; }
}
</style>
