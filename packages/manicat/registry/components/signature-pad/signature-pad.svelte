<script lang="ts" module>
  export type InkColor = "black" | "blue" | "violet";
  export type InkWidth = "fine" | "medium" | "bold";

  export interface InkPoint {
    x: number;
    y: number;
  }

  export interface InkStroke {
    id: string;
    points: InkPoint[];
    color: InkColor;
    width: InkWidth;
  }
</script>

<script lang="ts">
  import { linePath } from "@/lib/chart";

  interface Props {
    signer?: string;
    hint?: string;
    defaultColor?: InkColor;
    defaultWidth?: InkWidth;
    height?: number;
    /** The strokes as plain points, so you can store them or render them yourself. Bind them with `bind:strokes`. */
    strokes?: InkStroke[];
    /** Extend the inner, named parts of the pad: surface, hint or action. */
    classNames?: { surface?: string; hint?: string; action?: string };
  }

  let { signer, hint = "Sign above the line", defaultColor = "black", defaultWidth = "medium", height = 180, strokes = $bindable([]), classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let color = $state(defaultColor);
  // svelte-ignore state_referenced_locally
  let width = $state(defaultWidth);
  let surface = $state<HTMLElement>();
  let drawing = $state(false);

  const ink: Record<InkColor, string> = { black: "var(--foreground)", blue: "#1f5fd1", violet: "#6d3cc9" };
  const thickness: Record<InkWidth, number> = { fine: 1.5, medium: 2.5, bold: 4 };
  const paths = $derived(strokes.map((stroke) => ({ stroke, d: linePath(stroke.points.map((point): [number, number] => [point.x, point.y]), "smooth") || `M${stroke.points[0].x},${stroke.points[0].y}` })));

  function point(event: PointerEvent): InkPoint {
    const box = surface!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function down(event: PointerEvent) {
    drawing = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    strokes = [...strokes, { id: `s-${strokes.length}-${Date.now()}`, color, width, points: [point(event)] }];
  }

  function move(event: PointerEvent) {
    if (!drawing) return;
    const last = strokes[strokes.length - 1];
    strokes = [...strokes.slice(0, -1), { ...last, points: [...last.points, point(event)] }];
  }
</script>

<div class="mc-sign">
  <div bind:this={surface} class={["mc-sign__surface", classNames?.surface]} role="img" aria-label="Signature pad{signer ? ` for ${signer}` : ''}" style="height: {height}px" onpointerdown={down} onpointermove={move} onpointerup={() => (drawing = false)} onpointercancel={() => (drawing = false)}>
    <svg class="mc-sign__svg" width="100%" {height}>
      {#each paths as { stroke, d } (stroke.id)}
        <path {d} fill="none" stroke={ink[stroke.color]} stroke-width={thickness[stroke.width]} stroke-linecap="round" stroke-linejoin="round" />
      {/each}
    </svg>
    <span class="mc-sign__line"></span>
    {#if strokes.length === 0}<span class={["mc-sign__hint", classNames?.hint]}>{hint}</span>{/if}
  </div>
  <div class="mc-sign__actions">
    {#each ["black", "blue", "violet"] as const as name (name)}
      <button type="button" class="mc-sign__swatch" aria-label="{name} ink" aria-pressed={color === name} style="background: {ink[name]}" onclick={() => (color = name)}></button>
    {/each}
    {#each ["fine", "medium", "bold"] as const as name (name)}
      <button type="button" class="mc-sign__pen" aria-label="{name} pen" aria-pressed={width === name} onclick={() => (width = name)}><span style="height: {thickness[name]}px"></span></button>
    {/each}
    <span class="mc-sign__spacer"></span>
    <button type="button" class={["mc-sign__action", classNames?.action]} disabled={strokes.length === 0} onclick={() => (strokes = strokes.slice(0, -1))}>Undo</button>
    <button type="button" class={["mc-sign__action", classNames?.action]} disabled={strokes.length === 0} onclick={() => (strokes = [])}>Clear</button>
  </div>
  {#if signer}<span class="mc-sign__signer">{signer}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-sign { display: grid; gap: var(--space-2); }
.mc-sign__surface { position: relative; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); touch-action: none; cursor: crosshair; }
.mc-sign__svg { position: absolute; inset: 0; pointer-events: none; }
.mc-sign__line { position: absolute; left: 24px; right: 24px; bottom: 36px; height: 1px; background: var(--border-strong); pointer-events: none; }
.mc-sign__hint { position: absolute; left: 0; right: 0; bottom: 12px; color: var(--text-muted); font-size: var(--text-xs); text-align: center; pointer-events: none; }
.mc-sign__actions { display: flex; align-items: center; gap: var(--space-3); }
.mc-sign__swatch { width: 22px; height: 22px; padding: 0; border: 2px solid transparent; border-radius: 50%; cursor: pointer; } .mc-sign__swatch[aria-pressed="true"] { border-color: var(--foreground); }
.mc-sign__pen { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; } .mc-sign__pen[aria-pressed="true"] { background: var(--surface-muted); } .mc-sign__pen span { display: block; width: 18px; border-radius: 2px; background: var(--foreground); }
.mc-sign__spacer { flex: 1; }
.mc-sign__action { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; } .mc-sign__action:disabled { opacity: .4; cursor: not-allowed; }
.mc-sign__signer { color: var(--text-muted); font-size: var(--text-xs); }
}
</style>
