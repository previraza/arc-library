<script lang="ts" module>
  export interface RadioCardOption {
    value: string;
    label: string;
    description?: string;
    meta?: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  interface Props {
    options: RadioCardOption[];
    layout?: "grid" | "list";
    /** The selected value. Bind it with `bind:value`. Arrow keys move the selection, as in a native radio group. */
    value?: string | null;
    /** Extend the inner, named parts of the radio cards: card, title, description or meta. */
    classNames?: { card?: string; title?: string; description?: string; meta?: string };
  }

  let { options, layout, value = $bindable(null), classNames }: Props = $props();
  const id = $props.id();

  function onKeydown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    let next = index;
    for (let tries = 0; tries < options.length; tries += 1) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    value = options[next].value;
    document.getElementById(`${id}-${next}`)?.focus();
  }
</script>

<div class={["mc-cards", `mc-cards--${layout ?? "grid"}`]} role="radiogroup">
  {#each options as option, index (option.value)}
    <button
      id="{id}-{index}"
      type="button"
      role="radio"
      class={["mc-cards__card", classNames?.card]}
      aria-checked={value === option.value}
      disabled={option.disabled}
      tabindex={value === option.value || (value === null && index === 0) ? 0 : -1}
      data-state={value === option.value ? "checked" : "unchecked"}
      onclick={() => (value = option.value)}
      onkeydown={(event) => onKeydown(event, index)}
    >
      <span class="mc-cards__copy">
        <span class={["mc-cards__title", classNames?.title]}>{option.label}</span>
        {#if option.description}<span class={["mc-cards__description", classNames?.description]}>{option.description}</span>{/if}
      </span>
      {#if option.meta}<span class={["mc-cards__meta", classNames?.meta]}>{option.meta}</span>{/if}
    </button>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-cards { display: grid; gap: var(--space-2); }
.mc-cards--grid { grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
.mc-cards__card { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-cards__card:hover:not(:disabled) { border-color: var(--border-strong); } }
.mc-cards__card[data-state="checked"] { border-color: var(--foreground); background: var(--surface-muted); }
.mc-cards__card:disabled { opacity: .5; cursor: not-allowed; }
.mc-cards__card:focus-visible { outline: none; border-color: var(--foreground); }
.mc-cards__copy { display: grid; gap: 2px; }
.mc-cards__title { font-size: var(--text-sm); font-weight: 500; }
.mc-cards__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-cards__meta { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .mc-cards__card { transition: none; } }
}
</style>
