<script lang="ts">
  interface Props {
    label?: string;
    disabled?: boolean;
    /** The checked state. Bind it with `bind:checked`. */
    checked?: boolean;
    /** Extend the inner, named parts of the switch: track, thumb or label. */
    classNames?: { track?: string; thumb?: string; label?: string };
  }

  let { label, disabled = false, checked = $bindable(false), classNames }: Props = $props();
</script>

<button
  type="button"
  role="switch"
  class="mc-switch"
  aria-checked={checked}
  aria-label={label}
  data-state={checked ? "checked" : "unchecked"}
  {disabled}
  onclick={() => (checked = !checked)}
>
  <span class={["mc-switch__track", classNames?.track]}><span class={["mc-switch__thumb", classNames?.thumb]}></span></span>
  {#if label}<span class={["mc-switch__label", classNames?.label]}>{label}</span>{/if}
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-switch { display: inline-flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-3); padding: 0; border: 0; color: var(--foreground); background: transparent; font: inherit; font-size: var(--text-sm); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mc-switch:disabled { cursor: not-allowed; opacity: .5; }
.mc-switch__track { position: relative; box-sizing: border-box; display: flex; flex: 0 0 auto; width: 42px; height: 24px; align-items: center; padding: 3px; border-radius: var(--radius-pill); background: var(--control-track); isolation: isolate; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-switch__track::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--control-on); opacity: 0; transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-switch[data-state="checked"] .mc-switch__track::before { opacity: 1; }
.mc-switch__thumb { flex: 0 0 auto; width: 18px; height: 18px; border-radius: var(--radius-pill); background: var(--control-thumb); box-shadow: var(--control-thumb-shadow); transition: transform .3s var(--ease-standard), background-color var(--duration-standard) var(--ease-standard); }
.mc-switch[data-state="checked"] .mc-switch__thumb { transform: translateX(18px); background: var(--control-thumb-on); }
.mc-switch:active:not(:disabled) .mc-switch__thumb { width: 23px; }
.mc-switch[data-state="checked"]:active:not(:disabled) .mc-switch__thumb { transform: translateX(13px); }
@media (hover: hover) and (pointer: fine) { .mc-switch[data-state="unchecked"]:hover:not(:disabled) .mc-switch__track { background: var(--control-track-hover); } }
.mc-switch:focus-visible { outline: none; }
.mc-switch__label { line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-switch__track, .mc-switch__track::before, .mc-switch__thumb { transition: none; } }
}
</style>
