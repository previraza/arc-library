<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { inject, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import type { Component } from "vue";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from "reka-ui";
import { MoreHorizontal } from "lucide-vue-next";
import { ACTION, createSwipeRow, swipeGroupKey } from "@/lib/swipe-actions";
import type { Side, SwipeGroup } from "@/lib/swipe-actions";

export interface SwipeAction {
  label: string;
  /** The glyph drawn on the revealed action and in the More actions menu. */
  icon?: Component;
  /** Fill of the revealed action. Pair `danger` with a label that names the destructive result. */
  tone?: "neutral" | "accent" | "danger";
  /** Runs for a full swipe, a tap on the revealed action, or the More actions menu. Remove the item here unless `keepRow` is set. */
  onSelect: () => void;
  /** The row springs home after the action instead of sliding away and collapsing, for actions such as Mark as unread. */
  keepRow?: boolean;
}

defineOptions({ inheritAttrs: false });

/** One row. `leading` actions sit under the left edge and `trailing` actions under the right; the outermost action on each side commits on a full swipe. */
const props = withDefaults(
  defineProps<{
    /** Names the row in its menu button, for example the message subject. */
    label: string;
    leading?: SwipeAction[];
    trailing?: SwipeAction[];
    /** Lets a long swipe commit the outermost action without a tap. On by default. */
    fullSwipe?: boolean;
    /** Extend the inner, named parts of the row: row, content, more, menu, item or itemIcon. */
    classNames?: { row?: string; content?: string; more?: string; menu?: string; item?: string; itemIcon?: string };
  }>(),
  { leading: () => [], trailing: () => [], fullSwipe: true },
);

const attrs = useAttrs();
const group = inject<SwipeGroup>(swipeGroupKey)!;
const id = useId();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

const row = ref<HTMLElement>();
const content = ref<HTMLElement>();
const menuOpen = ref(false);
let focusNeighbour = false;
let controller: ReturnType<typeof createSwipeRow> | undefined;

const actionsOf = (side: Side) => (side === "leading" ? props.leading : props.trailing);
const menuItems = () => [...props.leading.map((action, index) => ({ action, side: "leading" as const, index })), ...props.trailing.map((action, index) => ({ action, side: "trailing" as const, index }))];

onMounted(() => {
  controller = createSwipeRow({ row: row.value!, content: content.value! }, { id, reduced, leading: () => props.leading, trailing: () => props.trailing, fullSwipe: () => props.fullSwipe, group });
});
onBeforeUnmount(() => controller?.destroy());
// Another row opened, or someone touched outside: put this one away.
watch(() => group.openId(), () => controller?.closeForOthers());
watch([() => props.leading, () => props.trailing], () => nextTick(() => controller?.repaint()));

function onCloseAutoFocus(event: Event) {
  if (!focusNeighbour) return;
  focusNeighbour = false;
  event.preventDefault();
  controller?.focusNeighbour();
}
function onItemSelect(action: SwipeAction, side: Side, index: number) {
  focusNeighbour = !action.keepRow;
  controller?.commit(side, index);
}
</script>

<template>
  <li ref="row" v-bind="{ ...attrs, class: undefined }" :class="cn('mc-swipe-actions__row', attrs.class as string | undefined, classNames?.row)" :style="{ '--swipe-action-width': `${ACTION}px` }">
    <template v-for="side in (['leading', 'trailing'] as const)" :key="side">
      <button v-for="(action, index) in actionsOf(side)" :key="`${side}-${index}`" type="button" tabindex="-1" aria-hidden="true" class="mc-swipe-actions__layer" data-layer :data-side="side" :data-index="index" :data-tone="action.tone ?? 'neutral'" @click="controller?.commit(side, index)">
        <span class="mc-swipe-actions__anchor">
          <span class="mc-swipe-actions__glyph">
            <span class="mc-swipe-actions__icon"><component :is="action.icon" v-if="action.icon" /></span>
            <span class="mc-swipe-actions__label">{{ action.label }}</span>
          </span>
        </span>
      </button>
    </template>
    <div ref="content" :class="cn('mc-swipe-actions__content', classNames?.content)">
      <div class="mc-swipe-actions__body"><slot /></div>
      <DropdownMenuRoot v-if="menuItems().length > 0" v-model:open="menuOpen">
        <DropdownMenuTrigger :class="cn('mc-swipe-actions__more', classNames?.more)" data-swipe-more="" :aria-label="`More actions for ${label}`" @click="(event: MouseEvent) => { if (event.detail > 0) menuOpen = !menuOpen; }">
          <MoreHorizontal :size="18" :stroke-width="1.75" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent :class="cn('mc-swipe-actions__menu', classNames?.menu)" align="end" :side-offset="6" :collision-padding="12" loop @close-auto-focus="onCloseAutoFocus">
            <DropdownMenuItem v-for="({ action, side, index }, order) in menuItems()" :key="`${side}-${index}`" :class="cn('mc-swipe-actions__item', classNames?.item)" :data-tone="action.tone" :style="{ '--i': order }" @select="onItemSelect(action, side, index)">
              <span :class="cn('mc-swipe-actions__itemIcon', classNames?.itemIcon)" aria-hidden="true"><component :is="action.icon" v-if="action.icon" /></span>{{ action.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </li>
</template>
