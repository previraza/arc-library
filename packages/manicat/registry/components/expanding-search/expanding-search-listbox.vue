<script setup lang="ts">
// @manicat-dependencies motion
import { animate } from "motion";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Component } from "vue";
import { createListboxMotion, enter, splitMatch } from "@/lib/expanding-search";
import type { ExpandingSearchEntry, SearchGroup } from "@/lib/expanding-search";
import { createFlip, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

type Item = ExpandingSearchEntry & { icon?: Component };

const props = defineProps<{ id: string; label: string; groups: SearchGroup<Item>[]; query: string; activeIndex: number; optionId: (item: Item) => string; keyboard: { current: boolean }; classNames?: Record<string, string | undefined> }>();
const emit = defineEmits<{ hover: [index: number]; choose: [item: Item] }>();

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const list = ref<HTMLElement>();
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const flat = () => props.groups.flatMap((group) => group.items);
const layoutKey = () => flat().map((item) => item.id).join("|");
const activeId = () => {
  const item = flat()[props.activeIndex];
  return item ? props.optionId(item) : "";
};
const headingId = (name: string) => `${props.id}-${name || "results"}`.replace(/\s+/g, "-");

let motion: ReturnType<typeof createListboxMotion> | undefined;
// Groups and rows glide to their new place on a spring when the results change.
const groupFlip = createFlip(() => [...(list.value?.querySelectorAll<HTMLElement>(":scope > [role=group]") ?? [])], { reduced, spring: "smooth" });
const optionFlip = createFlip(() => [...(list.value?.querySelectorAll<HTMLElement>("[role=option]") ?? [])], { reduced, spring: "smooth" });
onMounted(() => {
  motion = createListboxMotion(list.value!, { reduced, keyboard: props.keyboard });
  motion.sync(activeId(), layoutKey());
});
onBeforeUnmount(() => motion?.destroy());
watch(layoutKey, () => { groupFlip.measure(); optionFlip.measure(); }, { flush: "pre" });
watch(layoutKey, () => { groupFlip.play(); optionFlip.play(); }, { flush: "post" });
watch([activeId, layoutKey], () => motion?.sync(activeId(), layoutKey()), { flush: "post" });

// Groups and rows fade in, and fade out a little faster while they pop out of the flow.
const { duration } = motionTokens;
const only = (selector: string, run: (el: HTMLElement, done: () => void) => void) => (el: Element, done: () => void) => (el.matches(selector) ? run(el as HTMLElement, done) : done());
const enterItem = only("[role=group], [role=option]", (el, done) => void animate(el, { opacity: [0, 1] }, { duration: duration.fast, ease: enter }).finished.then(done));
const leaveGroup = only("[role=group]", (el, done) => {
  popOut(el, groupFlip.origin(el));
  void animate(el, { opacity: [1, 0] }, { duration: 0.08 }).finished.then(done);
});
const leaveOption = only("[role=option]", (el, done) => {
  popOut(el, optionFlip.origin(el));
  void animate(el, { opacity: [1, 0] }, { duration: 0.08 }).finished.then(done);
});
</script>

<template>
  <div ref="list" :id="id" role="listbox" :aria-label="label" :class="cn('mc-expanding-search__listbox', 'listbox')">
    <TransitionGroup :css="false" @enter="enterItem" @leave="leaveGroup">
      <div v-for="group in groups" :key="group.name" role="group" :aria-labelledby="group.name ? headingId(group.name) : undefined" :class="cn('mc-expanding-search__group', 'group')">
        <div v-if="group.name" :id="headingId(group.name)" :class="cn('mc-expanding-search__groupLabel', 'groupLabel')" role="presentation">{{ group.name }}</div>
        <TransitionGroup :css="false" @enter="enterItem" @leave="leaveOption">
          <div v-for="item in group.items" :id="optionId(item)" :key="item.id" role="option" :aria-selected="flat().indexOf(item) === activeIndex" :data-active="flat().indexOf(item) === activeIndex || undefined" :class="cn('mc-expanding-search__option', 'option')" @pointermove="() => { if (flat().indexOf(item) !== activeIndex) { keyboard.current = false; emit('hover', flat().indexOf(item)); } }" @mousedown.prevent @click="emit('choose', item)">
            <span v-if="flat().indexOf(item) === activeIndex" data-highlight :class="cn('mc-expanding-search__highlight', 'highlight')" aria-hidden="true" />
            <span v-if="item.icon" :class="cn('mc-expanding-search__optionIcon', 'optionIcon')" aria-hidden="true"><component :is="item.icon" :size="16" /></span>
            <span :class="cn('mc-expanding-search__optionText', 'optionText')">
              <span :class="cn('mc-expanding-search__optionTitle', 'optionTitle')"><template v-if="splitMatch(item.title, query)">{{ splitMatch(item.title, query)![0] }}<mark :class="cn('mc-expanding-search__mark', 'mark')">{{ splitMatch(item.title, query)![1] }}</mark>{{ splitMatch(item.title, query)![2] }}</template><template v-else>{{ item.title }}</template></span>
              <span v-if="item.meta" :class="cn('mc-expanding-search__optionMeta', 'optionMeta')">{{ item.meta }}</span>
            </span>
          </div>
        </TransitionGroup>
      </div>
    </TransitionGroup>
  </div>
</template>
