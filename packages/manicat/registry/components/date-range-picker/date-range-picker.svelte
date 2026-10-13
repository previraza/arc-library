<script lang="ts" module>
  export interface DateRange {
    start: Date;
    end: Date;
  }

  export interface DateRangePreset {
    label: string;
    range: (today: Date) => DateRange;
  }
</script>

<script lang="ts">
  import Calendar from "@/registry/components/date-range-picker/range-calendar.svelte";
  import { addDays, startOfDay, startOfMonth } from "@/lib/calendar";

  const defaultPresets: DateRangePreset[] = [
    { label: "Last 7 days", range: (today) => ({ start: addDays(startOfDay(today), -6), end: startOfDay(today) }) },
    { label: "Last 30 days", range: (today) => ({ start: addDays(startOfDay(today), -29), end: startOfDay(today) }) },
    { label: "This month", range: (today) => ({ start: startOfMonth(today), end: startOfDay(today) }) },
  ];

  interface Props {
    label?: string;
    placeholder?: string;
    presets?: DateRangePreset[];
    minDate?: Date;
    maxDate?: Date;
    weekStartsOn?: 0 | 1;
    locale?: string;
    /** The range. Two clicks pick it: the start, then the end. Bind it with `bind:value`. */
    value?: DateRange | null;
    /** Extend the inner, named parts of the picker: trigger, popover or preset. */
    classNames?: { trigger?: string; popover?: string; preset?: string };
  }

  let { label = "Date range", placeholder = "Select a range", presets = defaultPresets, minDate, maxDate, weekStartsOn = 0, locale = "en-US", value = $bindable(null), classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let anchor = $state<Date | null>(null);
  let hover = $state<Date | null>(null);
  let month = $state(startOfMonth(new Date()));
  const short = (date: Date) => date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  // While the second click is pending, the range follows the pointer.
  const preview = $derived(anchor ? { start: anchor, end: hover && hover >= anchor ? hover : anchor } : (value ?? undefined));

  function commit(range: DateRange) {
    value = range;
    anchor = null;
    hover = null;
    open = false;
  }

  function pick(date: Date | undefined) {
    if (!date) return;
    if (!anchor) {
      anchor = date;
      return;
    }
    commit(date < anchor ? { start: date, end: anchor } : { start: anchor, end: date });
  }

  function toggle() {
    open = !open;
    if (open) month = startOfMonth(value?.start ?? new Date());
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) {
      open = false;
      anchor = null;
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      anchor = null;
    }
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-range" role="presentation" onkeydown={onKeydown}>
  <span id="{id}-label" class="mc-range__label">{label}</span>
  <div class="mc-range__anchor">
    <button type="button" class={["mc-range__trigger", classNames?.trigger]} aria-labelledby="{id}-label" aria-haspopup="dialog" aria-expanded={open} onclick={toggle}>
      <span class={{ "mc-range__placeholder": !value }}>{value ? `${short(value.start)} – ${short(value.end)}` : placeholder}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    </button>
    {#if open}
      <div role="dialog" aria-label="Choose date range" class={["mc-range__popover", classNames?.popover]}>
        <div class="mc-range__presets">
          {#each presets as preset (preset.label)}
            <button type="button" class={["mc-range__preset", classNames?.preset]} onclick={() => commit(preset.range(new Date()))}>{preset.label}</button>
          {/each}
        </div>
        <p class="mc-range__hint">{anchor ? "Choose the end date" : "Choose the start date"}</p>
        <Calendar bind:month bind:value={() => undefined, pick} {locale} {weekStartsOn} {minDate} {maxDate} range={preview} onhover={(date) => (hover = date)} />
      </div>
    {/if}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-range { display: grid; gap: var(--space-2); min-width: 0; }
.mc-range__label { font-size: var(--text-sm); font-weight: 500; }
.mc-range__anchor { position: relative; }
.mc-range__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-range__trigger:hover { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-range__trigger[aria-expanded="true"], .mc-range__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-range__placeholder { color: var(--text-muted); }
.mc-range__popover { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; width: min(22rem, calc(100vw - 2rem)); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-range-in .18s var(--ease-enter) both; }
.mc-range__presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--space-3); }
.mc-range__preset { padding: 4px 12px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-range__preset:hover { background: var(--surface-muted); } }
.mc-range__hint { margin: 0 0 4px; color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-range-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-range__popover { animation: none; } }
}
</style>
