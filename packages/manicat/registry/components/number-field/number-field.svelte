<script lang="ts" module>
  export type NumberFieldAffix = string | ((value: number) => string);
</script>

<script lang="ts">
  interface Props {
    label: string;
    min?: number;
    max?: number;
    step?: number;
    /** Step for Page Up and Page Down. */
    largeStep?: number;
    description?: string;
    disabled?: boolean;
    prefix?: NumberFieldAffix;
    suffix?: NumberFieldAffix;
    locale?: string;
    /** The number. Bind it with `bind:value`. */
    value?: number;
    /** Extend the inner, named parts of the number field: shell, input, button or hint. */
    classNames?: { shell?: string; input?: string; button?: string; hint?: string };
  }

  let { label, min = -Infinity, max = Infinity, step = 1, largeStep, description, disabled = false, prefix, suffix, locale = "en-US", value = $bindable(0), classNames }: Props = $props();

  const id = $props.id();
  let draft = $state<string | null>(null);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const affix = (entry: NumberFieldAffix | undefined) => (typeof entry === "function" ? entry(value) : (entry ?? ""));
  const text = $derived(draft ?? value.toLocaleString(locale));

  function set(next: number) {
    value = clamp(Number.isFinite(next) ? next : value);
  }

  function commit() {
    if (draft !== null) set(Number(draft.replace(/[^0-9.\-]/g, "")));
    draft = null;
  }

  function onKeydown(event: KeyboardEvent) {
    const big = largeStep ?? step * 10;
    const delta = { ArrowUp: step, ArrowDown: -step, PageUp: big, PageDown: -big }[event.key as "ArrowUp"];
    if (event.key === "Home" && Number.isFinite(min)) set(min);
    else if (event.key === "End" && Number.isFinite(max)) set(max);
    else if (event.key === "Enter") commit();
    else if (delta !== undefined) set(value + delta);
    else return;
    event.preventDefault();
  }
</script>

<div class="mc-number" data-disabled={disabled || undefined}>
  <label for={id} class="mc-number__label">{label}</label>
  <div class={["mc-number__shell", classNames?.shell]}>
    <button type="button" class={["mc-number__button", classNames?.button]} aria-label="Decrease {label}" disabled={disabled || value <= min} tabindex="-1" onclick={() => set(value - step)}>−</button>
    <span class="mc-number__center">
      {#if affix(prefix)}<span class="mc-number__affix">{affix(prefix)}</span>{/if}
      <input
        {id}
        value={text}
        role="spinbutton"
        inputmode="decimal"
        aria-valuenow={value}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        {disabled}
        class={["mc-number__input", classNames?.input]}
        oninput={(event) => (draft = event.currentTarget.value)}
        onblur={commit}
        onkeydown={onKeydown}
      />
      {#if affix(suffix)}<span class="mc-number__affix">{affix(suffix)}</span>{/if}
    </span>
    <button type="button" class={["mc-number__button", classNames?.button]} aria-label="Increase {label}" disabled={disabled || value >= max} tabindex="-1" onclick={() => set(value + step)}>+</button>
  </div>
  {#if description}<span class={["mc-number__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-number { display: grid; gap: var(--space-2); min-width: 0; }
.mc-number[data-disabled] { opacity: .5; }
.mc-number__label { font-size: var(--text-sm); font-weight: 500; }
.mc-number__shell { display: flex; align-items: center; min-height: var(--control-height-md); overflow: hidden; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-number__shell:focus-within { border-color: var(--foreground); }
.mc-number__button { display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: 18px; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-number__button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); } }
.mc-number__button:disabled { opacity: .4; cursor: not-allowed; }
.mc-number__center { display: flex; flex: 1; align-items: center; justify-content: center; gap: 2px; }
.mc-number__input { width: 6ch; min-width: 40px; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: center; }
.mc-number__affix { color: var(--text-muted); font-size: var(--text-sm); }
.mc-number__hint { color: var(--text-muted); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-number__shell { transition: none; } }
}
</style>
