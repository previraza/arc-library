// @manicat-dependencies motion
/**
 * The motion of the gauge, for the Vue and Svelte ports: the ring fills once it is seen and springs to each new value with a little
 * life, the count follows without overshooting, and the state (color and label) changes exactly as the count crosses a threshold.
 * The counterpart of the effects in gauge.tsx. The framework renders the markup; this paints the arc, the digits, the tone and the state.
 */
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { motionTokens } from "./motion-tokens";

export type GaugeTone = "accent" | "success" | "warning" | "danger";
export interface GaugeThreshold {
  from: number;
  tone: GaugeTone;
  label: string;
}

/** A 270 degree ring open at the bottom, drawn clockwise from its lower left end. Redrawn from the sweep every frame so the round cap stays exact. */
const radius = 42;
const start = -135;
const span = 270;
export function arcFor(sweep: number) {
  const end = start + span * Math.min(1, Math.max(0, sweep));
  const at = (angle: number) => `${(50 + radius * Math.sin((angle * Math.PI) / 180)).toFixed(3)} ${(50 - radius * Math.cos((angle * Math.PI) / 180)).toFixed(3)}`;
  return `M ${at(start)} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${at(end)}`;
}
export const gaugeTrack = arcFor(1);

/** The first fill is slower and never overshoots, like a ring closing when the view opens. */
const reveal = { ...motionTokens.spring.smooth, visualDuration: motionTokens.duration.considered * 1.6 };

export interface GaugeParts {
  figure: HTMLElement;
  arc: SVGPathElement;
  digits: HTMLElement;
  sizer: HTMLElement;
  /** The element that holds the state label, when there are thresholds. */
  status?: HTMLElement;
}

export interface GaugeOptions {
  value: number;
  min: number;
  max: number;
  tone: GaugeTone;
  thresholds?: GaugeThreshold[];
  reduced: boolean;
  /** Class names of the tones, such as `mc-gauge__success`. */
  toneClass: (tone: GaugeTone) => string;
  /** Called with the direction the value moved (1 up, -1 down), so copy can enter from the side it moved toward. */
  onDirection?: (direction: number) => void;
}

export function createGauge(parts: GaugeParts, initial: GaugeOptions) {
  let options = initial;
  let sweep = 0;
  let count = 0;
  let filled = false;
  let seen = false;
  let current: GaugeThreshold | undefined;
  let shownValue: number | undefined;
  let running: AnimationPlaybackControls[] = [];
  let widthRun: AnimationPlaybackControls | undefined;
  let digitsWidth = 0;
  let measured: string | null = null;

  const derived = () => {
    const safeMax = options.max > options.min ? options.max : options.min + 1;
    const percentage = Math.min(1, Math.max(0, (options.value - options.min) / (safeMax - options.min)));
    const bands = [...(options.thresholds ?? [])].sort((a, b) => a.from - b.from);
    const bandAt = (at: number) => bands.filter((threshold) => at >= threshold.from - 1e-6).pop();
    return { safeMax, percentage, displayValue: Math.round(percentage * 100), bandAt, band: bandAt(options.value) };
  };

  const paint = () => {
    parts.arc.setAttribute("d", arcFor(sweep));
    parts.arc.style.opacity = String(Math.min(1, Math.max(0, sweep / 0.02)));
    parts.digits.textContent = String(Math.round(Math.min(100, Math.max(0, count))));
  };

  const present = () => {
    const { band } = derived();
    const shown = options.reduced || !filled ? band : current;
    const tone = shown?.tone ?? options.tone;
    const all: GaugeTone[] = ["accent", "success", "warning", "danger"];
    for (const name of all) parts.figure.classList.toggle(options.toneClass(name), name === tone);
    if (parts.status) parts.status.textContent = filled ? (shown?.label ?? "") : "";
  };

  const onCount = () => {
    const { bandAt, safeMax, percentage } = derived();
    const next = bandAt(options.min + (count / 100) * (safeMax - options.min));
    const changed = next?.from !== current?.from || next?.label !== current?.label;
    if (filled) {
      if (changed) {
        current = next;
        present();
      }
    } else if (seen && Math.abs(count - percentage * 100) < 1) {
      if (changed) current = next;
      filled = true;
      present();
    }
  };

  const run = () => {
    running.forEach((control) => control.stop());
    running = [];
    const { percentage } = derived();
    if (options.reduced) {
      sweep = percentage;
      count = percentage * 100;
      paint();
      requestAnimationFrame(() => {
        filled = true;
        present();
      });
      return;
    }
    if (!seen) return;
    running = [
      animate(sweep, percentage, { ...(filled ? motionTokens.spring.morph : reveal), onUpdate: (value: number) => ((sweep = value), paint()) }),
      animate(count, percentage * 100, {
        ...(filled ? motionTokens.spring.smooth : reveal),
        onUpdate: (value: number) => {
          count = value;
          paint();
          onCount();
        },
        onComplete: () => {
          filled = true;
          present();
        },
      }),
    ];
  };

  // The ring fills once it is seen.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || seen) return;
      seen = true;
      observer.disconnect();
      run();
    },
    { threshold: 0.5 },
  );
  observer.observe(parts.figure);

  // Digits are right aligned in a box sized to the target number, so the ones column never jumps while counting.
  const sizeObserver = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.inlineSize ?? parts.sizer.offsetWidth;
    widthRun?.stop();
    if (measured !== null && measured !== parts.sizer.textContent && !options.reduced) {
      widthRun = animate(digitsWidth, next, { ...motionTokens.spring.smooth, onUpdate: (value: number) => ((digitsWidth = value), (parts.digits.style.width = `${value}px`)) });
    } else {
      digitsWidth = next;
      parts.digits.style.width = `${next}px`;
    }
    measured = parts.sizer.textContent;
  });
  sizeObserver.observe(parts.sizer);

  const first = derived();
  shownValue = first.displayValue;
  current = first.band;
  paint();
  present();
  run();

  return {
    update(next: GaugeOptions) {
      options = next;
      const { displayValue } = derived();
      if (shownValue !== undefined && displayValue !== shownValue) options.onDirection?.(displayValue < shownValue ? -1 : 1);
      shownValue = displayValue;
      parts.sizer.textContent = String(displayValue);
      run();
      present();
    },
    destroy() {
      observer.disconnect();
      sizeObserver.disconnect();
      running.forEach((control) => control.stop());
      widthRun?.stop();
    },
  };
}
