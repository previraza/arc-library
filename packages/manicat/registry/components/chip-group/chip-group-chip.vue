<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createChipBody } from "@/lib/chip-group";

const props = defineProps<{ option: { value: string; label: string }; selected: boolean; tabbable: boolean; delay: number; classNames?: { chip?: string; body?: string; surface?: string; check?: string; slot?: string; label?: string } }>();
const emit = defineEmits<{ toggle: [value: string]; focusChip: [value: string] }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const body = ref<HTMLElement>();
const surface = ref<HTMLElement>();
const check = ref<HTMLElement>();
const label = ref<HTMLElement>();
let chip: ReturnType<typeof createChipBody> | undefined;
const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

onMounted(() => (chip = createChipBody({ body: body.value!, surface: surface.value!, label: label.value!, check: check.value, path: check.value?.querySelector("path") }, { selected: props.selected, reduced })));
onBeforeUnmount(() => chip?.destroy());
watch(() => props.selected, (next) => chip?.update(next), { flush: "post" });
</script>

<template>
  <button type="button" :class="cn('mc-chip-group__chip', classNames?.chip)" :data-chip="option.value" :data-delay="delay" :aria-pressed="selected" :tabindex="tabbable ? 0 : -1" @click="emit('toggle', option.value)" @focus="emit('focusChip', option.value)">
    <span ref="body" :class="cn('mc-chip-group__body', classNames?.body)" :data-selected="selected">
      <span ref="surface" :class="cn('mc-chip-group__surface', classNames?.surface)" aria-hidden="true" />
      <span ref="check" class="mc-chip-group__check" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg></span>
      <span class="mc-chip-group__slot" aria-hidden="true" />
      <span ref="label" :class="cn('mc-chip-group__label', classNames?.label)">{{ option.label }}</span>
    </span>
  </button>
</template>
