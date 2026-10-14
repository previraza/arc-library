<script setup lang="ts">
// @manicat-dependencies motion
import { onMounted, ref, watch } from "vue";
import { animateCheckbox, checkboxPath } from "@/lib/motion-dom";

/** The checkbox of a row: a real input under a drawn box whose fill springs in and whose check morphs into a dash. */
const props = defineProps<{ checked: boolean; mixed?: boolean; label: string; nav: "head" | "row" }>();
const emit = defineEmits<{ toggle: [extend: boolean] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const input = ref<HTMLInputElement>();
const fill = ref<HTMLElement>();
const path = ref<SVGPathElement>();
const state = () => (props.mixed ? "indeterminate" : props.checked);
onMounted(() => {
  input.value!.indeterminate = Boolean(props.mixed);
  animateCheckbox({ fill: fill.value!, path: path.value! }, state(), { reduced, animated: false });
});
watch(() => [props.checked, props.mixed], () => {
  input.value!.indeterminate = Boolean(props.mixed);
  animateCheckbox({ fill: fill.value!, path: path.value! }, state(), { reduced, animated: true });
}, { flush: "post" });
defineExpose({ input });
</script>

<template>
  <label class="mc-sortable-data-table__selectHit">
    <input ref="input" type="checkbox" class="mc-sortable-data-table__selectInput" :checked="checked" :aria-label="label" :data-nav="nav" @click="emit('toggle', ($event as MouseEvent).shiftKey === true)" />
    <span class="mc-sortable-data-table__selectBox" :data-on="checked || mixed || undefined" aria-hidden="true">
      <span ref="fill" class="mc-sortable-data-table__selectFill" />
      <svg class="mc-sortable-data-table__selectMark" viewBox="0 0 18 18" fill="none" focusable="false">
        <path ref="path" :d="checkboxPath" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </label>
</template>
