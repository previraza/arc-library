<script setup lang="ts">
// @manicat-dependencies reka-ui motion
import { inject, onMounted, ref } from "vue";
import { TabsContent } from "reka-ui";
import { playPose } from "@/lib/motion-dom";
import { mountPanel, panelMotion, pinPanel, tabsKey } from "@/lib/tabs-motion";
import type { TabsState } from "@/lib/tabs-motion";

defineOptions({ inheritAttrs: false });

const props = defineProps<{ value: string; forceMount?: boolean }>();
const state = inject<TabsState>(tabsKey)!;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const unmounts = new WeakMap<Element, () => void>();
const panel = ref<{ $el: HTMLElement }>();

// The panel that is there from the start takes no part in the motion, but later panels still need its height.
onMounted(() => {
  if (panel.value) unmounts.set(panel.value.$el, mountPanel(panel.value.$el, state.memory, reduced));
});

// The incoming panel slides in from the side of the new tab while it takes over the outgoing panel's height.
function enter(el: Element, done: () => void) {
  const node = el as HTMLElement;
  unmounts.set(node, mountPanel(node, state.memory, reduced));
  const { from, to, timing } = panelMotion(state.direction(), reduced).enter;
  playPose(node, from, to, timing).finished.then(done);
}
// The outgoing panel is pinned where it stood while it fades, so the new one takes its place at once.
function leave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  unmounts.get(node)?.();
  pinPanel(node, state.memory);
  const { from, to, timing } = panelMotion(state.direction(), reduced).leave;
  playPose(node, from, to, timing).finished.then(done);
}
</script>

<template>
  <TabsContent v-if="forceMount" v-bind="{ ...$attrs, class: undefined }" :value="props.value" force-mount :class="cn('mc-tabs__content', $attrs.class as string | undefined, state.classNames()?.content)"><slot /></TabsContent>
  <Transition v-else :css="false" @enter="enter" @leave="leave">
    <TabsContent v-if="state.active() === props.value" ref="panel" v-bind="{ ...$attrs, class: undefined }" :key="props.value" :value="props.value" force-mount :class="cn('mc-tabs__content', $attrs.class as string | undefined, state.classNames()?.content)"><slot /></TabsContent>
  </Transition>
</template>
