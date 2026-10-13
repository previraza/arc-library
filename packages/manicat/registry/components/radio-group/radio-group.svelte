<script lang="ts" module>
  export interface RadioOption {
    value: string;
    label: string;
    description?: string;
  }
</script>

<script lang="ts">
  interface Props {
    label: string;
    options: RadioOption[];
    name?: string;
    /** The selected value. Bind it with `bind:value`. Arrow keys move the selection, as in a native radio group. */
    value?: string;
    /** Extend the inner, named parts of the radio group: label, option, mark, dot, optionLabel or description. */
    classNames?: { label?: string; option?: string; mark?: string; dot?: string; optionLabel?: string; description?: string };
  }

  let { label, options, name, value = $bindable(), classNames }: Props = $props();
  const id = $props.id();

  function onKeydown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    value = options[next].value;
    document.getElementById(`${id}-${next}`)?.focus();
  }
</script>

<div class="mc-radio" role="radiogroup" aria-labelledby="{id}-label">
  <span id="{id}-label" class={["mc-radio__label", classNames?.label]}>{label}</span>
  {#each options as option, index (option.value)}
    <button
      id="{id}-{index}"
      type="button"
      role="radio"
      class={["mc-radio__option", classNames?.option]}
      aria-checked={value === option.value}
      tabindex={value === option.value || (value === undefined && index === 0) ? 0 : -1}
      data-state={value === option.value ? "checked" : "unchecked"}
      onclick={() => (value = option.value)}
      onkeydown={(event) => onKeydown(event, index)}
    >
      <span class="mc-radio__hit"><span class={["mc-radio__mark", classNames?.mark]}><span class={["mc-radio__dot", classNames?.dot]}></span></span></span>
      <span class="mc-radio__copy">
        <span class={["mc-radio__title", classNames?.optionLabel]}>{option.label}</span>
        {#if option.description}<span class={["mc-radio__description", classNames?.description]}>{option.description}</span>{/if}
      </span>
      {#if name}<input type="radio" {name} value={option.value} checked={value === option.value} hidden tabindex="-1" />{/if}
    </button>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-radio { display: grid; }
.mc-radio__label { margin-bottom: var(--space-1); font-size: var(--text-sm); font-weight: 500; }
.mc-radio__option { display: flex; align-items: flex-start; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-radio__hit { display: grid; flex: 0 0 auto; place-items: center; width: var(--control-height-md); height: var(--control-height-md); }
.mc-radio__mark { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-radio__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--control-on); transform: scale(0); transition: transform .24s var(--ease-spring, var(--ease-standard)); }
.mc-radio__option[data-state="checked"] .mc-radio__mark { border-color: var(--control-on); }
.mc-radio__option[data-state="checked"] .mc-radio__dot { transform: scale(1); }
@media (hover: hover) and (pointer: fine) { .mc-radio__option[data-state="unchecked"]:hover .mc-radio__mark { border-color: var(--text-muted); } }
.mc-radio__option:focus-visible { outline: none; }
.mc-radio__copy { display: grid; gap: 2px; padding-top: calc((var(--control-height-md) - var(--text-sm) * 1.4) / 2); }
.mc-radio__title { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-radio__description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-radio__mark, .mc-radio__dot { transition: none; } }
}
</style>
