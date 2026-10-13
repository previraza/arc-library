<script lang="ts">
  import { areaPath, linePath, linearScale } from "@/lib/chart";

  interface Props {
    data: number[];
    label: string;
    value?: string;
    change?: string;
    tone?: "accent" | "success" | "warning" | "danger";
    width?: number;
    height?: number;
    area?: boolean;
    /** Extend the inner, named parts of the sparkline: head, label, value, change or chart. */
    classNames?: { head?: string; label?: string; value?: string; change?: string; chart?: string };
  }

  let { data, label, value, change, tone = "accent", width = 140, height = 40, area = true, classNames }: Props = $props();

  const points = $derived.by<[number, number][]>(() => {
    const x = linearScale([0, Math.max(1, data.length - 1)], [2, width - 2]);
    const y = linearScale([Math.min(...data), Math.max(...data)], [height - 3, 3]);
    return data.map((n, index) => [x(index), y(n)]);
  });
  const down = $derived(/^[-−]/.test(change?.trim() ?? ""));
</script>

<figure class="mc-spark" data-tone={tone} aria-label="{label}{value ? `: ${value}` : ''}{change ? `, ${change}` : ''}">
  <div class={["mc-spark__head", classNames?.head]}>
    <span class={["mc-spark__label", classNames?.label]}>{label}</span>
    {#if change}<span class={["mc-spark__change", { "mc-spark__change--down": down }, classNames?.change]}>{change}</span>{/if}
  </div>
  {#if value}<span class={["mc-spark__value", classNames?.value]}>{value}</span>{/if}
  <svg class={["mc-spark__chart", classNames?.chart]} {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
    {#if area}<path d={areaPath(points, height, "smooth")} class="mc-spark__area" />{/if}
    <path d={linePath(points, "smooth")} class="mc-spark__line" />
  </svg>
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-spark { --mc-tone: var(--series-1, var(--accent)); display: inline-grid; gap: 4px; margin: 0; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-spark[data-tone="success"] { --mc-tone: var(--success); } .mc-spark[data-tone="warning"] { --mc-tone: var(--warning); } .mc-spark[data-tone="danger"] { --mc-tone: var(--danger); }
.mc-spark__head { display: flex; justify-content: space-between; gap: var(--space-3); font-size: var(--text-xs); }
.mc-spark__label { color: var(--text-secondary); }
.mc-spark__change { color: var(--success); font-weight: 500; } .mc-spark__change--down { color: var(--danger); }
.mc-spark__value { font-size: var(--text-xl); font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-display); }
.mc-spark__chart { display: block; overflow: visible; }
.mc-spark__line { fill: none; stroke: var(--mc-tone); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.mc-spark__area { fill: var(--mc-tone); fill-opacity: .12; }
}
</style>
