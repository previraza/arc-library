<script lang="ts" module>
  import type { PanelConfig } from "@/lib/resizable-panels";

  export type { PanelConfig };
  /** One pane of a group: its configuration. The group renders the `panel` snippet for each. */
  export type ResizablePanel = PanelConfig & { class?: string };
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { createResizablePanels, initialPanels, paneVars } from "@/lib/resizable-panels";
  import type { PanelsState, ResizablePanelsController } from "@/lib/resizable-panels";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /**
   * A horizontal split view whose panes people resize by dragging the dividers between them, the way a mail or code editor window works.
   * Use it when people need to trade space between side-by-side content for the task at hand. Dividers follow the pointer 1:1, resist past
   * a pane's limits, and snap collapsible panes closed. Each divider is a focusable separator: arrows resize, Home and End jump to the limits,
   * Enter hides or restores a collapsible pane, and a double-click resets the layout. The group needs a definite height.
   */
  interface Props {
    /** Names the group for assistive technology. */
    label?: string;
    /** One entry per pane, in order. Shares are relative, so `defaultSize` values need not add up to 100. The set of panes should stay the same for the life of the group. */
    panels: ResizablePanel[];
    /** Renders the content of a pane. */
    panel: Snippet<[ResizablePanel]>;
    /** Called with each pane's share in percent after a resize settles. */
    onlayoutchange?: (sizes: number[]) => void;
    /** Extend the inner, named parts of the resizable panels: panel, content, handle, grip or restore. */
    classNames?: { panel?: string; content?: string; handle?: string; grip?: string; restore?: string };
    class?: string;
    [key: string]: unknown;
  }

  let { label, panels, panel, onlayoutchange, classNames, class: className, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

  let group = $state<HTMLElement>();
  let view = $state.raw<PanelsState>(initialPanels($state.snapshot(panels) as PanelConfig[]));
  let controller = $state.raw<ResizablePanelsController>();
  onMount(() => {
    const made = createResizablePanels(group!, { configs: () => panels, reduced, onChange: (next) => (view = next), onLayoutChange: (sizes) => onlayoutchange?.(sizes) });
    controller = made;
    return () => made.destroy();
  });

  const modeOf = (index: number) => (view.collapsed[index - 1] ? "before" : view.collapsed[index] ? "after" : "open");
  // The view is read so the dividers update on every change.
  const aria = (index: number) => (void view, controller?.aria(index - 1) ?? { now: Math.round(view.shares[index - 1]), min: 0, max: 100 });
  const hiddenLabel = (index: number) => (modeOf(index) === "before" ? panels[index - 1].label : modeOf(index) === "after" ? panels[index].label : null);

  // The restore tab scales and blurs in on a spring, and leaves a little faster.
  const { blur, duration } = motionTokens;
  const tabIn = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle };
  const tabRest = { opacity: 1, scale: 1, blur: 0 };
  const enterTab = poseTransition(tabIn, tabRest, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const leaveTab = poseTransition(tabIn, tabRest, { duration: reduced ? duration.instant : duration.fast, ease: "standard" }, { pop: true });
</script>

<div bind:this={group} {...rest} class={cn("mc-resizable-panels__group", className)} role="group" aria-label={label} data-resizing={view.resizing !== null || undefined}>
  {#each panels as config, index (config.id)}
    {#if index > 0}
      {@const a = aria(index)}
      {@const mode = modeOf(index)}
      {@const hidden = hiddenLabel(index)}
      <div
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-controls={panels[index - 1].id}
        aria-label={panels[index - 1].label}
        aria-valuenow={a.now}
        aria-valuemin={a.min}
        aria-valuemax={a.max}
        aria-valuetext={hidden ? `${hidden} hidden, press Enter to show` : `${a.now}%`}
        class={cn("mc-resizable-panels__handle", classNames?.handle)}
        data-collapsed={mode === "open" ? undefined : mode}
        data-active={view.resizing === index - 1 || undefined}
        onpointerdown={(event) => controller?.pointerDown(index - 1, event)}
        onpointermove={(event) => controller?.pointerMove(event)}
        onpointerup={(event) => controller?.pointerEnd(event, false)}
        onpointercancel={(event) => controller?.pointerEnd(event, true)}
        onkeydown={(event) => controller?.keyDown(index - 1, event)}
        ondblclick={() => controller?.reset()}
      >
        <span class={cn("mc-resizable-panels__grip", classNames?.grip)} aria-hidden="true"></span>
        {#if mode !== "open"}
          {#key mode}
            <span class={cn("mc-resizable-panels__restore", classNames?.restore)} data-side={mode} aria-hidden="true" in:enterTab out:leaveTab>
              {#if mode === "before"}<ChevronRight size={14} strokeWidth={1.75} />{:else}<ChevronLeft size={14} strokeWidth={1.75} />{/if}
            </span>
          {/key}
        {/if}
      </div>
    {/if}
    {@const vars = paneVars(config, panels)}
    <div id={config.id} data-pane class={cn("mc-resizable-panels__panel", config.class, classNames?.panel)} style:--panel-min={vars["--panel-min"]} style:--panel-max={vars["--panel-max"]} data-collapsed={view.collapsed[index] || undefined} data-free={view.free[index] || undefined} data-anchor={index === 0 && panels.length > 1 ? "end" : "start"}>
      <div class={cn("mc-resizable-panels__content", classNames?.content)} inert={view.collapsed[index]}>{@render panel(config)}</div>
    </div>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Panes share the width through flex-grow factors, so the layout is right on the server and stays proportional as the group resizes. */
/* A size container, so each pane's floor can scale with the group when it is too narrow for every minimum (see --panel-min). */
.mc-resizable-panels__group { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; container-type: inline-size; }
.mc-resizable-panels__group[data-resizing] { cursor: col-resize; user-select: none; -webkit-user-select: none; }
/* Content ignores the pointer while a divider moves, so hover states never flicker underneath it. */
.mc-resizable-panels__group[data-resizing] .mc-resizable-panels__content { pointer-events: none; }

/* CSS enforces each pane's limits until an interaction frees it; JS hands them back once the pane settles inside them. */
.mc-resizable-panels__panel { position: relative; display: flex; min-width: var(--panel-min); max-width: var(--panel-max); min-height: 0; flex: 0 1 0px; overflow: hidden; }
.mc-resizable-panels__panel[data-anchor="end"] { justify-content: flex-end; }
.mc-resizable-panels__panel[data-free], .mc-resizable-panels__panel[data-collapsed] { min-width: 0; max-width: none; }
.mc-resizable-panels__content { display: flex; width: 100%; flex: none; flex-direction: column; min-height: 0; }
.mc-resizable-panels__panel[data-free] .mc-resizable-panels__content, .mc-resizable-panels__panel[data-collapsed] .mc-resizable-panels__content { min-width: var(--panel-min); }

/* The divider is a one pixel line with a 13px grab area, and a grip that forms while it is hovered, focused, or dragged. */
.mc-resizable-panels__handle { position: relative; z-index: 2; flex: 0 0 1px; background: var(--border); cursor: col-resize; touch-action: none; outline: none; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-resizable-panels__handle::before { position: absolute; inset: 0 -6px; content: ""; }
.mc-resizable-panels__handle[data-collapsed] { background: transparent; cursor: pointer; }
.mc-resizable-panels__grip { position: absolute; top: 50%; left: 50%; width: 4px; height: 32px; border-radius: var(--radius-pill); background: var(--border-strong); opacity: 0; pointer-events: none; transform: translate(-50%, -50%) scaleY(.6); transition: opacity var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) {
  .mc-resizable-panels__handle:not([data-collapsed]):hover { background: var(--border-strong); }
  .mc-resizable-panels__handle:not([data-collapsed]):hover .mc-resizable-panels__grip { opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
  .mc-resizable-panels__handle[data-collapsed]:hover .mc-resizable-panels__restore { border-color: var(--border-strong); color: var(--foreground); }
}
.mc-resizable-panels__handle[data-active] { background: var(--border-strong); }
.mc-resizable-panels__handle[data-active] .mc-resizable-panels__grip { background: var(--foreground); opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
.mc-resizable-panels__handle:focus-visible:not([data-collapsed]) .mc-resizable-panels__grip { opacity: 1; transform: translate(-50%, -50%) scaleY(1); }
.mc-resizable-panels__handle[data-collapsed]:focus-visible .mc-resizable-panels__restore { border-color: var(--border-strong); color: var(--foreground); }

/* Once a neighbour is hidden, a tab on the divider points the way it will come back. */
.mc-resizable-panels__restore { position: absolute; top: 50%; display: grid; width: 18px; height: 40px; margin-top: -20px; place-items: center; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-resting); color: var(--text-secondary); pointer-events: none; transition: border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.mc-resizable-panels__restore[data-side="before"] { left: 5px; transform-origin: 0 50%; }
.mc-resizable-panels__restore[data-side="after"] { right: 5px; transform-origin: 100% 50%; }
.mc-resizable-panels__handle[data-collapsed]::before { inset: 0 -30px; }
.mc-resizable-panels__handle[data-collapsed="before"]::before { left: 0; }
.mc-resizable-panels__handle[data-collapsed="after"]::before { right: 0; }

@media (prefers-reduced-motion: reduce) {
  .mc-resizable-panels__handle, .mc-resizable-panels__grip, .mc-resizable-panels__restore { transition: none; }
}
}
</style>
