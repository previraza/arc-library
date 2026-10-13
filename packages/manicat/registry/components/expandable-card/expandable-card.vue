<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { createExpandableCard } from "@/lib/expandable-card";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps<{
  title: string;
  description?: string;
  defaultExpanded?: boolean;
  /** Collapsed width cap in px. The card is centered and never wider than its container. Fills the container when omitted. */
  width?: number;
  /** Expanded width cap in px, so the card can grow sideways into more room. Defaults to `width`. */
  expandedWidth?: number;
  /** Extend the inner, named parts of the expandable card: track, trigger, copy, description, arrow, panel or panelInner. */
  classNames?: { track?: string; trigger?: string; copy?: string; description?: string; arrow?: string; panel?: string; panelInner?: string };
}>();

/** `v-model:expanded` binds whether the details are showing. */
const expanded = defineModel<boolean>("expanded", { default: undefined });
const open = ref(props.defaultExpanded ?? false);
const panelId = useId();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const track = ref<HTMLElement>();
const card = ref<HTMLElement>();
const trigger = ref<HTMLElement>();
const arrow = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const inner = ref<HTMLElement>();
let controller: ReturnType<typeof createExpandableCard> | undefined;

const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
const isOpen = () => expanded.value ?? open.value;
const sync = () => controller?.sync(isOpen(), { width: props.width, expandedWidth: props.expandedWidth });
const toggle = (next: boolean) => {
  open.value = next;
  expanded.value = next;
};
// Caps for the first paint, before the room is measured.
const capVars = () => ({ "--expandable-card-width": props.width ? `${props.width}px` : undefined, "--expandable-card-expanded-width": (props.expandedWidth ?? props.width) ? `${props.expandedWidth ?? props.width}px` : undefined });
function onKeydown(event: KeyboardEvent) {
  (attrs.onKeydown as ((event: KeyboardEvent) => void) | undefined)?.(event);
  if (event.defaultPrevented || event.key !== "Escape" || !isOpen()) return;
  event.preventDefault();
  toggle(false);
  trigger.value?.focus();
}

onMounted(() => {
  controller = createExpandableCard({ track: track.value!, card: card.value!, arrow: arrow.value!, panel: panel.value!, inner: inner.value! }, { reduced });
  sync();
});
onBeforeUnmount(() => controller?.destroy());
watch([isOpen, () => props.width, () => props.expandedWidth], sync, { flush: "post" });

// Changed words in the summary rise in; unchanged words hold still.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterWord(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, y: em(el, 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveWord(el: Element, done: () => void) {
  if (reduced) return done();
  popOut(el as HTMLElement);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <div ref="track" :class="cn('mc-expandable-card__track', classNames?.track)">
    <article ref="card" v-bind="{ ...$attrs, class: undefined, onKeydown: undefined }" :class="cn('mc-expandable-card__card', $attrs.class as string | undefined)" :data-expanded="isOpen()" :style="[$attrs.style as never, capVars()]" @keydown="onKeydown">
      <button ref="trigger" type="button" :class="cn('mc-expandable-card__trigger', classNames?.trigger)" :aria-expanded="isOpen()" :aria-controls="panelId" @click="toggle(!isOpen())">
        <span :class="cn('mc-expandable-card__copy', classNames?.copy)"><strong>{{ title }}</strong><span v-if="description" :class="cn('mc-expandable-card__description', classNames?.description)">
          <span class="mc-expandable-card__roll">
            <span class="mc-expandable-card__srOnly">{{ description }}</span>
            <TransitionGroup tag="span" aria-hidden="true" :css="false" @enter="enterWord" @leave="leaveWord"><span v-for="(word, index) in description.split(/(\s+)/)" :key="`${index}:${word}`" class="mc-expandable-card__word">{{ word }}</span></TransitionGroup>
          </span>
        </span></span>
        <span ref="arrow" :class="cn('mc-expandable-card__arrow', classNames?.arrow)"><ChevronDown :width="18" :height="18" aria-hidden="true" /></span>
      </button>
      <!-- The panel stays mounted so a second click mid-animation reverses from where it is; inert keeps closed details out of reach. -->
      <div :id="panelId" ref="panel" :class="cn('mc-expandable-card__panel', classNames?.panel)" :inert="!isOpen()">
        <div ref="inner" :class="cn('mc-expandable-card__panelInner', classNames?.panelInner)"><slot /></div>
      </div>
    </article>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The track centers the card and measures the room it may grow into. */
.mc-expandable-card__track { display: flex; width: 100%; min-width: 0; justify-content: center; }
.mc-expandable-card__card { width: 100%; max-width: var(--expandable-card-width, 100%); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-expandable-card__card[data-expanded="true"] { max-width: var(--expandable-card-expanded-width, var(--expandable-card-width, 100%)); }
/* Once measured, the width is animated in px, so the CSS cap steps aside and never clamps the morph. */
.mc-expandable-card__card[data-measured] { max-width: 100%; }
/* The card clips the header to its corners, so the header's hover fill never changes shape while the card opens or closes. */
.mc-expandable-card__trigger { display: flex; width: 100%; min-height: 64px; align-items: center; justify-content: space-between; gap: var(--space-5); border: 0; padding: var(--space-4) var(--space-5); background: transparent; color: var(--foreground); font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-expandable-card__trigger:hover { background: var(--surface-muted); } .mc-expandable-card__trigger:hover .mc-expandable-card__arrow { color: var(--foreground); } }
.mc-expandable-card__trigger:active { background: var(--surface-muted); }
.mc-expandable-card__copy { min-width: 0; }
.mc-expandable-card__copy strong { display: block; font-size: var(--text-sm); font-weight: 500; }
.mc-expandable-card__description { display: block; margin-top: 4px; color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-expandable-card__roll { position: relative; display: block; }
.mc-expandable-card__word { display: inline-block; white-space: pre; }
.mc-expandable-card__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-expandable-card__arrow { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-expandable-card__card[data-expanded="true"] .mc-expandable-card__arrow { color: var(--foreground); }
/* The divider is an inset line rather than a border, so a collapsed panel is truly zero height and nothing pops at the end of the close. */
.mc-expandable-card__panel { overflow: hidden; box-shadow: inset 0 1px 0 var(--border); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-sm); }
.mc-expandable-card__panelInner { max-width: none; padding: var(--space-4) var(--space-5) var(--space-5); }
@media (prefers-reduced-motion: reduce) { .mc-expandable-card__trigger, .mc-expandable-card__arrow { transition: none; } }
</style>
