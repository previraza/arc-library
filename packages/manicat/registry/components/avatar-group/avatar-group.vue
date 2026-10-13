<script setup lang="ts">
// @manicat-dependencies motion
import { computed, ref, watch } from "vue";
import Avatar from "@/registry/components/avatar/avatar.vue";
import { animateSize, playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface AvatarGroupMember {
  name: string;
  src?: string;
  status?: "online" | "offline";
}

const props = withDefaults(
  defineProps<{
    members: AvatarGroupMember[];
    max?: number;
    size?: "sm" | "md" | "lg";
    label?: string;
    /** Extend the inner, named parts of the group: slot, lift, avatar, tip, overflow or count. */
    classNames?: { slot?: string; lift?: string; avatar?: string; tip?: string; overflow?: string; count?: string };
  }>(),
  { max: 4, size: "md", label: "Team members" },
);

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const visible = computed(() => props.members.slice(0, Math.max(0, props.max)));
const overflow = computed(() => Math.max(0, props.members.length - visible.value.length));
// More people roll the count up from below; fewer drop it in from above.
const direction = ref(1);
watch(overflow, (next, previous) => (direction.value = next < previous ? -1 : 1), { flush: "sync" });

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

// A person joining or leaving opens or closes their slot, so the rest of the stack slides instead of jumping.
const timing = reduced ? ({ duration: 0 } as const) : ({ spring: "morph" } as const);
function slotIn(el: Element, done: () => void) {
  playPose(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, timing);
  animateSize(el as HTMLElement, "width", "open", timing).finished.then(done);
}
function slotOut(el: Element, done: () => void) {
  playPose(el, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.9 }, timing);
  animateSize(el as HTMLElement, "width", "close", timing).finished.then(done);
}
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function countIn(el: Element, done: () => void) {
  const blur = reduced ? undefined : motionTokens.blur.subtle;
  playPose(el, { opacity: 0, y: reduced ? 0 : em(el, 0.4 * direction.value), blur }, { opacity: 1, y: 0, blur: blur === undefined ? undefined : 0 }, reduced ? { duration: motionTokens.duration.instant } : { duration: motionTokens.duration.standard, ease: "enter" }).finished.then(done);
}
function countOut(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  const blur = reduced ? undefined : motionTokens.blur.subtle;
  playPose(el, { opacity: 1, y: 0, blur: blur === undefined ? undefined : 0 }, { opacity: 0, y: reduced ? 0 : em(el, -0.4 * direction.value), blur }, reduced ? { duration: motionTokens.duration.instant } : { duration: motionTokens.duration.fast, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <TransitionGroup
    tag="div"
    :css="false"
    :class="cn('mc-avatar-group__group', `mc-avatar-group__${size}`)"
    role="group"
    :aria-label="label"
    :style="{ '--count': visible.length + (overflow > 0 ? 1 : 0) }"
    @enter="slotIn"
    @leave="slotOut"
  >
    <span v-for="(member, index) in visible" :key="member.name" :class="cn('mc-avatar-group__slot', classNames?.slot)" :style="{ '--index': index }">
      <span :class="cn('mc-avatar-group__lift', classNames?.lift)">
        <Avatar :class="cn('mc-avatar-group__avatar', classNames?.avatar)" :name="member.name" :src="member.src" :status="member.status" :size="size" />
        <span :class="cn('mc-avatar-group__tip', classNames?.tip)" aria-hidden="true">{{ member.name }}</span>
      </span>
    </span>
    <span v-if="overflow > 0" key="overflow" :class="cn('mc-avatar-group__slot', classNames?.slot)" :style="{ '--index': visible.length }">
      <span :class="cn('mc-avatar-group__lift', 'mc-avatar-group__overflow', `mc-avatar-group__${size}`, classNames?.overflow)" role="img" :aria-label="`${overflow} more ${label.toLowerCase()}`">
        <Transition :css="false" @enter="countIn" @leave="countOut">
          <span :key="overflow" :class="cn('mc-avatar-group__count', classNames?.count)" aria-hidden="true">+{{ overflow }}</span>
        </Transition>
      </span>
    </span>
  </TransitionGroup>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar-group__group { --avatar-size: 36px; display: inline-flex; height: var(--avatar-size); align-items: center; padding-left: 6px; }
.mc-avatar-group__group.mc-avatar-group__sm { --avatar-size: 28px; }
.mc-avatar-group__group.mc-avatar-group__lg { --avatar-size: 48px; }
/* Each slot is the avatar's visible width, so a slot that opens or closes moves the rest of the stack smoothly. */
.mc-avatar-group__slot { position: relative; display: inline-flex; flex: 0 0 auto; height: var(--avatar-size); align-items: center; }
/* One wrapper per person carries every hover move as a single translate, so the stack never changes size. */
.mc-avatar-group__lift { --fan: 0px; --aside: 0px; --rise: 0px; position: relative; display: inline-flex; margin-left: -6px; border-radius: var(--radius-pill); transform: translate(calc(var(--fan) + var(--aside)), var(--rise)); transition: transform var(--duration-standard) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-avatar-group__avatar, .mc-avatar-group__overflow { border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--border); transition: box-shadow var(--duration-fast) var(--ease-standard); }
.mc-avatar-group__overflow { position: relative; display: inline-grid; place-items: center; overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-avatar-group__count { display: inline-block; }
.mc-avatar-group__overflow.mc-avatar-group__sm { width: 28px; height: 28px; font-size: 10px; }
.mc-avatar-group__overflow.mc-avatar-group__md { width: 36px; height: 36px; }
.mc-avatar-group__overflow.mc-avatar-group__lg { width: 48px; height: 48px; font-size: var(--text-sm); }
/* The name floats above the stack, outside the layout, so showing it never moves anything. */
.mc-avatar-group__tip { position: absolute; z-index: 2; bottom: calc(100% + 8px); left: 50%; padding: 4px 8px; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; pointer-events: none; opacity: 0; transform: translate(-50%, 3px); transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
/* Pointing at the stack loosens its overlap from the center; the person under the pointer lifts with a crisp ring and names themselves, and their neighbors ease aside. */
@media (hover: hover) and (pointer: fine) {
  .mc-avatar-group__group:hover .mc-avatar-group__lift { --fan: calc((var(--index) - (var(--count) - 1) / 2) * 4px); }
  .mc-avatar-group__slot:hover { z-index: 1; }
  .mc-avatar-group__slot:hover .mc-avatar-group__lift { --rise: -2px; }
  .mc-avatar-group__slot:hover ~ .mc-avatar-group__slot .mc-avatar-group__lift { --aside: 3px; }
  .mc-avatar-group__slot:has(~ .mc-avatar-group__slot:hover) .mc-avatar-group__lift { --aside: -3px; }
  .mc-avatar-group__slot:hover .mc-avatar-group__avatar, .mc-avatar-group__slot:hover .mc-avatar-group__overflow { box-shadow: 0 0 0 1px var(--border-strong); }
  .mc-avatar-group__slot:hover .mc-avatar-group__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: 60ms; }
}
/* Reduced motion keeps the stack still; the ring and name still answer the pointer. */
@media (prefers-reduced-motion: reduce) { .mc-avatar-group__lift { transform: none !important; transition: none; } .mc-avatar-group__tip { transform: translate(-50%, 0); transition: none; } }
</style>
