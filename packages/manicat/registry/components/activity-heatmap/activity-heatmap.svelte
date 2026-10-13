<script lang="ts" module>
  export interface ActivityDay {
    /** ISO date, "2026-05-04". */
    date: string;
    count: number;
  }
</script>

<script lang="ts">
  interface Props {
    days: ActivityDay[];
    label: string;
    period: string;
    unit?: { one: string; other: string };
    /** Counts at which the three darker levels start. */
    thresholds?: [number, number, number];
    weekStartsOn?: 0 | 1;
    locale?: string;
    /** The selected day. Bind it with `bind:selected`. */
    selected?: string | null;
    onselect?: (date: string) => void;
    /** Extend the inner, named parts of the heatmap: readout, cell or legend. */
    classNames?: { readout?: string; cell?: string; legend?: string };
  }

  let { days, label, period, unit = { one: "contribution", other: "contributions" }, thresholds = [1, 6, 14], weekStartsOn = 0, locale = "en-US", selected = $bindable(null), onselect, classNames }: Props = $props();

  let hover = $state<ActivityDay | null>(null);

  const sorted = $derived([...days].sort((a, b) => a.date.localeCompare(b.date)));
  const cells = $derived.by<(ActivityDay | null)[]>(() => {
    const first = sorted[0] ? new Date(`${sorted[0].date}T12:00:00`) : null;
    const lead = first ? (first.getDay() - weekStartsOn + 7) % 7 : 0;
    return [...Array<null>(lead).fill(null), ...sorted];
  });
  const total = $derived(sorted.reduce((sum, day) => sum + day.count, 0));
  const level = (count: number) => (count <= 0 ? 0 : count < thresholds[1] ? 1 : count < thresholds[2] ? 2 : count < thresholds[2] * 2 ? 3 : 4);
  const word = (n: number) => `${n} ${n === 1 ? unit.one : unit.other}`;
  const shown = $derived(hover ?? sorted.find((day) => day.date === selected) ?? null);
  const when = (day: ActivityDay) => new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  function pick(day: ActivityDay) {
    selected = day.date;
    onselect?.(day.date);
  }
</script>

<figure class="mc-heat">
  <figcaption class="mc-heat__title">{label}</figcaption>
  <p class={["mc-heat__readout", classNames?.readout]} aria-live="polite">{shown ? `${word(shown.count)} on ${when(shown)}` : `${word(total)} · ${period}`}</p>
  <div class="mc-heat__scroll">
    <div class="mc-heat__grid" role="grid" aria-label="{label}, {period}: {word(total)}">
      {#each cells as day, index (day?.date ?? `empty-${index}`)}
        {#if !day}
          <span class="mc-heat__cell mc-heat__cell--empty"></span>
        {:else}
          <button
            type="button"
            role="gridcell"
            class={["mc-heat__cell", classNames?.cell]}
            data-level={level(day.count)}
            aria-label="{day.date}, {word(day.count)}"
            aria-selected={selected === day.date}
            onclick={() => pick(day)}
            onpointerenter={() => (hover = day)}
            onpointerleave={() => (hover = null)}
            onfocus={() => (hover = day)}
            onblur={() => (hover = null)}
          ></button>
        {/if}
      {/each}
    </div>
  </div>
  <div class={["mc-heat__legend", classNames?.legend]} aria-hidden="true"><small>Less</small>{#each [0, 1, 2, 3, 4] as n (n)}<span class="mc-heat__cell" data-level={n}></span>{/each}<small>More</small></div>
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-heat { display: grid; gap: var(--space-2); margin: 0; min-width: 0; }
.mc-heat__title { font-size: var(--text-sm); font-weight: 500; }
.mc-heat__readout { min-height: 1.2em; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-heat__scroll { overflow-x: auto; padding-bottom: 4px; }
.mc-heat__grid { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 14px); grid-auto-columns: 14px; gap: 3px; width: max-content; }
.mc-heat__cell { width: 14px; height: 14px; padding: 0; border: 1px solid transparent; border-radius: 3px; background: var(--surface-muted); }
.mc-heat__cell--empty { background: transparent; }
button.mc-heat__cell { cursor: pointer; }
.mc-heat__cell[data-level="1"] { background: color-mix(in oklab, var(--success) 33%, var(--surface-muted)); } .mc-heat__cell[data-level="2"] { background: color-mix(in oklab, var(--success) 60%, var(--surface-muted)); }
.mc-heat__cell[data-level="3"] { background: color-mix(in oklab, var(--success) 82%, var(--surface-muted)); } .mc-heat__cell[data-level="4"] { background: var(--success); }
.mc-heat__cell[aria-selected="true"], .mc-heat__cell:focus-visible { border-color: var(--foreground); outline: none; }
.mc-heat__legend { display: flex; align-items: center; justify-content: flex-end; gap: 4px; } .mc-heat__legend small { color: var(--text-muted); font-size: 11px; }
}
</style>
