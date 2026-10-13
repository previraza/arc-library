<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import Button from "@/registry/components/button/button.vue";
import { playPose } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export type ThemeSwitchVariant = "reveal" | "eclipse" | "split" | "rise";
export type Theme = "light" | "dark";

const props = withDefaults(
  defineProps<{
    variant?: ThemeSwitchVariant;
    label?: string;
    iconOnly?: boolean;
    /** Extend the inner, named parts of the theme switch: iconWrap, icon or label. */
    classNames?: { iconWrap?: string; icon?: string; label?: string };
  }>(),
  { variant: "reveal", iconOnly: false },
);

const theme = defineModel<Theme>("theme", { required: true });
const emit = defineEmits<{
  /** The next theme, the variant of the transition, and the button that was pressed. */
  themeChange: [next: Theme, variant: ThemeSwitchVariant, trigger: HTMLElement];
}>();

const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// A stored preference usually reaches the theme just after hydration. That correction swaps the icon in place;
// only changes after the first painted frames animate, so a page that loads in dark mode never spins its switches.
const settled = ref(false);
let frames: number[] = [];
onMounted(() => {
  frames[0] = requestAnimationFrame(() => (frames[1] = requestAnimationFrame(() => (settled.value = true))));
});
onBeforeUnmount(() => frames.forEach(cancelAnimationFrame));

const cn = (base: string, ...extra: (string | false | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const next = () => (theme.value === "light" ? "dark" : "light");

// Both icons turn the same way (clockwise into dark, back out of it), so the swap reads as one rotation rather than two fades.
const rest = { opacity: 1, scale: 1, rotate: 0, blur: 0 };
const away = (el: Element) => ({ opacity: 0, scale: 0.7, rotate: (el as HTMLElement).dataset.theme === "light" ? 30 : -30, blur: motionTokens.blur.subtle });
function enter(el: Element, done: () => void) {
  if (!settled.value) return done();
  if (reduced) playPose(el, { opacity: 0 }, rest, { duration: motionTokens.duration.instant }).finished.then(done);
  else playPose(el, away(el), rest, { spring: "snappy" }).finished.then(done);
}
function leave(el: Element, done: () => void) {
  if (!settled.value) return done();
  playPose(el, rest, reduced ? { opacity: 0 } : away(el), { duration: reduced ? motionTokens.duration.instant : motionTokens.duration.fast, ease: "standard" }).finished.then(done);
}

function press(event: MouseEvent) {
  emit("themeChange", next(), props.variant, event.currentTarget as HTMLElement);
  theme.value = next();
}
</script>

<template>
  <Button
    type="button"
    size="sm"
    variant="secondary"
    :class="cn('mc-theme-switch__themeSwitch', `mc-theme-switch__${variant}`, iconOnly && 'mc-theme-switch__iconOnly', settled && 'mc-theme-switch__settled')"
    :data-theme="theme"
    :aria-label="label ?? `Switch to ${next()} mode`"
    :aria-pressed="theme === 'dark'"
    @click="press"
  >
    <span :class="cn('mc-theme-switch__iconWrap', classNames?.iconWrap)">
      <Transition :css="false" @enter="enter" @leave="leave">
        <span :key="theme" :data-theme="theme" :class="cn('mc-theme-switch__icon', classNames?.icon)" aria-hidden="true">
          <Sun v-if="theme === 'light'" :size="16" :stroke-width="1.75" />
          <Moon v-else :size="16" :stroke-width="1.75" />
        </span>
      </Transition>
    </span>
    <span v-if="!iconOnly" :class="cn('mc-theme-switch__label', classNames?.label)">Switch theme</span>
  </Button>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Each transition uses the same library Button, which owns the press scale; this file only animates the icon in place. */
.mc-theme-switch__themeSwitch {
  position: relative;
  width: auto;
  padding-inline: var(--space-3);
}
.mc-theme-switch__iconOnly { width: 38px; min-width: 38px; height: 38px; min-height: 38px; border-radius: 12px; padding: 0; }
@media (hover: hover) and (pointer: fine) {
  .mc-theme-switch__themeSwitch:hover:not(:disabled) { border-color: var(--border-strong); }
  .mc-theme-switch__iconOnly:hover:not(:disabled) { background: var(--surface-muted); box-shadow: none; }
}
.mc-theme-switch__iconWrap {
  position: relative;
  display: inline-grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
}
/* The nudge only eases once the switch has settled, so a theme that arrives during hydration lands without motion. */
.mc-theme-switch__settled .mc-theme-switch__iconWrap { transition: transform var(--duration-spring) var(--ease-spring); }
.mc-theme-switch__icon { position: absolute; display: grid; width: 18px; height: 18px; place-items: center; }
.mc-theme-switch__label { white-space: nowrap; }
/* Each variant nudges the icon the way its page transition travels, and eases back when the theme returns. */
.mc-theme-switch__themeSwitch.mc-theme-switch__reveal[data-theme="dark"] .mc-theme-switch__iconWrap { transform: scale(1.08); }
.mc-theme-switch__themeSwitch.mc-theme-switch__eclipse[data-theme="dark"] .mc-theme-switch__iconWrap { transform: translateX(-2px); }
.mc-theme-switch__themeSwitch.mc-theme-switch__split[data-theme="dark"] .mc-theme-switch__iconWrap { transform: translateX(1px); }
.mc-theme-switch__themeSwitch.mc-theme-switch__rise[data-theme="dark"] .mc-theme-switch__iconWrap { transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) {
  .mc-theme-switch__settled .mc-theme-switch__iconWrap { transition: none; }
}
</style>
