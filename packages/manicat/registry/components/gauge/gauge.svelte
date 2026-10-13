<script lang="ts" module>
  export type GaugeTone = "accent" | "success" | "warning" | "danger";

  /** A band that starts at `from`: the highest band the value reaches sets the tone and names the state. */
  export interface GaugeThreshold {
    from: number;
    tone: GaugeTone;
    label: string;
  }
</script>

<script lang="ts">
  interface Props {
    value: number;
    min?: number;
    max?: number;
    label: string;
    detail?: string;
    tone?: GaugeTone;
    thresholds?: GaugeThreshold[];
    /** Extend the inner, named parts of the gauge: visual, readout, label or detail. */
    classNames?: { visual?: string; readout?: string; label?: string; detail?: string };
  }

  let { value, min = 0, max = 100, label, detail, tone: baseTone = "accent", thresholds, classNames }: Props = $props();

  const clamped = $derived(Math.max(min, Math.min(max, value)));
  const percent = $derived(max === min ? 0 : ((clamped - min) / (max - min)) * 100);
  const band = $derived(thresholds ? [...thresholds].sort((a, b) => a.from - b.from).filter((entry) => clamped >= entry.from).at(-1) : undefined);
  const tone = $derived(band?.tone ?? baseTone);

  // A 270° dial: the arc is drawn with a dash, so the fill animates with a plain CSS transition.
  const radius = 42;
  const full = 2 * Math.PI * radius;
  const arc = full * 0.75;
</script>

<div class="mc-gauge" role="meter" aria-label="{label}{band ? `, ${band.label}` : ''}" aria-valuemin={min} aria-valuemax={max} aria-valuenow={clamped} data-tone={tone}>
  <div class={["mc-gauge__visual", classNames?.visual]}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="mc-gauge__track" cx="50" cy="50" r={radius} stroke-dasharray="{arc} {full}" transform="rotate(135 50 50)" />
      <circle class="mc-gauge__fill" cx="50" cy="50" r={radius} stroke-dasharray="{(arc * percent) / 100} {full}" transform="rotate(135 50 50)" />
    </svg>
    <span class={["mc-gauge__readout", classNames?.readout]}>{Math.round(percent)}%</span>
  </div>
  <span class={["mc-gauge__label", classNames?.label]}>{label}</span>
  <span class={["mc-gauge__detail", classNames?.detail]}>{band?.label ?? detail}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-gauge { --mc-tone: var(--accent); display: grid; justify-items: center; gap: 2px; text-align: center; }
.mc-gauge[data-tone="success"] { --mc-tone: var(--success); } .mc-gauge[data-tone="warning"] { --mc-tone: var(--warning); } .mc-gauge[data-tone="danger"] { --mc-tone: var(--danger); }
.mc-gauge__visual { position: relative; width: 112px; height: 112px; }
.mc-gauge__visual svg { width: 100%; height: 100%; }
.mc-gauge circle { fill: none; stroke-width: 8; stroke-linecap: round; }
.mc-gauge__track { stroke: var(--surface-muted); }
.mc-gauge__fill { stroke: var(--mc-tone); transition: stroke-dasharray .6s var(--ease-standard), stroke var(--duration-standard) var(--ease-standard); }
.mc-gauge__readout { position: absolute; inset: 0; display: grid; place-items: center; font-size: var(--text-xl); font-weight: 600; font-variant-numeric: tabular-nums; }
.mc-gauge__label { font-size: var(--text-sm); font-weight: 500; }
.mc-gauge__detail { color: var(--text-muted); font-size: var(--text-xs); }
.mc-gauge[data-tone="danger"] .mc-gauge__detail, .mc-gauge[data-tone="warning"] .mc-gauge__detail { color: var(--mc-tone); }
@media (prefers-reduced-motion: reduce) { .mc-gauge__fill { transition: none; } }
}
</style>
