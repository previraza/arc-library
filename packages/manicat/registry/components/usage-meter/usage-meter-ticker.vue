<script setup lang="ts">
// @manicat-dependencies motion
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createCounter } from "@/lib/counter";

/** A number that rolls to each new value. It is decoration over text that screen readers get elsewhere. */
const props = defineProps<{ value: number; decimals: number; classNames?: Record<string, string | undefined> }>();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = ref<HTMLElement>();
let counter: ReturnType<typeof createCounter> | undefined;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const options = () => ({
  value: props.value,
  prefix: "",
  suffix: "",
  decimals: props.decimals,
  locale: "en-US",
  animateOnView: false,
  reduced,
  hideOffWheel: false,
  classes: { value: "", symbol: cn("mc-usage-meter__symbol", "symbol"), column: cn("mc-usage-meter__column", "column"), glyph: cn("mc-usage-meter__glyph", "glyph"), sizer: "mc-usage-meter__sizer" },
});
onMounted(() => (counter = createCounter(host.value!, document.createElement("span"), options())));
watch(() => [props.value, props.decimals], () => counter?.update(options()));
onBeforeUnmount(() => counter?.destroy());
</script>

<template>
  <span ref="host" :class="cn('mc-usage-meter__ticker', 'ticker')" aria-hidden="true" />
</template>
