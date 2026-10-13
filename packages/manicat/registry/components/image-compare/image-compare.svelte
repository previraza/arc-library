<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    orientation?: "horizontal" | "vertical";
    labels?: [string, string] | false;
    label?: string;
    /** Any CSS aspect ratio, such as "16/10". */
    aspectRatio?: string;
    /** The divider's position, 0 to 100. Bind it with `bind:position`. */
    position?: number;
    before?: Snippet;
    after?: Snippet;
    /** Extend the inner, named parts of the comparison: handle or tag. */
    classNames?: { handle?: string; tag?: string };
  }

  let { orientation = "horizontal", labels = ["Before", "After"], label = "Image comparison", aspectRatio = "16/10", position = $bindable(50), before, after, classNames }: Props = $props();

  let root = $state<HTMLElement>();
  let dragging = $state(false);

  function update(event: PointerEvent) {
    const box = root!.getBoundingClientRect();
    const ratio = orientation === "horizontal" ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height;
    position = Math.max(0, Math.min(100, ratio * 100));
  }

  function down(event: PointerEvent) {
    dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    update(event);
  }

  function onKeydown(event: KeyboardEvent) {
    const forward = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backward = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    if (event.key === forward) position = Math.min(100, position + 5);
    else if (event.key === backward) position = Math.max(0, position - 5);
    else if (event.key === "Home") position = 0;
    else if (event.key === "End") position = 100;
    else return;
    event.preventDefault();
  }
</script>

<div bind:this={root} class={["mc-compare", `mc-compare--${orientation}`]} style:aspect-ratio={aspectRatio} style:--mc-pos="{position}%">
  <div class="mc-compare__layer">{@render after?.()}</div>
  <div class="mc-compare__layer mc-compare__before">{@render before?.()}</div>
  <div class="mc-compare__surface" role="presentation" onpointerdown={down} onpointermove={(event) => dragging && update(event)} onpointerup={() => (dragging = false)} onpointercancel={() => (dragging = false)}></div>
  <div
    class="mc-compare__line"
    role="slider"
    tabindex="0"
    aria-label={label}
    aria-orientation={orientation}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(position)}
    onkeydown={onKeydown}
  >
    <span class={["mc-compare__handle", classNames?.handle]} aria-hidden="true">{orientation === "horizontal" ? "↔" : "↕"}</span>
  </div>
  {#if labels}
    <span class={["mc-compare__tag", "mc-compare__tag--start", classNames?.tag]}>{labels[0]}</span><span class={["mc-compare__tag", "mc-compare__tag--end", classNames?.tag]}>{labels[1]}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-compare { position: relative; width: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); user-select: none; }
.mc-compare__layer { position: absolute; inset: 0; } .mc-compare__layer > * { width: 100%; height: 100%; object-fit: cover; }
.mc-compare--horizontal .mc-compare__before { clip-path: inset(0 calc(100% - var(--mc-pos)) 0 0); } .mc-compare--vertical .mc-compare__before { clip-path: inset(0 0 calc(100% - var(--mc-pos)) 0); }
.mc-compare__surface { position: absolute; inset: 0; touch-action: none; cursor: ew-resize; } .mc-compare--vertical .mc-compare__surface { cursor: ns-resize; }
.mc-compare__line { position: absolute; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .15); outline: none; }
.mc-compare--horizontal .mc-compare__line { top: 0; bottom: 0; left: var(--mc-pos); width: 2px; margin-left: -1px; } .mc-compare--vertical .mc-compare__line { left: 0; right: 0; top: var(--mc-pos); height: 2px; margin-top: -1px; }
.mc-compare__handle { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--text-secondary); font-size: 12px; box-shadow: var(--shadow-raised); }
.mc-compare__line:focus-visible .mc-compare__handle { border-color: var(--foreground); }
.mc-compare__tag { position: absolute; padding: 2px 8px; border-radius: var(--radius-pill); background: rgb(0 0 0 / .5); color: #fff; font-size: var(--text-xs); pointer-events: none; }
.mc-compare__tag--start { top: 8px; left: 8px; } .mc-compare__tag--end { right: 8px; bottom: 8px; }
}
</style>
