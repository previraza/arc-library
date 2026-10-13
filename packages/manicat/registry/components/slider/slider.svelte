<script lang="ts">
  interface Props {
    label: string;
    min?: number;
    max?: number;
    step?: number;
    /** Step for Page Up and Page Down. */
    largeStep?: number;
    format?: (value: number) => string;
    showValue?: boolean;
    disabled?: boolean;
    /** A number for one thumb, or a `[low, high]` pair for a range. Bind it with `bind:value`. */
    value?: number | [number, number];
    /** Called when a change is final: a key press or the end of a drag. */
    oncommit?: (value: number | [number, number]) => void;
    /** Extend the inner, named parts of the slider: head, track, range or thumb. */
    classNames?: { head?: string; track?: string; range?: string; thumb?: string };
  }

  let { label, min = 0, max = 100, step = 1, largeStep, format, showValue = true, disabled = false, value = $bindable(0), oncommit, classNames }: Props = $props();

  const id = $props.id();
  let track = $state<HTMLElement>();
  let active = $state<0 | 1>(1);

  const range = $derived(Array.isArray(value));
  const thumbs = $derived<(0 | 1)[]>(range ? [0, 1] : [1]);
  const low = $derived(Array.isArray(value) ? value[0] : min);
  const high = $derived(Array.isArray(value) ? value[1] : value);
  const fmt = (n: number) => (format ? format(n) : String(n));
  const pct = (n: number) => ((n - min) / Math.max(1, max - min)) * 100;
  const snap = (n: number) => Math.max(min, Math.min(max, Math.round((n - min) / step) * step + min));

  function set(thumb: 0 | 1, next: number, commit = false) {
    const snapped = snap(next);
    const result: number | [number, number] = range ? (thumb === 0 ? [Math.min(snapped, high), high] : [low, Math.max(snapped, low)]) : snapped;
    value = result;
    if (commit) oncommit?.(result);
  }

  function at(event: PointerEvent) {
    const box = track!.getBoundingClientRect();
    return min + Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * (max - min);
  }

  function down(event: PointerEvent) {
    if (disabled) return;
    const next = at(event);
    active = range && Math.abs(next - low) < Math.abs(next - high) ? 0 : 1;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    set(active, next);
  }

  function move(event: PointerEvent) {
    if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) set(active, at(event));
  }

  function up(event: PointerEvent) {
    if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) set(active, at(event), true);
  }

  function onKeydown(event: KeyboardEvent, thumb: 0 | 1) {
    const current = thumb === 0 ? low : high;
    const big = largeStep ?? step * 10;
    const next = { ArrowRight: current + step, ArrowUp: current + step, ArrowLeft: current - step, ArrowDown: current - step, PageUp: current + big, PageDown: current - big, Home: min, End: max }[event.key as "Home"];
    if (next === undefined) return;
    event.preventDefault();
    set(thumb, next, true);
  }
</script>

<div class="mc-slider" data-disabled={disabled || undefined}>
  <div class={["mc-slider__head", classNames?.head]}>
    <span id="{id}-label" class="mc-slider__label">{label}</span>
    {#if showValue}<span class="mc-slider__value">{range ? `${fmt(low)} – ${fmt(high)}` : fmt(high)}</span>{/if}
  </div>
  <div bind:this={track} class="mc-slider__hit" role="presentation" onpointerdown={down} onpointermove={move} onpointerup={up}>
    <div class={["mc-slider__track", classNames?.track]}>
      <div class={["mc-slider__range", classNames?.range]} style="left: {range ? pct(low) : 0}%; width: {pct(high) - (range ? pct(low) : 0)}%"></div>
    </div>
    {#each thumbs as thumb (thumb)}
      <span
        role="slider"
        class={["mc-slider__thumb", classNames?.thumb]}
        tabindex={disabled ? -1 : 0}
        aria-labelledby="{id}-label"
        aria-valuemin={thumb === 1 && range ? low : min}
        aria-valuemax={thumb === 0 && range ? high : max}
        aria-valuenow={thumb === 0 ? low : high}
        aria-valuetext={fmt(thumb === 0 ? low : high)}
        style="left: {pct(thumb === 0 ? low : high)}%"
        onkeydown={(event) => onKeydown(event, thumb)}
      ></span>
    {/each}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slider { display: grid; gap: var(--space-2); }
.mc-slider[data-disabled] { opacity: .5; pointer-events: none; }
.mc-slider__head { display: flex; justify-content: space-between; gap: var(--space-3); font-size: var(--text-sm); }
.mc-slider__label { font-weight: 500; }
.mc-slider__value { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.mc-slider__hit { position: relative; display: flex; align-items: center; height: 28px; margin: 0 12px; cursor: pointer; touch-action: none; }
.mc-slider__track { position: relative; width: 100%; height: 6px; border-radius: 3px; background: var(--control-track); }
.mc-slider__range { position: absolute; top: 0; bottom: 0; border-radius: inherit; background: var(--control-on); }
.mc-slider__thumb { position: absolute; top: 50%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--control-thumb); box-shadow: var(--control-thumb-shadow); transition: transform var(--duration-instant) var(--ease-standard); }
.mc-slider__thumb:active { transform: scale(1.08); }
.mc-slider__thumb:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .mc-slider__thumb { transition: none; } }
}
</style>
