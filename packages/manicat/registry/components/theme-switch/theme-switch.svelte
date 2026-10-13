<script lang="ts" module>
  export type ThemeSwitchVariant = "reveal" | "eclipse" | "split" | "rise";
  export type Theme = "light" | "dark";
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import { Moon, Sun } from "@lucide/svelte";
  import Button from "@/registry/components/button/button.svelte";
  import { curveOf } from "@/lib/motion-dom";
  import type { Pose } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    theme: Theme;
    variant?: ThemeSwitchVariant;
    label?: string;
    iconOnly?: boolean;
    /** The next theme, the variant of the transition, and the button that was pressed. */
    onthemechange?: (next: Theme, variant: ThemeSwitchVariant, trigger: HTMLElement) => void;
    /** Extend the inner, named parts of the theme switch: iconWrap, icon or label. */
    classNames?: { iconWrap?: string; icon?: string; label?: string };
  }

  let { theme = $bindable(), variant = "reveal", label, iconOnly = false, onthemechange, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A stored preference usually reaches the theme just after hydration. That correction swaps the icon in place;
  // only changes after the first painted frames animate, so a page that loads in dark mode never spins its switches.
  let settled = $state(false);
  onMount(() => {
    let second = 0;
    const first = requestAnimationFrame(() => (second = requestAnimationFrame(() => (settled = true))));
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  });

  const cn = (base: string, ...extra: (string | false | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
  const next = $derived<Theme>(theme === "light" ? "dark" : "light");

  // Both icons turn the same way (clockwise into dark, back out of it), so the swap reads as one rotation rather than two fades.
  function icon(node: HTMLElement, { out = false }: { out?: boolean }) {
    const off: Pose = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, rotate: node.dataset.theme === "light" ? 30 : -30, blur: motionTokens.blur.subtle };
    const timing = reduced ? curveOf({ duration: motionTokens.duration.instant }) : out ? curveOf({ duration: motionTokens.duration.fast, ease: "standard" }) : curveOf({ spring: "snappy" });
    return {
      duration: settled ? timing.duration : 0,
      easing: timing.easing,
      css: (t: number) => {
        const lerp = (a: number | undefined, b: number, f: number) => (a ?? f) + (b - (a ?? f)) * t;
        return `opacity: ${lerp(off.opacity, 1, 1)}; transform: rotate(${lerp(off.rotate, 0, 0)}deg) scale(${lerp(off.scale, 1, 1)}); filter: blur(${lerp(off.blur, 0, 0)}px);`;
      },
    };
  }

  function press(event: MouseEvent) {
    onthemechange?.(next, variant, event.currentTarget as HTMLElement);
    theme = next;
  }
</script>

<Button type="button" size="sm" variant="secondary" class={cn("mc-theme-switch__themeSwitch", `mc-theme-switch__${variant}`, iconOnly && "mc-theme-switch__iconOnly", settled && "mc-theme-switch__settled")} data-theme={theme} aria-label={label ?? `Switch to ${next} mode`} aria-pressed={theme === "dark"} onclick={press}>
  <span class={["mc-theme-switch__iconWrap", classNames?.iconWrap]}>
    {#key theme}
      <span data-theme={theme} class={["mc-theme-switch__icon", classNames?.icon]} aria-hidden="true" in:icon={{}} out:icon={{ out: true }}>
        {#if theme === "light"}<Sun size={16} strokeWidth={1.75} />{:else}<Moon size={16} strokeWidth={1.75} />{/if}
      </span>
    {/key}
  </span>
  {#if !iconOnly}<span class={["mc-theme-switch__label", classNames?.label]}>Switch theme</span>{/if}
</Button>

<style>
:global {
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
}
</style>
