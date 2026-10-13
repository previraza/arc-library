<script lang="ts" module>
  export interface Segment {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    options: Segment[];
    label?: string;
    /** The selected segment's value. Bind it with `bind:value`. */
    value?: string;
    /** Extend the inner, named parts of the segmented control: track, button or text. */
    classNames?: { track?: string; button?: string; text?: string };
    /** Adds content after a label. It receives the segment's value. */
    accessory?: Snippet<[string]>;
  }

  let { options, label, value = $bindable(), classNames, accessory }: Props = $props();
  const id = $props.id();

  function onKeydown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    value = options[next].value;
    document.getElementById(`${id}-${next}`)?.focus();
  }
</script>

<div class={["mc-segmented", classNames?.track]} role="radiogroup" aria-label={label}>
  {#each options as option, index (option.value)}
    <button
      id="{id}-{index}"
      type="button"
      role="radio"
      class={["mc-segmented__button", classNames?.button]}
      aria-checked={value === option.value}
      tabindex={value === option.value || (value === undefined && index === 0) ? 0 : -1}
      data-state={value === option.value ? "checked" : "unchecked"}
      onclick={() => (value = option.value)}
      onkeydown={(event) => onKeydown(event, index)}
    >
      <span class={classNames?.text}>{option.label}</span>
      {@render accessory?.(option.value)}
    </button>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-segmented { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); }
.mc-segmented__button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid transparent; border-radius: calc(var(--radius-control) - 3px); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-segmented__button:hover { color: var(--foreground); } }
.mc-segmented__button[data-state="checked"] { border-color: var(--border); background: var(--surface); color: var(--accent-strong); box-shadow: var(--shadow-resting); }
.mc-segmented__button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .mc-segmented__button { transition: none; } }
}
</style>
