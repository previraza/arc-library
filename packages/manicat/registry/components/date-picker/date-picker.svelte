<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { tick } from "svelte";
  import { CalendarDays, ChevronDown } from "@lucide/svelte";
  import Calendar from "@/registry/components/calendar/calendar.svelte";
  import { startOfMonth } from "@/lib/calendar";
  import type { CalendarDateMatcher } from "@/lib/calendar";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    /** The chosen date. Bind it with `bind:value`. */
    value?: Date;
    description?: string;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: CalendarDateMatcher;
    locale?: string;
    format?: Intl.DateTimeFormatOptions;
    /** Adds a Today button to the calendar header. */
    showToday?: boolean;
    disabled?: boolean;
    id?: string;
    class?: string;
    /** Extend the inner, named parts of the date picker: label, anchor, trigger, valueText, value, part, partValue, placeholder, chevron, popover, footer, status or description. */
    classNames?: { label?: string; anchor?: string; trigger?: string; valueText?: string; value?: string; part?: string; partValue?: string; placeholder?: string; chevron?: string; popover?: string; footer?: string; status?: string; description?: string };
    [key: string]: unknown;
  }

  let { label, value = $bindable(), description, placeholder = "Select a date", minDate, maxDate, disabledDates, locale = "en-US", format = { month: "short", day: "numeric", year: "numeric" }, showToday = false, disabled = false, id, class: className, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  const hintId = $derived(description ? `${controlId}-description` : undefined);
  let open = $state(false);
  let month = $state(startOfMonth(value ?? new Date()));
  let root: HTMLElement;
  let trigger: HTMLElement;
  let popover = $state<HTMLElement>();
  let valueEl = $state<HTMLElement>();
  let closeTimer: number | undefined;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;

  const formatter = $derived(new Intl.DateTimeFormat(locale, format));
  const time = $derived(value?.getTime() ?? null);
  // Each part of the date rolls with time: a later date rises from below, an earlier one drops from above. Parts that did not change stay still.
  let direction = 1;
  let previousTime = time;
  $effect.pre(() => {
    if (previousTime !== time) direction = time === null || previousTime === null || time >= previousTime ? 1 : -1;
    previousTime = time;
  });
  const shown = $derived(value ? formatter.format(value) : placeholder);
  const parts = $derived(value ? formatter.formatToParts(value) : []);
  // Parts after a wider or narrower segment move on the same curve the new text arrives on, so they never overlap it.
  const flip = createFlip(() => [...(valueEl?.querySelectorAll<HTMLElement>("[data-part]") ?? [])], { reduced, transition: { duration: duration.standard, ease: "enter" } });
  $effect.pre(() => {
    time;
    flip.measure();
  });
  $effect(() => {
    time;
    flip.play();
  });

  $effect(() => {
    const onPointerdown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) {
        window.clearTimeout(closeTimer);
        open = false;
      }
    };
    document.addEventListener("pointerdown", onPointerdown);
    return () => {
      document.removeEventListener("pointerdown", onPointerdown);
      window.clearTimeout(closeTimer);
    };
  });

  /** Opening moves focus to the day that owns the tab stop, so arrows work at once; a pointer open shows no ring. */
  $effect(() => {
    if (!open) return;
    tick().then(() => popover?.querySelector<HTMLButtonElement>('[data-present] [data-date][tabindex="0"]')?.focus({ preventScroll: true }));
  });

  /** Closing hands focus back to the trigger when it was inside the calendar, so keyboard users never land on the page body. */
  const close = () => {
    window.clearTimeout(closeTimer);
    if (popover?.contains(document.activeElement)) trigger.focus();
    open = false;
  };
  /** The calendar always opens on the month of the current value, or today's month. */
  const show = () => {
    window.clearTimeout(closeTimer);
    month = startOfMonth(value ?? new Date());
    open = true;
  };
  /** A picked day lets the highlight glide onto it and the footer confirm it, then the calendar returns to the field. */
  const selectDate = (date: Date | undefined) => {
    value = date;
    window.clearTimeout(closeTimer);
    if (reduced || !date) close();
    else closeTimer = window.setTimeout(close, 300);
  };
  function onTriggerKeydown(event: KeyboardEvent) {
    if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open) {
      event.preventDefault();
      show();
    }
    if (event.key === "Escape") close();
  }
  /** Tabbing past the popover closes it; focus moving within the field keeps it open. */
  function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (open && next && !root.contains(next)) {
      window.clearTimeout(closeTimer);
      open = false;
    }
  }

  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const roll = (node: HTMLElement, custom: number) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, custom * 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const rollAway = (node: HTMLElement, custom: number) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, custom * -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: 0.14, ease: "standard" }, { pop: true })(node);
  const partIn = (node: HTMLElement) => roll(node, direction);
  const partOut = (node: HTMLElement) => rollAway(node, direction);
  // The value and the placeholder swap: the value rises in, the placeholder drops in, and whichever leaves goes up.
  const valueIn = (node: HTMLElement) => roll(node, 1);
  const placeholderIn = (node: HTMLElement) => roll(node, -1);
  const wholeOut = (node: HTMLElement) => rollAway(node, 1);
  const statusIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const statusOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: 0.14, ease: "standard" })(node);
  const popoverIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.95 }, { opacity: 1, y: 0, scale: 1 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const popoverOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, { duration: 0.14, ease: "standard" });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={root} class={["mc-date-picker__field", className]} onfocusout={onFocusout}>
  <label class={["mc-date-picker__label", classNames?.label]} for={controlId}>{label}</label>
  <div class={["mc-date-picker__anchor", classNames?.anchor]}>
    <button {...rest} id={controlId} bind:this={trigger} type="button" {disabled} aria-haspopup="dialog" aria-expanded={open} aria-describedby={hintId} class={["mc-date-picker__trigger", classNames?.trigger]} onclick={() => (open ? close() : show())} onkeydown={onTriggerKeydown}>
      <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
      <span class="mc-date-picker__srOnly">{shown}</span>
      <span class={["mc-date-picker__valueText", classNames?.valueText]} aria-hidden="true">
        {#if value}
          <span bind:this={valueEl} class={["mc-date-picker__value", classNames?.value]} in:valueIn out:wholeOut>
            {#each parts as part, index (`${index}-${part.type}`)}
              <span class={["mc-date-picker__part", classNames?.part]} data-part>
                {#if part.type === "literal"}
                  <span class={["mc-date-picker__partValue", classNames?.partValue]}>{part.value}</span>
                {:else}
                  {#key part.value}<span class={["mc-date-picker__partValue", classNames?.partValue]} in:partIn out:partOut>{part.value}</span>{/key}
                {/if}
              </span>
            {/each}
          </span>
        {:else}
          <span class={["mc-date-picker__placeholder", classNames?.placeholder]} in:placeholderIn out:wholeOut>{placeholder}</span>
        {/if}
      </span>
      <ChevronDown class={["mc-date-picker__chevron", classNames?.chevron]} size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
    {#if open}
      <div bind:this={popover} class={["mc-date-picker__popover", classNames?.popover]} role="dialog" aria-label={`${label} calendar`} tabindex="-1" onkeydown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }} in:popoverIn out:popoverOut>
        <Calendar onMonthChange={(next) => (month = next)} {month} {minDate} {maxDate} {disabledDates} {locale} {showToday} bind:value={() => value, selectDate} />
        <div class={["mc-date-picker__footer", classNames?.footer]}>
          <button type="button" onclick={() => selectDate(undefined)} disabled={!value}>Clear</button>
          <span class={["mc-date-picker__status", classNames?.status]}>{#key time ?? "none"}<span in:statusIn out:statusOut>{value ? `Selected ${formatter.format(value)}` : "Choose a day"}</span>{/key}</span>
        </div>
      </div>
    {/if}
  </div>
  {#if description}<span id={hintId} class={["mc-date-picker__description", classNames?.description]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-date-picker__field { display: grid; gap: 7px; min-width: 0; }
.mc-date-picker__label { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-date-picker__anchor { position: relative; min-width: 0; }
/* The trigger anchors the calendar, so press feedback stays in color; it never scales. */
.mc-date-picker__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-date-picker__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-date-picker__trigger:active:not(:disabled), .mc-date-picker__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-date-picker__trigger:disabled { cursor: not-allowed; opacity: .5; }
.mc-date-picker__trigger > svg:first-child { flex: 0 0 auto; color: var(--text-muted); }
/* Old and new values cross in place; each part of a date is its own box so a wider day or month moves the rest along on a spring. */
.mc-date-picker__valueText { position: relative; display: flex; flex: 1; min-width: 0; }
.mc-date-picker__value, .mc-date-picker__part { position: relative; display: inline-flex; white-space: pre; }
.mc-date-picker__value { font-variant-numeric: tabular-nums; }
.mc-date-picker__partValue { display: inline-block; white-space: pre; }
.mc-date-picker__placeholder { min-width: 0; overflow: hidden; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; }
.mc-date-picker__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-date-picker__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-date-picker__trigger[aria-expanded="true"] .mc-date-picker__chevron { transform: rotate(180deg); }
/* Grows out of the trigger's calendar icon and returns there on close. */
.mc-date-picker__popover { position: absolute; z-index: 20; top: calc(100% + 8px); left: 0; width: min(320px, calc(100vw - 32px)); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 16px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: 22px -8px; will-change: transform, opacity; }
/* On phone widths the calendar matches the field instead of running past the screen edge, and a tighter inset keeps the month and its controls on one row. */
@media (max-width: 360px) { .mc-date-picker__popover { right: 0; width: auto; padding: 12px; } }
.mc-date-picker__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 11px; color: var(--text-muted); font-size: var(--text-xs); }
/* Old and new status lines share one cell, pinned to the trailing edge so a shorter line never shifts. */
.mc-date-picker__status { display: grid; min-width: 0; justify-items: end; }
.mc-date-picker__status > span { grid-area: 1 / 1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-date-picker__footer button { border: 0; border-radius: var(--radius-control); padding: 4px 8px; background: transparent; color: var(--text-secondary); font: inherit; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-date-picker__footer button:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); } }
.mc-date-picker__footer button:active:not(:disabled) { transform: scale(.97); transition-duration: var(--duration-fast), var(--duration-fast), 100ms; transition-timing-function: var(--ease-standard); }
.mc-date-picker__footer button:disabled { cursor: not-allowed; opacity: .4; }
.mc-date-picker__description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); transition: opacity var(--duration-fast) var(--ease-standard); }
/* The open calendar covers the hint; fading it keeps its first letters from peeking past the popover's rounded corner. */
.mc-date-picker__anchor:has(.mc-date-picker__popover) + .mc-date-picker__description { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .mc-date-picker__trigger, .mc-date-picker__chevron, .mc-date-picker__footer button, .mc-date-picker__description { transition: none; } .mc-date-picker__footer button:active:not(:disabled) { transform: none; } }
}
</style>
