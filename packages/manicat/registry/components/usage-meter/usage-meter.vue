<script setup lang="ts">
import { computed } from "vue";

export interface UsageMeterSegment {
  id: string;
  label: string;
  value: number;
}

const props = withDefaults(
  defineProps<{
    label: string;
    segments: UsageMeterSegment[];
    limit: number;
    unit?: string;
    decimals?: number;
    freeLabel?: string;
    overLabel?: string;
    /** Share of the limit at which the meter warns. */
    warnAt?: number;
    /** Extend the inner, named parts of the meter: track, segment, legend or readout. */
    classNames?: { track?: string; segment?: string; legend?: string; readout?: string };
  }>(),
  { unit: "", decimals: 1, freeLabel: "Free", overLabel: "Over limit", warnAt: 0.9 },
);

const used = computed(() => props.segments.reduce((sum, segment) => sum + segment.value, 0));
const over = computed(() => used.value > props.limit);
const warn = computed(() => !over.value && props.limit > 0 && used.value / props.limit >= props.warnAt);
const format = (n: number) => `${n.toFixed(props.decimals)}${props.unit ? ` ${props.unit}` : ""}`;
</script>

<template>
  <div class="mc-usage" role="meter" :aria-label="`${label}: ${format(used)} of ${format(limit)}`" aria-valuemin="0" :aria-valuemax="limit" :aria-valuenow="Math.min(used, limit)" :data-state="over ? 'over' : warn ? 'warn' : 'ok'">
    <div class="mc-usage__head">
      <span class="mc-usage__label">{{ label }}</span>
      <span :class="['mc-usage__readout', classNames?.readout]">{{ format(used) }} / {{ format(limit) }}</span>
    </div>
    <div :class="['mc-usage__track', classNames?.track]">
      <span
        v-for="(segment, index) in segments"
        :key="segment.id"
        :class="['mc-usage__segment', classNames?.segment]"
        :style="{ width: `${Math.min(100, (segment.value / Math.max(used, limit)) * 100)}%`, '--mc-shade': index % 4 }"
        :title="`${segment.label}: ${format(segment.value)}`"
      />
    </div>
    <span :class="['mc-usage__legend', classNames?.legend]">{{ over ? `${overLabel} by ${format(used - limit)}` : `${format(Math.max(0, limit - used))} ${freeLabel.toLowerCase()}` }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-usage { display: grid; gap: var(--space-2); width: 100%; }
.mc-usage__head { display: flex; justify-content: space-between; gap: 12px; }
.mc-usage__label { font-size: var(--text-sm); font-weight: 500; }
.mc-usage__readout { color: var(--text-secondary); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-usage__track { display: flex; height: 8px; overflow: hidden; border: 1px solid var(--border); border-radius: 99px; background: var(--surface-muted); }
.mc-usage__segment { height: 100%; background: color-mix(in oklab, var(--foreground) calc(100% - var(--mc-shade) * 22%), var(--surface-muted)); transition: width .5s var(--ease-standard); }
.mc-usage__legend { color: var(--text-muted); font-size: var(--text-xs); }
.mc-usage[data-state="warn"] .mc-usage__segment { background: var(--warning); } .mc-usage[data-state="warn"] .mc-usage__readout { color: var(--warning); }
.mc-usage[data-state="over"] .mc-usage__segment { background: var(--danger); } .mc-usage[data-state="over"] .mc-usage__readout, .mc-usage[data-state="over"] .mc-usage__legend { color: var(--danger); }
@media (prefers-reduced-motion: reduce) { .mc-usage__segment { transition: none; } }
</style>
