<script lang="ts" module>
  export type { GaugeThreshold } from "@/lib/gauge";
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createLabelSwap } from "@/lib/motion-dom";
  import { createGauge, gaugeTrack } from "@/lib/gauge";
  import type { GaugeThreshold, GaugeTone } from "@/lib/gauge";

  interface Props {
    value: number;
    min?: number;
    max?: number;
    label: string;
    detail?: string;
    tone?: GaugeTone;
    /** A band that starts at `from`: the highest band the value reaches sets the tone and names the state, so it never rests on color alone. */
    thresholds?: GaugeThreshold[];
    /** Extend the inner, named parts of the gauge: visual, readout, number, unit, sizer, status or detail. */
    classNames?: { visual?: string; readout?: string; number?: string; unit?: string; sizer?: string; status?: string; detail?: string };
  }

  let { value, min = 0, max = 100, label, detail, tone = "accent", thresholds, classNames }: Props = $props();

  const safeMax = $derived(max > min ? max : min + 1);
  const percentage = $derived(Math.min(1, Math.max(0, (value - min) / (safeMax - min))));
  const displayValue = $derived(Math.round(percentage * 100));
  const band = $derived([...(thresholds ?? [])].sort((a, b) => a.from - b.from).filter((threshold) => value >= threshold.from - 1e-6).pop());

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let figure: HTMLElement;
  let arc: SVGPathElement;
  let digits: HTMLElement;
  let sizer: HTMLElement;
  let status: HTMLElement | undefined = $state();
  let labelText: HTMLElement;
  let detailText: HTMLElement | undefined = $state();
  let direction = 1;
  let gauge: ReturnType<typeof createGauge> | undefined;

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
  const options = () => ({ value, min, max, tone, thresholds, reduced, toneClass: (name: GaugeTone) => `mc-gauge__${name}`, onDirection: (next: number) => (direction = next) });

  onMount(() => {
    const statusText = status?.querySelector<HTMLElement>(".mc-gauge__text") ?? undefined;
    gauge = createGauge({ figure, arc, digits, sizer, status: statusText }, options());
    // Label, status and detail copy swap in place: the outgoing line is popped out of flow while the new one rises in.
    const swaps = ([[labelText, () => 1], [detailText, () => direction], [statusText, () => direction]] as const).flatMap(([text, dir]) => {
      const box = text?.parentElement;
      return text && box ? [createLabelSwap(box, box, text, { reduced, width: false, variant: "rise", direction: dir })] : [];
    });
    return () => {
      gauge?.destroy();
      swaps.forEach((swap) => swap.destroy());
    };
  });
  $effect(() => {
    void [value, min, max, tone, thresholds];
    gauge?.update(options());
  });
</script>

<figure bind:this={figure} class={["mc-gauge__figure", `mc-gauge__${tone}`]} aria-label={`${label}: ${value} of ${safeMax}${band ? `, ${band.label}` : ""}`}>
  <div class={["mc-gauge__visual", classNames?.visual]} role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={safeMax} aria-valuenow={Math.min(safeMax, Math.max(min, value))} aria-valuetext={`${displayValue}%${band ? `, ${band.label}` : ""}`}>
    <svg viewBox="0 0 100 90" aria-hidden="true" focusable="false"><path class="mc-gauge__track" d={gaugeTrack} /><path bind:this={arc} class="mc-gauge__arc" /></svg>
    <div class={["mc-gauge__readout", classNames?.readout]} aria-hidden="true">
      <span class={["mc-gauge__number", classNames?.number]}><span bind:this={digits} class="mc-gauge__digits"></span><span class={["mc-gauge__unit", classNames?.unit]}>%</span><span bind:this={sizer} class={["mc-gauge__sizer", classNames?.sizer]}>{displayValue}</span></span>
      {#if thresholds}<span bind:this={status} class={["mc-gauge__status", classNames?.status]}><span class="mc-gauge__swap"><span class="mc-gauge__text"></span></span></span>{/if}
    </div>
  </div>
  <figcaption>
    <strong><span class="mc-gauge__swap"><span bind:this={labelText} class="mc-gauge__text">{label}</span></span></strong>
    {#if detail}<span class={["mc-gauge__detail", classNames?.detail]}><span class="mc-gauge__swap"><span bind:this={detailText} class="mc-gauge__text">{detail}</span></span></span>{/if}
  </figcaption>
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-gauge__figure { display: grid; justify-items: center; min-width: 0; gap: 10px; margin: 0; text-align: center; }.mc-gauge__figure figcaption { display: grid; gap: 3px; min-width: 0; }.mc-gauge__figure strong { font-size: var(--text-sm); font-weight: 500; }.mc-gauge__detail { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-gauge__accent { --gauge-color: var(--accent); --gauge-text: var(--accent-strong); }.mc-gauge__success { --gauge-color: var(--success); --gauge-text: var(--success); }.mc-gauge__warning { --gauge-color: var(--warning); --gauge-text: var(--warning); }.mc-gauge__danger { --gauge-color: var(--danger); --gauge-text: var(--danger); }

/* An activity style ring: a thick stroke with round caps over a faint tint of its own color. The stroke scales with the ring. */
.mc-gauge__visual { position: relative; width: min(100%, 176px); aspect-ratio: 100 / 90; }
.mc-gauge__visual svg { display: block; width: 100%; height: 100%; overflow: visible; }
.mc-gauge__track, .mc-gauge__arc { fill: none; stroke-width: 9; stroke-linecap: round; transition: stroke var(--duration-standard) var(--ease-standard); }
.mc-gauge__track { stroke: color-mix(in oklab, var(--gauge-color) 13%, transparent); }
.mc-gauge__arc { stroke: var(--gauge-color); }

/* The readout sits on the ring's true centre, which is the middle of a square as wide as the ring. */
.mc-gauge__readout { position: absolute; top: 0; left: 0; display: grid; width: 100%; aspect-ratio: 1; place-content: center; justify-items: center; gap: 4px; pointer-events: none; }
.mc-gauge__number { position: relative; display: inline-flex; align-items: baseline; color: var(--foreground); font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 500; letter-spacing: var(--tracking-display); line-height: 1; font-variant-numeric: tabular-nums; }
.mc-gauge__digits { display: inline-flex; justify-content: flex-end; white-space: nowrap; }
.mc-gauge__unit { margin-left: 1px; color: var(--text-secondary); font-family: var(--font-body); font-size: .5em; letter-spacing: 0; }
.mc-gauge__sizer { position: absolute; top: 0; left: 0; visibility: hidden; white-space: nowrap; pointer-events: none; }
.mc-gauge__status { min-width: 100px; min-height: 1.4em; color: var(--gauge-text); font-size: var(--text-xs); font-weight: 500; line-height: 1.4; transition: color var(--duration-standard) var(--ease-standard); }

/* Label, status and detail copy swap in place: the outgoing line is popped out of flow while the new one rises in. */
.mc-gauge__swap { position: relative; display: block; }
.mc-gauge__swap > .mc-gauge__text { display: inline-block; }
@media (prefers-reduced-motion: reduce) { .mc-gauge__track, .mc-gauge__arc, .mc-gauge__status { transition: none; } }
}
</style>
