<script lang="ts" module>
  import type { Component } from "svelte";

  export interface RadioCardOption {
    value: string;
    label: string;
    /** One or two short lines under the label. */
    description?: string;
    /** A price, estimate, or other value. Sits at the end of a list row, or under the text in a grid card. */
    meta?: string;
    /** Plain decorative icon beside the label. */
    icon?: Component;
    disabled?: boolean;
    /** Short reason shown in place of the description when the option is disabled. */
    disabledReason?: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createCardRing } from "@/lib/radio-cards";

  interface Props {
    options: RadioCardOption[];
    /** The selected value. Bind it with `bind:value`; without it the cards keep their own, starting at `defaultValue`. */
    value?: string | null;
    defaultValue?: string | null;
    /** "grid" places cards in responsive columns; "list" stacks full width rows. */
    layout?: "grid" | "list";
    /** Narrowest a grid column may get before the grid drops a column, in px. */
    minColumnWidth?: number;
    /** Form field name. Renders a hidden input with the selected value. */
    name?: string;
    required?: boolean;
    disabled?: boolean;
    class?: string;
    style?: string;
    onValueChange?: (value: string) => void;
    /** Extend the inner, named parts of the radio cards: ring, card, indicator, indicatorDot, body, label, icon, labelText, description or meta. */
    classNames?: { ring?: string; card?: string; indicator?: string; indicatorDot?: string; body?: string; label?: string; icon?: string; labelText?: string; description?: string; meta?: string };
    [key: string]: unknown;
  }

  let { options, value = $bindable(), defaultValue = null, layout = "grid", minColumnWidth = 180, name, required, disabled = false, class: className, style, onValueChange, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const uid = generated.replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let root: HTMLElement;
  let ring: HTMLElement;
  let internal = $state<string | null>(defaultValue);
  let ringControl: ReturnType<typeof createCardRing> | undefined;

  const selected = $derived(value !== undefined ? value : internal);
  const selectedIndex = $derived(options.findIndex((option) => option.value === selected));
  const usable = (option: RadioCardOption) => !disabled && !option.disabled;
  const tabStop = $derived(selectedIndex >= 0 && usable(options[selectedIndex]) ? selectedIndex : options.findIndex(usable));
  const describe = (option: RadioCardOption) => (!usable(option) && option.disabledReason ? option.disabledReason : option.description);

  const select = (next: string) => {
    if (next === selected) return;
    internal = next;
    value = next;
    onValueChange?.(next);
  };

  onMount(() => {
    ringControl = createCardRing(root, ring, reduced);
    return () => ringControl?.destroy();
  });
  $effect(() => {
    options;
    ringControl?.sync(selectedIndex);
  });

  const cards = () => Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
  function onkeydown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (usable(options[index])) select(options[index].value);
      return;
    }
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const count = options.length;
    const rtl = step && (event.key === "ArrowLeft" || event.key === "ArrowRight") && getComputedStyle(event.currentTarget as HTMLElement).direction === "rtl" ? -1 : 1;
    let at = event.key === "Home" ? -1 : event.key === "End" ? count : index;
    const dir = event.key === "Home" ? 1 : event.key === "End" ? -1 : step * rtl;
    for (let tries = 0; tries < count; tries++) {
      at = (at + dir + count) % count;
      if (usable(options[at])) {
        cards()[at]?.focus();
        select(options[at].value);
        return;
      }
    }
  }
</script>

<div bind:this={root} {...rest} role="radiogroup" aria-disabled={disabled || undefined} aria-required={required || undefined} class={["mc-radio-cards__root", className]} data-layout={layout} style={`--min-column: ${minColumnWidth}px;${style ?? ""}`}>
  <span bind:this={ring} class={["mc-radio-cards__ring", classNames?.ring]} aria-hidden="true"></span>
  {#each options as option, index (option.value)}
    {@const off = !usable(option)}
    {@const description = describe(option)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div role="radio" data-card={index} class={["mc-radio-cards__card", classNames?.card]} aria-checked={index === selectedIndex} aria-disabled={off || undefined} aria-labelledby={`${uid}-${index}-label`} aria-describedby={description ? `${uid}-${index}-description` : undefined} tabindex={index === tabStop ? 0 : -1} data-checked={index === selectedIndex || undefined} onclick={() => { if (!off) select(option.value); }} onkeydown={(event) => onkeydown(event, index)}>
      <span class={["mc-radio-cards__indicator", classNames?.indicator]} aria-hidden="true">
        <span class={["mc-radio-cards__indicatorDot", classNames?.indicatorDot]} data-dot></span>
      </span>
      <span class={["mc-radio-cards__body", classNames?.body]}>
        <span id={`${uid}-${index}-label`} class={["mc-radio-cards__label", classNames?.label]}>
          {#if option.icon}{@const Icon = option.icon}<span class={["mc-radio-cards__icon", classNames?.icon]}><Icon /></span>{/if}
          <span class={["mc-radio-cards__labelText", classNames?.labelText]}>{option.label}</span>
        </span>
        {#if description}<span id={`${uid}-${index}-description`} class={["mc-radio-cards__description", classNames?.description]}>{description}</span>{/if}
      </span>
      {#if option.meta}<span class={["mc-radio-cards__meta", classNames?.meta]}>{option.meta}</span>{/if}
    </div>
  {/each}
  {#if name}<input type="hidden" {name} value={selected ?? ""} {required} />{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-radio-cards__root {
  position: relative;
  display: grid;
  gap: 10px;
  color: var(--foreground);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-body);
  line-height: var(--leading-body);
}
.mc-radio-cards__root *, .mc-radio-cards__root *::before, .mc-radio-cards__root *::after { box-sizing: border-box; }
.mc-radio-cards__root[data-layout="grid"] { grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--min-column, 180px)), 1fr)); }
.mc-radio-cards__root[data-layout="list"] { grid-template-columns: minmax(0, 1fr); gap: 8px; }

/* The one moving part: a ring that springs from card to card. It sits over the card border so the card itself never changes size. */
.mc-radio-cards__ring {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  border: 1.5px solid var(--control-on);
  border-radius: 20px;
  pointer-events: none;
}

.mc-radio-cards__card {
  position: relative;
  display: grid;
  min-width: 0;
  align-items: start;
  gap: 4px 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
/* The body row takes any spare height, so prices sit on one baseline across a row even when a description wraps. */
.mc-radio-cards__root[data-layout="grid"] .mc-radio-cards__card { grid-template-areas: "body indicator" "meta meta"; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: minmax(0, 1fr) auto; }
.mc-radio-cards__root[data-layout="list"] .mc-radio-cards__card { grid-template-areas: "indicator body meta"; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; padding: 13px 16px 13px 14px; }
.mc-radio-cards__card[data-checked] { background: color-mix(in oklab, var(--control-on) 4%, var(--surface)); }
.mc-radio-cards__card[aria-disabled="true"] { background: var(--surface-muted); cursor: not-allowed; }
.mc-radio-cards__card[aria-disabled="true"] :is(.mc-radio-cards__label, .mc-radio-cards__meta) { color: var(--text-muted); }

.mc-radio-cards__indicator {
  display: grid;
  width: 18px;
  height: 18px;
  flex: none;
  place-items: center;
  grid-area: indicator;
  border: 1.5px solid var(--border-strong);
  border-radius: 50%;
  transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard);
}
.mc-radio-cards__root[data-layout="grid"] .mc-radio-cards__indicator { margin-top: 1px; }
.mc-radio-cards__card[data-checked] .mc-radio-cards__indicator { border-color: var(--control-on); background: var(--control-on); }
.mc-radio-cards__indicatorDot { width: 6px; height: 6px; border-radius: 50%; background: var(--control-glyph); }
.mc-radio-cards__card[aria-disabled="true"] .mc-radio-cards__indicator { border-color: var(--border); }

.mc-radio-cards__body { display: grid; min-width: 0; gap: 2px; grid-area: body; }
.mc-radio-cards__label { display: flex; min-width: 0; align-items: center; gap: 8px; font-weight: 500; }
.mc-radio-cards__labelText { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-radio-cards__icon { display: grid; width: 18px; height: 18px; flex: none; place-items: center; color: var(--text-secondary); }
.mc-radio-cards__icon > svg { width: 18px; height: 18px; }
.mc-radio-cards__card[data-checked] .mc-radio-cards__icon { color: var(--foreground); }
.mc-radio-cards__description { color: var(--text-secondary); font-size: var(--text-xs); line-height: var(--leading-body); text-wrap: pretty; }

.mc-radio-cards__meta { grid-area: meta; color: var(--foreground); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mc-radio-cards__root[data-layout="grid"] .mc-radio-cards__meta { margin-top: 10px; font-size: var(--text-lg); }
.mc-radio-cards__root[data-layout="list"] .mc-radio-cards__meta { font-weight: 500; }

@media (hover: hover) and (pointer: fine) {
  .mc-radio-cards__card:not([data-checked]):not([aria-disabled="true"]):hover { border-color: var(--border-strong); }
}
.mc-radio-cards__card:not([data-checked]):not([aria-disabled="true"]):active { background: var(--surface-muted); }
.mc-radio-cards__card:focus-visible:not([data-checked]) { border-color: var(--border-strong); background: var(--surface-muted); }

@media (prefers-reduced-motion: reduce) {
  .mc-radio-cards__card, .mc-radio-cards__indicator { transition: none; }
}
}
</style>
