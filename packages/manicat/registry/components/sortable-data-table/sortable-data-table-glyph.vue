<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onMounted, ref, watch } from "vue";
import { ArrowUp } from "lucide-vue-next";
import { createSortGlyph } from "@/lib/sortable-data-table";

/** The arrow fades in where a column becomes sorted and flips on a spring when the direction changes. */
const props = defineProps<{ active: boolean; descending: boolean }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const arrow = ref<HTMLElement>();
let update: ReturnType<typeof createSortGlyph> | undefined;
onMounted(() => (update = createSortGlyph(arrow.value!, { active: props.active, descending: props.descending, reduced })));
watch(() => [props.active, props.descending], () => update?.({ active: props.active, descending: props.descending }), { flush: "post" });
</script>

<template>
  <span class="mc-sortable-data-table__sortIcon" aria-hidden="true">
    <ArrowUp class="mc-sortable-data-table__sortHint" :size="16" :stroke-width="1.75" />
    <span ref="arrow" class="mc-sortable-data-table__sortArrow"><ArrowUp :size="16" :stroke-width="1.75" /></span>
  </span>
</template>
