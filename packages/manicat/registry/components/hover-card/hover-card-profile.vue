<script setup lang="ts">
// @manicat-dependencies motion
import { computed, onMounted, ref } from "vue";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface HoverCardStat {
  label: string;
  value: string | number;
}

/** A person preview for `HoverCard`: portrait, name, role, a short bio, a couple of numbers, and a quiet footer line. Its rows settle in with a tiny stagger. */
const props = withDefaults(defineProps<{ name: string; /** Role and team, such as "Product designer, Payments". */ role?: string; /** A portrait URL. Initials show when it is missing. */ avatar?: string; bio?: string; stats?: HoverCardStat[]; /** A footer line, such as a location and local time. */ meta?: string }>(), { stats: () => [] });

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = ref<HTMLElement>();
const image = ref<HTMLImageElement>();
const initials = computed(() => props.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));

// A cached portrait shows at once; one still downloading fades in from a soft blur.
onMounted(() => {
  const node = image.value;
  if (node && !node.complete) node.dataset.loading = "";
  // The rows settle in with a tiny stagger.
  if (reduced) return;
  root.value?.querySelectorAll<HTMLElement>("[data-settle]").forEach((row) => {
    const order = Number(row.dataset.settle);
    playPose(row, { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, { duration: motionTokens.duration.standard, ease: "enter", delay: 0.04 + order * motionTokens.stagger.item });
  });
});
</script>

<template>
  <div ref="root" class="mc-hover-card__profile">
    <div class="mc-hover-card__head" data-settle="0">
      <span class="mc-hover-card__avatar" aria-hidden="true"><img v-if="avatar" ref="image" :src="avatar" alt="" width="48" height="48" decoding="async" @load="(event) => delete (event.currentTarget as HTMLElement).dataset.loading" /><span v-else class="mc-hover-card__initials">{{ initials }}</span></span>
      <span class="mc-hover-card__identity"><span class="mc-hover-card__name">{{ name }}</span><span v-if="role" class="mc-hover-card__role">{{ role }}</span></span>
    </div>
    <p v-if="bio" class="mc-hover-card__bio" data-settle="1">{{ bio }}</p>
    <dl v-if="stats.length" class="mc-hover-card__stats" data-settle="2">
      <div v-for="stat in stats" :key="stat.label" class="mc-hover-card__stat"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div>
    </dl>
    <div v-if="meta" class="mc-hover-card__meta" data-settle="3">{{ meta }}</div>
  </div>
</template>
