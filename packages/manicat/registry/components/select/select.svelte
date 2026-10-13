<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte bits-ui
  import { onMount } from "svelte";
  import { Select } from "bits-ui";
  import { Check, ChevronDown, ChevronUp } from "@lucide/svelte";
  import { createLabelSwap } from "@/lib/motion-dom";

  interface Props {
    label: string;
    description?: string;
    placeholder?: string;
    id?: string;
    disabled?: boolean;
    value?: string;
    options: { value: string; label: string; disabled?: boolean }[];
    /** Extend the inner, named parts of the select: trigger, valueText, chevron, content, scrollButton, viewport, item, indicator or hint. */
    classNames?: { trigger?: string; valueText?: string; chevron?: string; content?: string; scrollButton?: string; viewport?: string; item?: string; indicator?: string; hint?: string };
  }

  let { label, description, placeholder = "Select an option", id, disabled = false, value = $bindable(), options, classNames }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  const hintId = $derived(description ? `${controlId}-description` : undefined);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const index = $derived(options.findIndex((option) => option.value === value));
  const shown = $derived(value ? (options[index]?.label ?? "") : placeholder);
  let valueText: HTMLElement;
  let valueSpan: HTMLElement;

  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
  // The shown value rolls in the direction of the list: a later option rises from below, an earlier one drops from above.
  const labelIndex = (text: string) => options.findIndex((option) => option.label === text);
  const direction = (next: string, previous: string) => (labelIndex(next) >= labelIndex(previous) ? 1 : -1);

  onMount(() => {
    const swap = createLabelSwap(valueText, valueText, valueSpan, { reduced, width: false, pop: false, variant: "rise", direction });
    return () => swap.destroy();
  });
</script>

<div class="mc-select__field">
  <label for={controlId}>{label}</label>
  <Select.Root type="single" bind:value {disabled}>
    <Select.Trigger id={controlId} aria-describedby={hintId} class={["mc-select__trigger", classNames?.trigger]}>
      <!-- The real value stays for assistive tech; the visible copy below animates between values. -->
      <span class="mc-select__srOnly">{shown}</span>
      <span bind:this={valueText} class={["mc-select__valueText", classNames?.valueText]} aria-hidden="true">
        <span bind:this={valueSpan} data-placeholder={value ? undefined : ""}>{shown}</span>
      </span>
      <span class={["mc-select__chevron", classNames?.chevron]}><ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" /></span>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class={["mc-select__content", classNames?.content]} sideOffset={4} collisionPadding={12}>
        <Select.ScrollUpButton class={["mc-select__scrollButton", classNames?.scrollButton]}><ChevronUp size={16} strokeWidth={1.75} aria-hidden="true" /></Select.ScrollUpButton>
        <Select.Viewport class={["mc-select__viewport", classNames?.viewport]}>
          {#each options as option (option.value)}
            <Select.Item value={option.value} label={option.label} disabled={option.disabled} class={["mc-select__item", classNames?.item]}>
              {#snippet children({ selected })}
                <span>{option.label}</span>
                {#if selected}<span class={["mc-select__indicator", classNames?.indicator]}><Check size={16} strokeWidth={1.75} aria-hidden="true" /></span>{/if}
              {/snippet}
            </Select.Item>
          {/each}
        </Select.Viewport>
        <Select.ScrollDownButton class={["mc-select__scrollButton", classNames?.scrollButton]}><ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
  {#if description}<span id={hintId} class={["mc-select__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-select__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-select__field label { font-size: var(--text-sm); font-weight: 500; }
/* The trigger anchors the floating menu. Radix opens on pointerdown and measures this box, so it never scales: press feedback is color only. */
.mc-select__trigger { position: relative; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-select__trigger:hover:not([data-disabled]) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-select__trigger:active:not([data-disabled]), .mc-select__trigger[data-state="open"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-select__trigger:focus-visible { border-color: var(--border-strong); }
.mc-select__trigger[data-disabled] { opacity: .5; cursor: not-allowed; }
.mc-select__valueText { display: grid; flex: 1; min-width: 0; grid-template-columns: minmax(0, 1fr); }
.mc-select__valueText > span { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-select__valueText > [data-placeholder] { color: var(--text-muted); }
.mc-select__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-select__chevron { display: inline-flex; flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard); }
.mc-select__trigger[data-state="open"] .mc-select__chevron { transform: rotate(180deg); }
.mc-select__hint { color: var(--text-muted); font-size: var(--text-xs); }
/* Radix holds the animation until the menu is positioned, so it always grows from the trigger edge. */
.mc-select__content { --menu-x: 0px; --menu-y: -6px; box-sizing: border-box; z-index: 1000; width: var(--bits-select-anchor-width); min-width: var(--bits-select-anchor-width); max-width: min(24rem, calc(100vw - 20px)); max-height: min(320px, var(--bits-select-content-available-height)); overflow: hidden; border: 1px solid var(--border); border-radius: calc(var(--radius-control) + 2px); padding: 6px; background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); transform-origin: var(--bits-select-content-transform-origin); animation: mc-select-select-in var(--duration-standard) var(--ease-enter) both; }
.mc-select__content[data-side="top"] { --menu-y: 6px; }
.mc-select__content[data-side="left"] { --menu-x: 6px; --menu-y: 0px; }
.mc-select__content[data-side="right"] { --menu-x: -6px; --menu-y: 0px; }
.mc-select__content[data-state="closed"] { animation: mc-select-select-out var(--duration-instant) var(--ease-standard) both; }
.mc-select__viewport { padding: 2px 0; }
.mc-select__item { position: relative; display: flex; align-items: center; min-height: 36px; border-radius: calc(var(--radius-control) - 4px); padding: 0 34px 0 11px; color: var(--foreground); font-size: var(--text-sm); cursor: default; outline: none; user-select: none; transition: background-color var(--duration-instant) var(--ease-standard), color var(--duration-instant) var(--ease-standard); }
.mc-select__item[data-highlighted] { background: var(--surface-muted); }
.mc-select__item[data-disabled] { opacity: .45; }
.mc-select__indicator { position: absolute; right: 10px; display: inline-flex; align-items: center; color: var(--foreground); animation: mc-select-indicator-in var(--duration-standard) var(--ease-enter) 40ms both; }
.mc-select__scrollButton { display: grid; height: 28px; place-items: center; color: var(--text-muted); }
@keyframes mc-select-select-in { from { opacity: 0; transform: translate(var(--menu-x), var(--menu-y)) scale(.97); } }
@keyframes mc-select-select-out { to { opacity: 0; transform: translate(calc(var(--menu-x) / 2), calc(var(--menu-y) / 2)) scale(.98); } }
@keyframes mc-select-indicator-in { from { opacity: 0; transform: scale(.6); filter: blur(2px); } }
@media (prefers-reduced-transparency: reduce) { .mc-select__content { background: var(--surface-raised); backdrop-filter: none; -webkit-backdrop-filter: none; } }
@media (prefers-reduced-motion: reduce) { .mc-select__trigger, .mc-select__chevron, .mc-select__item { transition: none; } .mc-select__content { animation: mc-select-select-fade var(--duration-instant) var(--ease-standard) both; } .mc-select__content[data-state="closed"] { animation: mc-select-select-fade-out var(--duration-instant) var(--ease-standard) both; } .mc-select__indicator { animation: none; } }
@keyframes mc-select-select-fade { from { opacity: 0; } }
@keyframes mc-select-select-fade-out { to { opacity: 0; } }
}
</style>
