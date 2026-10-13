<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, getCurrentInstance, onMounted, ref, watch } from "vue";
import StepperText from "@/registry/components/stepper/stepper-text.vue";
import { drawGlyph, moveFill } from "@/lib/stepper";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export type StepperOrientation = "horizontal" | "vertical";
export type StepperStatus = "complete" | "current" | "upcoming" | "error";
export interface StepperStep {
  /** Stable key, so each step keeps its own motion when the list changes. */
  id: string;
  label: string;
  /** A short hint under the label. */
  description?: string;
  /** Marks the step as failed: the marker morphs into an alert and this message replaces the description. */
  error?: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    steps: StepperStep[];
    /** Index of the step in progress. `steps.length` marks the whole flow complete. */
    current: number;
    orientation?: StepperOrientation;
    /** `current` shows only the active step's description, for tight spaces. Errors always show. */
    details?: "all" | "current";
    /** Markers only; labels stay available to assistive tech. Horizontal steppers switch to this below 30rem on their own and show the current step's label underneath. */
    compact?: boolean;
    /** Accessible name for the stepper. */
    label?: string;
    /** Announced, and shown in the compact caption, once every step is complete. */
    completeLabel?: string;
    /** Extend the inner, named parts of the stepper: root, list, item, text, label, srOnly, connector, fill, head, caption, captionLabel. */
    classNames?: { root?: string; list?: string; item?: string; text?: string; label?: string; srOnly?: string; connector?: string; fill?: string; head?: string; caption?: string; captionLabel?: string };
  }>(),
  { orientation: "horizontal", details: "all", compact: false, label: "Progress", completeLabel: "All steps complete" },
);

/** Called with the index of a completed step when it is chosen. Without a listener the stepper is a read-only indicator. */
const emit = defineEmits<{ stepSelect: [index: number] }>();
const interactive = Boolean(getCurrentInstance()?.vnode.props?.onStepSelect);
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration } = motionTokens;
const root = ref<HTMLElement>();

const cn = (base: string, ...extra: (string | undefined | false)[]) => [base, ...extra].filter(Boolean).join(" ");
const count = computed(() => props.steps.length);
const active = computed(() => Math.min(Math.max(Math.round(props.current), 0), count.value));
// Remember where progress came from, so a jump across several steps fills or drains its connectors one after another.
const from = ref(active.value);
watch(active, (_, previous) => (from.value = previous), { flush: "sync" });
const gap = motionTokens.stagger.line;
const delayAt = (index: number) => {
  if (reduced) return 0;
  if (active.value > from.value) return index >= from.value && index < active.value ? (index - from.value) * gap : 0;
  return index >= active.value && index < from.value ? (from.value - 1 - index) * gap : 0;
};
const ringDelay = computed(() => (reduced ? 0 : Math.max(0, Math.abs(active.value - from.value) - 1) * gap + 0.12));
const vertical = computed(() => props.orientation === "vertical");
const done = computed(() => active.value >= count.value);
const now = computed(() => (done.value ? undefined : props.steps[active.value]));
const statusText: Record<StepperStatus, string> = { complete: "Completed", current: "", upcoming: "Not started", error: "Error" };
const statusOf = (step: StepperStep, index: number): StepperStatus => (step.error ? "error" : index < active.value ? "complete" : index === active.value ? "current" : "upcoming");
const kindOf = (step: StepperStep, index: number) => (step.error ? "error" : index < active.value ? "check" : "number");

// The connectors fill along their track on a spring; the first paint lands without motion.
let placed = false;
function syncFills() {
  root.value?.querySelectorAll<HTMLElement>("[data-fill]").forEach((fill) => {
    const index = Number(fill.dataset.fill);
    moveFill(fill, { vertical: vertical.value, on: index < active.value, delay: delayAt(index), reduced, instant: !placed });
  });
  placed = true;
}
onMounted(() => {
  syncFills();
  // The strokes of checks that are already there draw themselves once.
  root.value?.querySelectorAll("svg[data-glyph]").forEach((svg) => drawGlyph(svg, 0, reduced));
});
watch([active, vertical, () => props.steps.length], syncFills, { flush: "post" });
watch(vertical, () => { placed = false; }, { flush: "pre" });

/** Arrow keys move between the steps you can reach; Home and End jump to the first and the current one. */
function onKeydown(event: KeyboardEvent) {
  const list = event.currentTarget as HTMLElement;
  const rtl = !vertical.value && getComputedStyle(list).direction === "rtl";
  const back = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"];
  const ahead = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"];
  if (![...back, ...ahead, "Home", "End"].includes(event.key)) return;
  const targets = Array.from(list.querySelectorAll<HTMLButtonElement>("button[data-reachable]"));
  const at = targets.indexOf(event.target as HTMLButtonElement);
  if (at < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? targets.length - 1 : back.includes(event.key) ? Math.max(0, at - 1) : Math.min(targets.length - 1, at + 1);
  targets[next]?.focus();
}

// The number, check, and alert share one spot: the outgoing glyph shrinks away while the next one pops in and draws its stroke.
const delayOf = (el: Element) => Number((el as HTMLElement).dataset.delay ?? 0);
function enterGlyph(el: Element, done: () => void) {
  if (reduced) return done();
  const delay = delayOf(el);
  playPose(el, { opacity: 0, scale: 0.5, blur: motionTokens.blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { spring: "snappy", fade: duration.fast, delay, fadeDelay: delay }).finished.then(done);
  if (el instanceof SVGElement) drawGlyph(el, delay, reduced);
}
function leaveGlyph(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.5, blur: motionTokens.blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
// The ring grows out from behind the disc once progress arrives, so the eye lands on the new step after the connector fills.
function enterRing(el: Element, done: () => void) {
  if (reduced) return done();
  const delay = ringDelay.value;
  playPose(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, { spring: "snappy", fade: duration.fast, delay, fadeDelay: delay }).finished.then(done);
}
function leaveRing(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <component :is="interactive ? 'nav' : 'div'" ref="root" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-stepper__root', classNames?.root, vertical ? 'mc-stepper__vertical' : 'mc-stepper__horizontal', compact && 'mc-stepper__compact', $attrs.class as string | undefined)" :aria-label="label" :role="interactive ? undefined : 'group'">
    <ol :class="cn('mc-stepper__list', classNames?.list)" :style="vertical ? undefined : { gridTemplateColumns: count > 1 ? `repeat(${count - 1}, minmax(0, 1fr)) auto` : 'auto' }" @keydown="interactive ? onKeydown($event) : undefined">
      <li v-for="(step, index) in steps" :key="step.id" :class="cn('mc-stepper__item', classNames?.item)" :data-status="statusOf(step, index)">
        <span v-if="index < count - 1" :class="cn('mc-stepper__connector', classNames?.connector)" aria-hidden="true"><span :key="orientation" :class="cn('mc-stepper__fill', classNames?.fill)" :data-fill="index" /></span>
        <component :is="interactive ? 'button' : 'span'" :type="interactive ? 'button' : undefined" :class="cn('mc-stepper__head', classNames?.head)" :data-clickable="(interactive && index < active) || undefined" :data-reachable="(interactive && index <= active) || undefined" :aria-current="index === active ? 'step' : undefined" :aria-disabled="interactive ? (index < active ? undefined : true) : undefined" :tabindex="interactive && index >= active ? -1 : undefined" @click="interactive && index < active ? emit('stepSelect', index) : undefined">
          <span class="mc-stepper__marker" aria-hidden="true">
            <Transition :css="false" @enter="enterRing" @leave="leaveRing"><span v-if="index === active" key="ring" class="mc-stepper__ring" /></Transition>
            <span class="mc-stepper__disc">
              <Transition :css="false" @enter="enterGlyph" @leave="leaveGlyph">
                <span v-if="kindOf(step, index) === 'number'" key="number" class="mc-stepper__glyph" :data-delay="delayAt(index)">{{ index + 1 }}</span>
                <svg v-else-if="kindOf(step, index) === 'check'" key="check" data-glyph :data-delay="delayAt(index)" class="mc-stepper__glyph mc-stepper__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.25 4.25L18.5 8" /></svg>
                <svg v-else key="error" data-glyph :data-delay="delayAt(index)" class="mc-stepper__glyph mc-stepper__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.75v6.5" /><circle cx="12" cy="17.4" r="1.4" fill="currentColor" stroke="none" /></svg>
              </Transition>
            </span>
          </span>
          <span :class="cn('mc-stepper__text', classNames?.text)">
            <span :class="cn('mc-stepper__label', classNames?.label)">{{ step.label }}</span>
            <span v-if="statusText[statusOf(step, index)]" class="mc-stepper__srOnly">, {{ statusText[statusOf(step, index)] }}</span>
            <StepperText :text="step.error ?? (details === 'all' || index === active ? step.description : undefined)" :class-name="step.error ? 'mc-stepper__error' : 'mc-stepper__description'" />
          </span>
        </component>
      </li>
    </ol>
    <span v-if="!vertical" :class="cn('mc-stepper__caption', classNames?.caption)" aria-hidden="true">
      <StepperText :text="now?.label ?? completeLabel" :class-name="cn('mc-stepper__captionLabel', classNames?.captionLabel)" />
      <StepperText :text="now?.error ?? now?.description" :class-name="now?.error ? 'mc-stepper__error' : 'mc-stepper__description'" />
    </span>
    <span class="mc-stepper__srOnly" aria-live="polite">{{ now ? `Step ${active + 1} of ${count}: ${now.label}` : completeLabel }}</span>
  </component>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-stepper__root { --marker: 1.75rem; --halo: 4px; min-width: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }
/* A horizontal stepper spans its container, so it can safely measure itself and fold into markers when space runs out. */
.mc-stepper__horizontal { width: 100%; container: stepper / inline-size; }
.mc-stepper__list { display: grid; margin: 0; padding: 0; list-style: none; }
.mc-stepper__item { position: relative; min-width: 0; }
.mc-stepper__horizontal .mc-stepper__item:not(:last-child) { padding-inline-end: var(--space-4); }
.mc-stepper__vertical .mc-stepper__item:not(:last-child) { padding-bottom: var(--space-5); }
.mc-stepper__compact.mc-stepper__vertical .mc-stepper__item:not(:last-child) { padding-bottom: var(--space-6); }

/* Buttons and spans share one head, so a chosen step keeps focus as it becomes the current one. */
.mc-stepper__head { display: grid; margin: 0; padding: 0; border: 0; border-radius: var(--space-2); background: none; color: inherit; font: inherit; letter-spacing: inherit; text-align: start; cursor: default; -webkit-tap-highlight-color: transparent; }
.mc-stepper__head[data-clickable] { cursor: pointer; }
.mc-stepper__horizontal .mc-stepper__head { width: fit-content; max-width: 100%; justify-items: start; row-gap: var(--space-3); }
.mc-stepper__vertical .mc-stepper__head { width: 100%; grid-template-columns: var(--marker) minmax(0, 1fr); column-gap: var(--space-3); align-items: start; }
.mc-stepper__compact.mc-stepper__vertical .mc-stepper__head { grid-template-columns: var(--marker); column-gap: 0; }
.mc-stepper__head:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 4px; }
.mc-stepper__head:focus:not(:focus-visible) { outline: none; }

/* The ring sits behind the disc and grows out of it; the disc carries the state color and the glyph. */
.mc-stepper__marker { position: relative; display: grid; width: var(--marker); height: var(--marker); flex: none; place-items: center; }
.mc-stepper__ring { position: absolute; inset: calc(var(--halo) * -1); border-radius: var(--radius-pill); background: var(--accent-subtle); transition: background-color var(--duration-standard) var(--ease-standard); }
.mc-stepper__disc { position: relative; display: grid; width: 100%; height: 100%; place-items: center; border-radius: var(--radius-pill); background: var(--surface); box-shadow: inset 0 0 0 1px var(--border-strong); color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1; transition: background-color var(--duration-standard) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-stepper__glyph { display: grid; grid-area: 1 / 1; place-items: center; }
.mc-stepper__icon { width: .875rem; height: .875rem; }
.mc-stepper__item[data-status="current"] .mc-stepper__disc { box-shadow: inset 0 0 0 1.5px var(--accent); color: var(--foreground); }
.mc-stepper__item[data-status="complete"] .mc-stepper__disc { background: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); color: var(--accent-foreground); }
.mc-stepper__item[data-status="error"] .mc-stepper__disc { background: color-mix(in oklab, var(--danger) 10%, var(--surface)); box-shadow: inset 0 0 0 1.5px var(--danger); color: var(--danger); }
.mc-stepper__item[data-status="error"] .mc-stepper__ring { background: color-mix(in oklab, var(--danger) 16%, transparent); }

/* The track stays put; only the fill scales along it on a spring, from the step that was just finished. */
.mc-stepper__connector { position: absolute; overflow: hidden; border-radius: var(--radius-pill); background: var(--border); pointer-events: none; }
.mc-stepper__horizontal .mc-stepper__connector { top: calc(var(--marker) / 2 - 1px); inset-inline: calc(var(--marker) + var(--halo) + var(--space-1)) calc(var(--halo) + var(--space-1)); height: 2px; }
/* Both ends keep a clear gap from the markers, and from the current step's ring. */
.mc-stepper__vertical .mc-stepper__connector { top: calc(var(--marker) + var(--halo) + 2px); bottom: calc(var(--halo) + 2px); inset-inline-start: calc(var(--marker) / 2 - 1px); width: 2px; }
.mc-stepper__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--accent); }
.mc-stepper__horizontal .mc-stepper__fill { transform-origin: left center; }
.mc-stepper__horizontal .mc-stepper__fill:dir(rtl) { transform-origin: right center; }
.mc-stepper__vertical .mc-stepper__fill { transform-origin: center top; }

.mc-stepper__text { display: grid; min-width: 0; }
/* Centers the first line of the label on the marker. */
.mc-stepper__vertical .mc-stepper__text { padding-top: .25rem; }
.mc-stepper__label { display: block; color: var(--text-muted); font-size: var(--text-sm); font-weight: 500; line-height: 1.25rem; overflow-wrap: break-word; transition: color var(--duration-standard) var(--ease-standard); }
.mc-stepper__item[data-status="complete"] .mc-stepper__label { color: var(--text-secondary); }
.mc-stepper__item[data-status="current"] .mc-stepper__label, .mc-stepper__item[data-status="error"] .mc-stepper__label { color: var(--foreground); }
/* Changing text pops out of flow against this box while it leaves, so it must be the positioned parent. */
.mc-stepper__slot { display: block; }
.mc-stepper__slotInner { position: relative; display: block; }
.mc-stepper__description, .mc-stepper__error { display: block; padding-top: 2px; font-size: var(--text-xs); font-weight: 400; line-height: var(--leading-body); overflow-wrap: break-word; }
.mc-stepper__description { color: var(--text-muted); }
.mc-stepper__error { color: var(--danger); }

.mc-stepper__caption { display: none; margin-top: var(--space-3); }
.mc-stepper__captionLabel { display: block; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: 1.25rem; }

@media (hover: hover) and (pointer: fine) {
  .mc-stepper__head[data-clickable]:hover .mc-stepper__label { color: var(--foreground); }
  .mc-stepper__item[data-status="complete"] .mc-stepper__head[data-clickable]:hover .mc-stepper__disc { background: var(--accent-strong); box-shadow: inset 0 0 0 1px var(--accent-strong); }
  .mc-stepper__item[data-status="error"] .mc-stepper__head[data-clickable]:hover .mc-stepper__disc { background: color-mix(in oklab, var(--danger) 18%, var(--surface)); }
}
.mc-stepper__head[data-clickable]:active .mc-stepper__disc { transform: scale(.92); }

.mc-stepper__srOnly, .mc-stepper__compact .mc-stepper__text { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-stepper__compact.mc-stepper__horizontal .mc-stepper__caption { display: grid; }
/* Four labels no longer fit side by side: keep the markers and name the current step underneath. */
@container stepper (max-width: 30rem) {
  .mc-stepper__horizontal .mc-stepper__text { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .mc-stepper__horizontal .mc-stepper__caption { display: grid; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-stepper__disc, .mc-stepper__ring, .mc-stepper__label { transition: none; }
  .mc-stepper__head[data-clickable]:active .mc-stepper__disc { transform: none; }
}
</style>
