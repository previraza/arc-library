<script setup lang="ts">
// @manicat-dependencies reka-ui motion lucide-vue-next
import { inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { TabsList } from "reka-ui";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { createSelectionGlide, createTabsScroll, tabsKey } from "@/lib/tabs-motion";
import type { Edges, TabsState } from "@/lib/tabs-motion";

defineOptions({ inheritAttrs: false });

const state = inject<TabsState>(tabsKey)!;
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const shell = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const list = ref<{ $el: HTMLElement }>();
const edges = ref<Edges>({ overflow: false, left: false, right: false });
let scroll: ReturnType<typeof createTabsScroll> | undefined;
let glide: ReturnType<typeof createSelectionGlide> | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const activeTab = () => list.value?.$el.querySelector<HTMLElement>('[role="tab"][data-state="active"]') ?? null;

onMounted(() => {
  scroll = createTabsScroll(shell.value!, viewport.value!, list.value!.$el, { reduced, onEdges: (next) => (edges.value = next) });
  glide = createSelectionGlide(list.value!.$el, { selectionClass: cn("mc-tabs__selection", state.classNames()?.selection), reduced });
  glide.update();
  scroll.reveal(activeTab());
});
onBeforeUnmount(() => {
  scroll?.destroy();
  glide?.destroy();
});
watch(() => state.active(), () => {
  glide?.update();
  scroll?.reveal(activeTab());
}, { flush: "post" });
</script>

<template>
  <div ref="shell" :class="cn('mc-tabs__listShell', state.classNames()?.listShell)" :data-overflow="edges.overflow" :data-left="edges.left" :data-right="edges.right">
    <button v-if="edges.overflow" type="button" :class="cn('mc-tabs__scrollButton', 'mc-tabs__scrollLeft', state.classNames()?.scrollButton)" aria-label="Scroll tabs left" :disabled="!edges.left" @click="scroll?.page(-1)"><ChevronLeft :size="17" aria-hidden="true" /></button>
    <div ref="viewport" :class="cn('mc-tabs__viewport', state.classNames()?.viewport)" @focusin.capture="(event) => { if (event.target instanceof HTMLElement && event.target.getAttribute('role') === 'tab') scroll?.reveal(event.target); }">
      <TabsList ref="list" v-bind="{ ...$attrs, class: undefined }" :class="cn('mc-tabs__list', $attrs.class as string | undefined, state.classNames()?.list)"><slot /></TabsList>
    </div>
    <button v-if="edges.overflow" type="button" :class="cn('mc-tabs__scrollButton', 'mc-tabs__scrollRight', state.classNames()?.scrollButton)" aria-label="Scroll tabs right" :disabled="!edges.right" @click="scroll?.page(1)"><ChevronRight :size="17" aria-hidden="true" /></button>
  </div>
</template>
