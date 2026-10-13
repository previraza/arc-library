<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { tick } from "svelte";
  import { ChevronDown, Clock3 } from "@lucide/svelte";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    /** The time as "HH:MM", on a 24 hour clock. Bind it with `bind:value`. */
    value?: string;
    description?: string;
    placeholder?: string;
    minuteStep?: 1 | 5 | 10 | 15 | 30;
    format?: "12h" | "24h";
    disabled?: boolean;
    /** Extend the inner, named parts of the time picker: label, anchor, trigger, valueText, value, placeholder, chevron, menu, option, dot or description. */
    classNames?: { label?: string; anchor?: string; trigger?: string; valueText?: string; value?: string; placeholder?: string; chevron?: string; menu?: string; option?: string; dot?: string; description?: string };
  }

  let { label, value = $bindable("09:00"), description, placeholder = "Select a time", minuteStep = 15, format = "12h", disabled = false, classNames }: Props = $props();

  const id = $props.id();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  let root: HTMLElement;
  let menu = $state<HTMLElement>();
  let open = $state(false);
  let activeIndex = $state(-1);
  let centerOnOpen = false;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;

  const pad = (n: number) => String(n).padStart(2, "0");
  const toMinutes = (raw: string) => {
    const [h, m] = raw.split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
  };
  const options = $derived(Array.from({ length: Math.ceil(1440 / minuteStep) }, (_, index) => `${pad(Math.floor((index * minuteStep) / 60))}:${pad((index * minuteStep) % 60)}`));
  const display = (raw: string) => {
    const minutes = toMinutes(raw);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return format === "24h" ? `${pad(hour)}:${pad(minute)}` : `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? "AM" : "PM"}`;
  };

  // The shown time rolls like a clock face: a later time rises from below, an earlier one drops from above.
  let direction = 1;
  let previous = value;
  $effect.pre(() => {
    if (previous !== value) direction = toMinutes(value) >= toMinutes(previous) ? 1 : -1;
    previous = value;
  });

  $effect(() => {
    const close = (event: PointerEvent) => { if (!root.contains(event.target as Node)) open = false; };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  });

  // Scroll only the menu, never the page: the selected time opens centered, arrow keys then keep the highlight in view.
  $effect(() => {
    if (!open || activeIndex < 0) return;
    const index = activeIndex;
    tick().then(() => {
      const option = menu?.children[index] as HTMLElement | undefined;
      if (!option || !menu) return;
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (centerOnOpen) {
        centerOnOpen = false;
        menu.scrollTop = top - (menu.clientHeight - option.offsetHeight) / 2;
      } else if (top < menu.scrollTop) menu.scrollTop = top;
      else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
    });
  });

  const choose = (next: string) => {
    value = next;
    open = false;
  };
  const openMenu = () => {
    const selectedIndex = options.indexOf(value);
    activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    centerOnOpen = true;
    open = true;
  };
  function onkeydown(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); open = false; return; }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && activeIndex >= 0) choose(options[activeIndex]);
      else openMenu();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return void openMenu();
      activeIndex = (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    }
  }

  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const rollIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, direction * 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const rollOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, direction * -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" })(node);
  const menuIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const menuOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }, { opacity: 1, y: 0, scale: 1 }, { duration: duration.instant, ease: "standard" });
</script>

<div bind:this={root} class="mc-time-picker__field">
  <span id={labelId} class={["mc-time-picker__label", classNames?.label]}>{label}</span>
  <div class={["mc-time-picker__anchor", classNames?.anchor]}>
    <button type="button" class={["mc-time-picker__trigger", classNames?.trigger]} {disabled} aria-labelledby={`${labelId} ${valueId}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} onclick={() => (open ? (open = false) : openMenu())} {onkeydown}>
      <Clock3 size={16} aria-hidden="true" />
      <span id={valueId} class="mc-time-picker__srOnly">{value ? display(value) : placeholder}</span>
      <span class={["mc-time-picker__valueText", classNames?.valueText]} aria-hidden="true">
        {#key value || "placeholder"}
          <span class={value ? ["mc-time-picker__value", classNames?.value] : ["mc-time-picker__placeholder", classNames?.placeholder]} in:rollIn out:rollOut>{value ? display(value) : placeholder}</span>
        {/key}
      </span>
      <ChevronDown class={["mc-time-picker__chevron", classNames?.chevron]} size={16} aria-hidden="true" />
    </button>
    {#if open}
      <div id={`${id}-listbox`} bind:this={menu} class={["mc-time-picker__menu", classNames?.menu]} role="listbox" aria-label={`${label} options`} in:menuIn out:menuOut>
        {#each options as option, index (option)}
          <button id={`${id}-option-${index}`} type="button" role="option" aria-selected={option === value} data-active={activeIndex === index || undefined} class={["mc-time-picker__option", classNames?.option]} onpointermove={() => (activeIndex = index)} onclick={() => choose(option)}>
            {display(option)}{#if option === value}<span class={["mc-time-picker__dot", classNames?.dot]} aria-hidden="true"></span>{/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  {#if description}<span class={["mc-time-picker__description", classNames?.description]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-time-picker__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-time-picker__label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
.mc-time-picker__anchor { position: relative; min-width: 0; }
/* The trigger anchors the menu, so press feedback stays in color; it never scales. */
.mc-time-picker__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-time-picker__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-time-picker__trigger:active:not(:disabled), .mc-time-picker__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-time-picker__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-time-picker__trigger > svg:first-child { flex: 0 0 auto; color: var(--text-muted); }
.mc-time-picker__valueText { display: grid; flex: 1; min-width: 0; grid-template-columns: minmax(0, 1fr); }
.mc-time-picker__valueText > span { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-time-picker__value { font-variant-numeric: tabular-nums; }
.mc-time-picker__placeholder, .mc-time-picker__description { color: var(--text-muted); }
.mc-time-picker__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-time-picker__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-time-picker__trigger[aria-expanded="true"] .mc-time-picker__chevron { transform: rotate(180deg); }
.mc-time-picker__description { font-size: var(--text-xs); }
.mc-time-picker__menu { position: absolute; z-index: 80; top: calc(100% + 6px); right: 0; left: 0; max-height: 250px; overflow-y: auto; overscroll-behavior: contain; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: top center; will-change: transform, opacity; }
/* Arrow keys move the highlight often, so it changes almost instantly. The dot marks the chosen time, so only one row is ever highlighted. */
.mc-time-picker__option { display: flex; width: 100%; min-height: 36px; align-items: center; justify-content: space-between; border: 0; border-radius: calc(var(--radius-panel) - 5px); padding: 0 12px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: left; cursor: pointer; transition: background-color 80ms var(--ease-standard); }
.mc-time-picker__option[data-active="true"] { background: var(--surface-muted); }
.mc-time-picker__dot { width: 6px; height: 6px; border-radius: 999px; background: var(--foreground); }
@media (prefers-reduced-motion: reduce) { .mc-time-picker__trigger, .mc-time-picker__chevron, .mc-time-picker__option { transition: none; } }
}
</style>
