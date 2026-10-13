<script setup lang="ts">
// @manicat-dependencies motion reka-ui
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { SwitchRoot } from "reka-ui";
import { createSwitchThumb } from "@/lib/motion-dom";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  name?: string;
  /** Extend the inner, named parts of the switch: track, thumb or label. */
  classNames?: { track?: string; thumb?: string; label?: string };
}>();

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const root = ref<InstanceType<typeof SwitchRoot>>();
const thumb = ref<HTMLElement>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let controller: ReturnType<typeof createSwitchThumb> | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

onMounted(() => {
  const el = root.value?.$el as HTMLElement;
  controller = createSwitchThumb(el, thumb.value!, { on: model.value, reduced, disabled: () => props.disabled === true });
});
watch(model, (value) => controller?.set(value));
onBeforeUnmount(() => controller?.destroy());
</script>

<template>
  <SwitchRoot ref="root" v-bind="{ ...attrs, class: undefined }" v-model="model" :disabled="disabled" :name="name" :class="cn('mc-switch__switch', attrs.class as string | undefined)" :aria-label="(attrs['aria-label'] as string | undefined) ?? label">
    <span :class="cn('mc-switch__track', classNames?.track)">
      <!-- The thumb stretches like a held finger and keeps its far edge anchored, then travels on a spring. -->
      <span ref="thumb" :class="cn('mc-switch__thumb', classNames?.thumb)" />
    </span>
    <span v-if="label" :class="cn('mc-switch__label', classNames?.label)">{{ label }}</span>
  </SwitchRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-switch__switch { display: inline-flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-3); padding: 0; border: 0; color: var(--foreground); background: transparent; font: inherit; font-size: var(--text-sm); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-switch__switch:disabled { cursor: not-allowed; opacity: .5; }
/* Fixed box: the thumb moves inside it with transforms, so nothing around the switch shifts. The track crossfades between the two fills. */
.mc-switch__track { position: relative; box-sizing: border-box; display: flex; flex: 0 0 auto; width: 42px; height: 24px; align-items: center; padding: 3px; border-radius: var(--radius-pill); background: var(--control-track); isolation: isolate; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-switch__track::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--control-on); opacity: 0; transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-switch__switch[data-state="checked"] .mc-switch__track::before { opacity: 1; }
.mc-switch__thumb { flex: 0 0 auto; width: 18px; height: 18px; border-radius: var(--radius-pill); background: var(--control-thumb); box-shadow: var(--control-thumb-shadow); will-change: transform; transition: background-color var(--duration-standard) var(--ease-standard); }
.mc-switch__switch[data-state="checked"] .mc-switch__thumb { background: var(--control-thumb-on); }
@media (hover: hover) and (pointer: fine) { .mc-switch__switch[data-state="unchecked"]:hover:not(:disabled) .mc-switch__track { background: var(--control-track-hover); } }
.mc-switch__switch:focus-visible { outline: none; }
.mc-switch__label { line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-switch__track, .mc-switch__track::before, .mc-switch__thumb { transition: none; } }
</style>
