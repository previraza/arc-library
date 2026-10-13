<script lang="ts">
  import { untrack } from "svelte";

  interface Props {
    value: number;
    label?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    locale?: string;
    /** Count up when the counter scrolls into view instead of on mount. */
    animateOnView?: boolean;
    /** Extend the inner, named parts of the counter: label or value. */
    classNames?: { label?: string; value?: string };
  }

  let { value, label, prefix = "", suffix = "", decimals = 0, locale = "en-US", animateOnView = false, classNames }: Props = $props();

  let shown = $state(0);
  let seen = $state(false);
  let frame = 0;

  function format(n: number) {
    return `${prefix}${n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }

  function run(to: number) {
    cancelAnimationFrame(frame);
    const from = untrack(() => shown);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      shown = from + (to - from) * (1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  // Counts on mount, or once the counter is seen, and again whenever the value changes.
  $effect(() => {
    const to = value;
    if (animateOnView && !seen) return;
    run(to);
    return () => cancelAnimationFrame(frame);
  });

  function watch(node: HTMLElement) {
    if (!animateOnView || typeof IntersectionObserver === "undefined") {
      seen = true;
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        seen = true;
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }
</script>

<div {@attach watch} class="mc-counter" role="group" aria-label="{label ? `${label}: ` : ''}{format(value)}">
  {#if label}<span class={["mc-counter__label", classNames?.label]}>{label}</span>{/if}
  <span class={["mc-counter__value", classNames?.value]} aria-hidden="true">{format(shown)}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-counter { display: grid; gap: 4px; }
.mc-counter__label { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-counter__value { font-size: var(--text-3xl); font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-display); }
}
</style>
