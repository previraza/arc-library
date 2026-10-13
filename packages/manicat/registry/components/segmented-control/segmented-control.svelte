<script lang="ts" module>
  export interface Segment {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import { createSegmentedControl } from "@/lib/motion-dom";

  interface Props {
    options: Segment[];
    value: string;
    label?: string;
    /** Called when the pointer or focus reaches an option, before it is chosen. Use it to start loading what that option shows. */
    onoptionintent?: (value: string) => void;
    /** Content after a label, such as a badge. It receives the option. */
    accessory?: Snippet<[Segment]>;
    /** Extend the inner, named parts of the control: track, button, selection or label. */
    classNames?: { track?: string; button?: string; selection?: string; label?: string };
  }

  let { options, value = $bindable(), label, onoptionintent, accessory, classNames }: Props = $props();

  const id = $props.id();
  let track: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let controller: ReturnType<typeof createSegmentedControl> | undefined;
  const selectedIndex = $derived(Math.max(0, options.findIndex((option) => option.value === value)));

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

  onMount(() => {
    controller = createSegmentedControl(track, { selectionClass: cn("mc-segmented-control__selection", classNames?.selection), reduced });
    controller.update();
    return () => controller?.destroy();
  });
  $effect(() => {
    void value;
    void options.length;
    tick().then(() => controller?.update());
  });

  // Arrow keys, Home and End move the selection like a tab list; only the selected option is a tab stop.
  function onKeyDown(event: KeyboardEvent) {
    const last = options.length - 1;
    const target = event.key === "ArrowRight" || event.key === "ArrowDown" ? (selectedIndex === last ? 0 : selectedIndex + 1) : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (selectedIndex === 0 ? last : selectedIndex - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
    if (target < 0 || !options[target]) return;
    event.preventDefault();
    value = options[target].value;
    track.querySelector<HTMLElement>(`[data-value="${CSS.escape(options[target].value)}"]`)?.focus({ preventScroll: true });
  }
</script>

<div class="mc-segmented-control__root" role="group" aria-label={label}>
  <div bind:this={track} class={["mc-segmented-control__track", classNames?.track]}>
    {#each options as option, index (option.value)}
      <button
        id={`${id}-${option.value}`}
        class={["mc-segmented-control__button", classNames?.button]}
        type="button"
        data-value={option.value}
        aria-pressed={value === option.value}
        tabindex={index === selectedIndex ? 0 : -1}
        onclick={() => (value = option.value)}
        onkeydown={onKeyDown}
        onpointerenter={() => onoptionintent?.(option.value)}
        onfocus={() => onoptionintent?.(option.value)}
      >
        <span class={["mc-segmented-control__label", classNames?.label]}>{option.label}{@render accessory?.(option)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The frame can shrink below its content inside flex and grid parents; the track then scrolls inside it. */
.mc-segmented-control__root { display: inline-flex; min-width: 0; max-width: 100%; flex-shrink: 1; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); }
/* The track owns the stacking context so the gliding highlight passes under every label, not over earlier ones. */
.mc-segmented-control__track { --fade-start: 0px; --fade-end: 0px; isolation: isolate; display: flex; min-width: 0; gap: 2px; overflow-x: auto; overscroll-behavior-x: contain; padding: 3px; border-radius: inherit; scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent); mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent); }
.mc-segmented-control__track::-webkit-scrollbar { display: none; }
.mc-segmented-control__track[data-fade-start] { --fade-start: 20px; }
.mc-segmented-control__track[data-fade-end] { --fade-end: 20px; }
/* Items never scale or change weight; only the highlight travels and the label color follows it. */
.mc-segmented-control__button { position: relative; flex: 0 0 auto; min-height: var(--control-height-sm); border: 0; border-radius: calc(var(--radius-control) - 4px); padding: 0 12px; background: transparent; color: var(--text-muted); font: inherit; font-size: var(--text-sm); font-weight: 500; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-segmented-control__button:hover { color: var(--foreground); } }
.mc-segmented-control__button:active, .mc-segmented-control__button[aria-pressed="true"] { color: var(--foreground); }
.mc-segmented-control__selection { position: absolute; z-index: -1; inset: 0; border: 1px solid var(--border); border-radius: inherit; background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-segmented-control__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px; }
@media (max-width: 380px) { .mc-segmented-control__button { padding: 0 10px; } }
@media (prefers-reduced-motion: reduce) { .mc-segmented-control__button { transition: none; } }
}
</style>
