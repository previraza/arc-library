<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, onUpdated, ref } from "vue";
import { Check, X } from "lucide-vue-next";
import type { MotionValue } from "motion";
import { createStackCard } from "@/lib/card-stack";
import type { CardDecision, Exit, Point, Return } from "@/lib/card-stack";

const props = defineProps<{
  id: string;
  depth: number;
  decision: CardDecision | null;
  returnFrom?: Return;
  interactive: boolean;
  zIndex: number;
  label: string;
  labels: { left: string; right: string };
  lift: MotionValue<number>;
  reduced: boolean;
  fling: (id: string) => Point | undefined;
  onRelease: (id: string, offset: Point, velocity: Point, width: number) => boolean;
  onThrown: (id: string, exit: Exit) => void;
  onGone: (id: string) => void;
}>();

const slot = ref<HTMLElement>();
const card = ref<HTMLElement>();
let controller: ReturnType<typeof createStackCard> | undefined;
onMounted(() => {
  controller = createStackCard({ slot: slot.value!, card: card.value! }, {
    id: props.id,
    reduced: props.reduced,
    lift: props.lift,
    state: () => ({ depth: props.depth, decision: props.decision, returnFrom: props.returnFrom, interactive: props.interactive }),
    fling: (key) => props.fling(key),
    onRelease: (key, offset, velocity, width) => props.onRelease(key, offset, velocity, width),
    onThrown: (key, exit) => props.onThrown(key, exit),
    onGone: (key) => props.onGone(key),
  });
  controller.update();
});
onUpdated(() => controller?.update());
onBeforeUnmount(() => controller?.destroy());
</script>

<template>
  <div ref="slot" class="mc-card-stack__slot" :style="{ zIndex }" :aria-hidden="interactive ? undefined : true" :inert="(!interactive ? '' : undefined) as unknown as boolean">
    <div ref="card" class="mc-card-stack__card" :data-top="interactive ? '' : undefined" :data-flying="decision !== null ? '' : undefined" :role="interactive ? 'group' : undefined" :aria-label="interactive ? label : undefined">
      <div class="mc-card-stack__face">
        <slot />
        <span class="mc-card-stack__shade" data-shade aria-hidden="true" />
      </div>
      <span class="mc-card-stack__stamp" data-side="right" data-stamp="right" aria-hidden="true"><Check :size="16" :stroke-width="2" />{{ labels.right }}</span>
      <span class="mc-card-stack__stamp" data-side="left" data-stamp="left" aria-hidden="true"><X :size="16" :stroke-width="2" />{{ labels.left }}</span>
    </div>
  </div>
</template>
