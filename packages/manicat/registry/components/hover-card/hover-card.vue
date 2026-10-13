<script setup lang="ts">
// @manicat-dependencies motion reka-ui
import { onBeforeUnmount, onMounted, ref, useId, useAttrs } from "vue";
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from "reka-ui";
import { CLOSE_DELAY, INTENT, OPEN_DELAY, cards, createSurface } from "@/lib/hover-card";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    /** Milliseconds of hover before the first card opens. */
    openDelay?: number;
    /** Milliseconds of grace after the pointer leaves, so it can travel into the card. */
    closeDelay?: number;
    /** Extend the inner, named parts of the hover-card: card. */
    classNames?: { card?: string };
  }>(),
  { side: "bottom", align: "start", openDelay: OPEN_DELAY, closeDelay: CLOSE_DELAY },
);

const attrs = useAttrs();
const id = useId();
const cardId = `${id}-card`;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = ref(cards.get());
const open = ref(false);
const trigger = ref<{ $el: HTMLElement }>();
const timers = { open: 0, close: 0 };
const inside = { trigger: false, card: false, focus: false };
/** Set by Escape, so a pointer resting on the trigger does not reopen what was just dismissed. */
let dismissed = false;
let pointerType = "";

const sync = () => {
  state.value = cards.get();
  open.value = state.value.id === id;
};
let unsubscribe: (() => void) | undefined;
onMounted(() => {
  unsubscribe = cards.subscribe(sync);
  sync();
});
onBeforeUnmount(() => {
  unsubscribe?.();
  window.clearTimeout(timers.open);
  window.clearTimeout(timers.close);
  cards.close(id);
});

const clearTimers = () => { window.clearTimeout(timers.open); window.clearTimeout(timers.close); };
const show = () => { clearTimers(); dismissed = false; cards.open(id); };
const hide = () => { clearTimers(); cards.close(id); };
const scheduleOpen = () => {
  window.clearTimeout(timers.close);
  if (dismissed || cards.get().id === id) return;
  window.clearTimeout(timers.open);
  timers.open = window.setTimeout(() => cards.open(id), cards.warm() ? INTENT : props.openDelay);
};
const scheduleClose = () => {
  window.clearTimeout(timers.open);
  if (inside.trigger || inside.card || inside.focus) return;
  window.clearTimeout(timers.close);
  timers.close = window.setTimeout(() => cards.close(id), props.closeDelay);
};
const mouse = (event: PointerEvent) => event.pointerType !== "touch";

const triggerEvents = {
  onPointerenter: (event: PointerEvent) => { if (!mouse(event)) return; inside.trigger = true; scheduleOpen(); },
  onPointerleave: (event: PointerEvent) => { if (!mouse(event)) return; inside.trigger = false; dismissed = false; scheduleClose(); },
  onPointerdown: (event: PointerEvent) => { pointerType = event.pointerType; },
  onClick: () => {
    // A tap toggles the card on touch; a click or Enter opens it without the wait.
    const isOpen = cards.get().id === id;
    if (pointerType === "touch") { if (isOpen) hide(); else show(); } else if (!isOpen) show();
    pointerType = "";
  },
  onFocus: (event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).matches(":focus-visible")) return; inside.focus = true; show(); },
  onBlur: () => { inside.focus = false; dismissed = false; scheduleClose(); },
};

// The card grows from the trigger edge on enter and shrinks back on leave.
const surfaces = new WeakMap<Element, ReturnType<typeof createSurface>>();
function enter(el: Element, done: () => void) {
  const surface = createSurface(el as HTMLElement, { still: state.value.instant || reduced, reduced });
  surfaces.set(el, surface);
  surface.in();
  done();
}
function leave(el: Element, done: () => void) {
  const surface = surfaces.get(el);
  if (!surface) return done();
  surface.out(done);
}
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
</script>

<template>
  <PopoverRoot :open="open" @update:open="(next: boolean) => { if (!next) hide(); }">
    <PopoverAnchor ref="trigger" as-child :aria-describedby="open ? cardId : undefined" :data-hover-card="open ? 'open' : 'closed'" v-bind="triggerEvents">
      <slot />
    </PopoverAnchor>
    <PopoverPortal force-mount>
      <Transition :css="false" @enter="enter" @leave="leave">
        <PopoverContent v-if="open" key="card" force-mount :id="cardId" role="tooltip" :side="side" :align="align" :side-offset="8" :collision-padding="12" :class="cn('mc-hover-card__card', classNames?.card, attrs.class as string | undefined)" @open-auto-focus.prevent @close-auto-focus.prevent @escape-key-down="dismissed = true" @interact-outside="(event: Event) => { if (trigger?.$el?.contains(event.target as Node)) event.preventDefault(); }" @pointerenter="(event: PointerEvent) => { if (!mouse(event)) return; inside.card = true; window.clearTimeout(timers.close); }" @pointerleave="(event: PointerEvent) => { if (!mouse(event)) return; inside.card = false; scheduleClose(); }">
          <slot name="content" />
        </PopoverContent>
      </Transition>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* A floating layer, so it earns the floating shadow. Transforms pivot on the placed origin, the corner nearest the trigger. */
.mc-hover-card__card { z-index: 60; box-sizing: border-box; width: 18.5rem; max-width: min(18.5rem, var(--reka-popover-content-available-width, calc(100vw - 24px))); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); font-family: var(--font-body); letter-spacing: var(--tracking-body); transform-origin: var(--reka-popover-content-transform-origin); outline: none; }
.mc-hover-card__profile { display: grid; gap: var(--space-3); }
.mc-hover-card__head { display: flex; min-width: 0; align-items: center; gap: var(--space-3); }
.mc-hover-card__avatar { position: relative; display: grid; width: 48px; height: 48px; flex: none; place-items: center; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; }
.mc-hover-card__avatar img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity var(--duration-standard) var(--ease-enter), filter var(--duration-standard) var(--ease-enter); }
.mc-hover-card__avatar img[data-loading] { opacity: 0; filter: blur(4px); transition: none; }
.mc-hover-card__identity { display: grid; min-width: 0; }
.mc-hover-card__name, .mc-hover-card__role { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-hover-card__name { color: var(--foreground); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-body); }
.mc-hover-card__role { color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-hover-card__bio { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
/* Numbers lead and labels follow, while the markup keeps label then value for screen readers. */
.mc-hover-card__stats { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); margin: 0; padding-top: var(--space-3); border-top: 1px solid var(--border-subtle); }
.mc-hover-card__stat { display: flex; flex-direction: column-reverse; }
.mc-hover-card__stat dt { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-hover-card__stat dd { margin: 0; color: var(--foreground); font-size: var(--text-base); font-variant-numeric: tabular-nums; font-weight: 500; line-height: var(--leading-body); }
.mc-hover-card__meta { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-hover-card__meta svg { flex: none; }
@media (prefers-reduced-motion: reduce) { .mc-hover-card__avatar img { transition: none; } .mc-hover-card__avatar img[data-loading] { filter: none; } }
</style>
