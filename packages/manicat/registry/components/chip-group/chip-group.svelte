<script lang="ts" module>
  export interface ChipOption {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  interface Props {
    options: ChipOption[];
    label: string;
    multiple?: boolean;
    /** How many chips show before the rest collapse into a "+N more" chip. */
    maxVisible?: number;
    /** The selected values. Bind them with `bind:value`. */
    value?: string[];
    /** Extend the inner, named parts of the chip group: chip or more. */
    classNames?: { chip?: string; more?: string };
  }

  let { options, label, multiple = true, maxVisible = Infinity, value = $bindable([]), classNames }: Props = $props();

  let expanded = $state(false);
  const shown = $derived(expanded ? options : options.slice(0, maxVisible));
  const hidden = $derived(options.length - shown.length);

  function toggle(option: string) {
    if (!multiple) value = value.includes(option) ? [] : [option];
    else value = value.includes(option) ? value.filter((entry) => entry !== option) : [...value, option];
  }
</script>

<div class="mc-chips" role="group" aria-label={label}>
  {#each shown as option (option.value)}
    <button type="button" class={["mc-chips__chip", classNames?.chip]} aria-pressed={value.includes(option.value)} onclick={() => toggle(option.value)}>
      {option.label}
    </button>
  {/each}
  {#if hidden > 0}
    <button type="button" class={["mc-chips__chip", "mc-chips__more", classNames?.more]} onclick={() => (expanded = true)}>+{hidden} more</button>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.mc-chips__chip { min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-chips__chip:hover { border-color: var(--border-strong); } }
.mc-chips__chip:active { transform: scale(.97); }
.mc-chips__chip[aria-pressed="true"] { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
.mc-chips__more { background: var(--surface-muted); color: var(--text-secondary); }
@media (prefers-reduced-motion: reduce) { .mc-chips__chip { transition: none; } .mc-chips__chip:active { transform: none; } }
}
</style>
