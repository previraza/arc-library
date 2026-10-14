<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate } from "motion";
import { onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import TimelineRise from "@/registry/components/timeline/timeline-rise.vue";
import { animateSize, playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

const props = defineProps<{ row: { id: string; at: string | number; actor?: string; title: string; meta?: string; detail?: string; avatar?: string; icon?: unknown; tone?: "neutral" | "success" | "danger"; time: number }; last: boolean; expanded: boolean; fresh: boolean; schedule: () => number; timeLabel: string; timeFull: string; classNames?: Record<string, string | undefined> }>();
const emit = defineEmits<{ toggle: [] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, spring } = motionTokens;
const detailId = useId();
const item = ref<HTMLElement>();
const marker = ref<HTMLElement>();
const segment = ref<HTMLElement>();
const chevron = ref<HTMLElement>();
let seen: IntersectionObserver | undefined;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const tone = () => (props.row.avatar ? undefined : (props.row.tone ?? "neutral"));

// The row reveals once, the first time it scrolls into view: its marker pops, then its line draws toward the next row.
onMounted(() => {
  if (marker.value) {
    marker.value.style.opacity = "0";
    marker.value.style.transform = "scale(0.4)";
  }
  if (segment.value) segment.value.style.transform = "scaleY(0)";
  seen = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    seen?.disconnect();
    const delay = props.schedule() + (props.fresh ? 0.12 : 0);
    if (marker.value) {
      if (reduced) animate(marker.value, { scale: 1, opacity: 1 } as never, { duration: 0, opacity: { duration: 0.15 } } as never);
      else animate(marker.value, { scale: [0.4, 1], opacity: [0, 1] } as never, { ...(spring.morph as object), visualDuration: 0.36, bounce: 0.32, delay, opacity: { duration: duration.fast, ease: [...motionTokens.ease.enter], delay } } as never);
    }
    if (segment.value) animate(segment.value, { scaleY: [0, 1] } as never, (reduced ? { duration: 0 } : { ...(spring.smooth as object), visualDuration: 0.34, delay: delay + 0.1 }) as never);
  }, { threshold: 0.2 });
  seen.observe(item.value!);
});
onBeforeUnmount(() => seen?.disconnect());
watch(() => props.expanded, (open) => chevron.value && animate(chevron.value, { rotate: open ? 180 : 0 } as never, (reduced ? { duration: 0 } : spring.snappy) as never));

// The detail opens in place: its height first, then its text settles in.
function enterDetail(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (reduced) return void playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: 0 }).finished.then(done);
  node.style.overflow = "hidden";
  node.style.height = "0px";
  animateSize(node, "height", "open", { spring: "smooth" }).finished.then(() => {
    node.style.overflow = "";
    done();
  });
  const inner = node.firstElementChild;
  if (inner) playPose(inner, { opacity: 0, y: -4, blur: motionTokens.blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter", delay: 0.06 });
}
function leaveDetail(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  if (reduced) return void animate(node, { opacity: 0 }, { duration: 0 }).finished.then(done);
  const inner = node.firstElementChild;
  if (inner) playPose(inner, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant, ease: "standard" });
  animateSize(node, "height", "close", { spring: { ...(spring.smooth as object), visualDuration: 0.28 } }).finished.then(done);
}
</script>

<template>
  <li ref="item" :class="cn('mc-timeline__item', 'item')" :data-fresh="fresh || undefined">
    <span ref="marker" :class="cn('mc-timeline__marker', 'marker')" :data-tone="tone()" aria-hidden="true">
      <img v-if="row.avatar" :src="row.avatar" alt="" width="28" height="28" decoding="async" />
      <component :is="row.icon as never" v-else-if="row.icon" />
    </span>
    <span v-if="!last" ref="segment" :class="cn('mc-timeline__segment', 'segment')" aria-hidden="true" />
    <div data-content :class="cn('mc-timeline__content', 'content')">
      <component :is="row.detail ? 'button' : 'div'" :class="cn('mc-timeline__trigger', 'trigger')" :type="row.detail ? 'button' : undefined" :data-timeline-trigger="row.detail ? '' : undefined" :aria-expanded="row.detail ? expanded : undefined" :aria-controls="row.detail && expanded ? detailId : undefined" @click="row.detail ? emit('toggle') : undefined">
        <span :class="cn('mc-timeline__text', 'text')">
          <span :class="cn('mc-timeline__title', 'title')"><span v-if="row.actor" :class="cn('mc-timeline__actor', 'actor')">{{ row.actor }}</span>{{ row.actor ? " " : "" }}{{ row.title }}</span>
          <span v-if="row.meta" :class="cn('mc-timeline__meta', 'meta')">{{ row.meta }}</span>
        </span>
        <time :class="cn('mc-timeline__time', 'time')" :datetime="new Date(row.time).toISOString()" :title="timeFull"><TimelineRise :text="timeLabel" :class-names="classNames" /><span class="mc-timeline__srOnly">{{ timeFull }}</span></time>
        <span v-if="row.detail" ref="chevron" :class="cn('mc-timeline__chevron', 'chevron')" aria-hidden="true"><ChevronDown :size="16" :stroke-width="1.75" /></span>
      </component>
      <Transition :css="false" @enter="enterDetail" @leave="leaveDetail">
        <div v-if="expanded && row.detail" key="detail" :id="detailId" :class="cn('mc-timeline__detail', 'detail')"><div :class="cn('mc-timeline__detailInner', 'detailInner')">{{ row.detail }}</div></div>
      </Transition>
    </div>
  </li>
</template>
