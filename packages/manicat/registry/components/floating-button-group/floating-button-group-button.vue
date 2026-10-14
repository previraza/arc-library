<script setup lang="ts">
// @manicat-dependencies motion
import { inject } from "vue";
import FloatingButtonGroupBody from "@/registry/components/floating-button-group/floating-button-group-body.vue";
import { groupKey } from "@/lib/floating-button-group";
import type { GroupContext } from "@/lib/floating-button-group";

defineOptions({ inheritAttrs: true });
const props = defineProps<{ action: { id: string; label: string; icon?: unknown; shortcut?: string; disabled?: boolean; pressed?: boolean; reserveLabels?: readonly string[] }; iconOnly: boolean }>();
const group = inject<GroupContext>(groupKey)!;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
</script>

<template>
  <button
    type="button"
    :class="cn('mc-floating-button-group__item', group.classNames()?.item)"
    data-fbg-item
    :data-fbg-item-id="action.id"
    :data-active="group.activeId() === action.id ? '' : undefined"
    :data-icon="action.icon ? '' : undefined"
    :data-icon-only="iconOnly ? '' : undefined"
    :aria-label="action.label"
    :aria-pressed="action.pressed === undefined ? undefined : action.pressed"
    :aria-disabled="action.disabled || undefined"
    :tabindex="group.tabStop() === action.id ? 0 : -1"
    @pointermove="(event) => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') group.hover(action.id); }"
    @pointerdown="(event) => { if (event.button === 0) group.press(action.id, !!action.disabled); }"
    @pointerup="group.release()"
    @pointercancel="group.release()"
    @pointerleave="group.release()"
    @keydown="(event) => { if ((event.key === 'Enter' || event.key === ' ') && !event.repeat && !action.disabled) group.press(action.id, false); }"
    @keyup="(event) => { if (event.key === 'Enter' || event.key === ' ') group.release(); }"
    @focus="group.focus($event, action.id)"
    @click="group.select(action.id)"
  >
    <FloatingButtonGroupBody :label="action.label" :icon="action.icon" :icon-only="iconOnly" :reserve="action.reserveLabels ?? []" :class-names="group.classNames()" />
  </button>
</template>
