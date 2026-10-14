<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { pad, parts, physical } from "@/lib/announcement-bar";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";
import { animate } from "motion";

/** A live countdown. A changed digit drops in from above while the old one falls away, like a counter winding down. */
const props = defineProps<{ to: Date | string | number; label?: string; classNames?: Record<string, string | undefined> }>();
const emit = defineEmits<{ end: [] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration } = motionTokens;
const standard = [...motionTokens.ease.standard] as [number, number, number, number];
const target = computed(() => new Date(props.to).getTime());
const now = ref<number | null>(null);
let timer = 0;
let ended = false;
function tick() {
  const current = Date.now();
  now.value = current;
  if (current >= target.value) {
    if (!ended) { ended = true; emit("end"); }
    return;
  }
  // Wake just after each whole second so digits change on the beat.
  timer = window.setTimeout(tick, 1000 - (current % 1000) + 8);
}
onMounted(() => (timer = window.setTimeout(tick, 0)));
onBeforeUnmount(() => window.clearTimeout(timer));
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const pending = computed(() => now.value === null);
const parted = computed(() => parts(now.value === null ? 0 : target.value - now.value));
const spoken = computed(() => (pending.value ? "" : `${parted.value.d ? `${parted.value.d} days ` : ""}${parted.value.h} hours ${parted.value.m} minutes`));
const digits = (value: string, key: string) => value.split("").map((char, index) => ({ key: `${key}${value.length - index}`, char: pending.value ? "0" : char }));

function enterDigit(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  animate(el, { y: ["-70%", "0%"] } as never, physical(0.32, 0.08) as never);
  animate(el, { opacity: [0, 1] }, { duration: duration.fast, ease: standard }).finished.then(done);
}
function leaveDigit(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  animate(el, { y: "70%" } as never, physical(0.32, 0.08) as never);
  animate(el, { opacity: 0 }, { duration: duration.fast, ease: standard }).finished.then(done);
}
</script>

<template>
  <span :class="cn('mc-announcement-bar__countdown', 'countdown')">
    <span v-if="label" :class="cn('mc-announcement-bar__countdownLabel', 'countdownLabel')">{{ label }}</span>
    <span role="timer" aria-live="off" :aria-label="spoken" :class="cn('mc-announcement-bar__time', 'time')" :data-pending="pending || undefined">
      <template v-if="parted.d">
        <span :class="cn('mc-announcement-bar__unit', 'unit')">
          <span v-for="cell in digits(String(parted.d), 'd')" :key="cell.key" :class="cn('mc-announcement-bar__digit', 'digit')"><span class="mc-announcement-bar__digitSizer" aria-hidden="true">0</span><Transition :css="false" @enter="enterDigit" @leave="leaveDigit"><span :key="cell.char" :class="cn('mc-announcement-bar__digitFace', 'digitFace')">{{ cell.char }}</span></Transition></span>
          <span :class="cn('mc-announcement-bar__unitMark', 'unitMark')" aria-hidden="true">d</span>
        </span>
        <span class="mc-announcement-bar__gap" aria-hidden="true" />
      </template>
      <template v-for="(group, groupIndex) in [digits(pad(parted.h), 'h'), digits(pad(parted.m), 'm'), digits(pad(parted.s), 's')]" :key="groupIndex">
        <span v-for="cell in group" :key="cell.key" :class="cn('mc-announcement-bar__digit', 'digit')"><span class="mc-announcement-bar__digitSizer" aria-hidden="true">0</span><Transition :css="false" @enter="enterDigit" @leave="leaveDigit"><span :key="cell.char" :class="cn('mc-announcement-bar__digitFace', 'digitFace')">{{ cell.char }}</span></Transition></span>
        <span v-if="groupIndex < 2" :class="cn('mc-announcement-bar__sep', 'sep')" aria-hidden="true">:</span>
      </template>
    </span>
  </span>
</template>
