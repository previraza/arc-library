<script lang="ts" module>
  export interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { ChevronDown, X } from "@lucide/svelte";
  import { curveOf, poseTransition, pressAction } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    options: MultiSelectOption[];
    placeholder?: string;
    description?: string;
    /** How many chosen labels show in the trigger before it summarises as "+N". */
    maxVisible?: number;
    disabled?: boolean;
    /** The chosen values. Bind them with `bind:value`. */
    value?: string[];
    /** Extend the inner, named parts of the multi select: slot or clear. */
    classNames?: { slot?: string; clear?: string };
  }

  let { label, options, placeholder = "Select options", description, maxVisible = 2, disabled = false, value = $bindable([]), classNames }: Props = $props();

  const id = $props.id();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  let root = $state<HTMLElement>();
  let open = $state(false);
  let activeIndex = $state(-1);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;

  const selectedSet = $derived(new Set(value));
  const labelFor = (item: string) => options.find((option) => option.value === item)?.label ?? item;
  const visible = $derived(value.slice(0, maxVisible).map((item) => ({ value: item, label: labelFor(item) })));
  const remaining = $derived(Math.max(0, value.length - visible.length));
  // A larger count rises from below, a smaller one drops from above.
  let countDirection = 1;
  let previousRemaining = 0;
  $effect.pre(() => {
    countDirection = remaining < previousRemaining ? -1 : 1;
    previousRemaining = remaining;
  });
  // A closed menu forgets its highlight, so the next open starts clean instead of on a stale hovered row.
  $effect(() => { if (!open) activeIndex = -1; });

  $effect(() => {
    const close = (event: PointerEvent) => { if (!root?.contains(event.target as Node)) open = false; };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  });

  const toggle = (option: MultiSelectOption) => {
    if (disabled || option.disabled) return;
    value = selectedSet.has(option.value) ? value.filter((item) => item !== option.value) : [...value, option.value];
  };
  const clear = () => {
    value = [];
    open = false;
  };
  const enabled = $derived(options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0));
  function onkeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === "Enter" && open && activeIndex >= 0) { event.preventDefault(); toggle(options[activeIndex]); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open = !open; return; }
    if (event.key === "Escape") { open = false; return; }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && enabled.length) {
      event.preventDefault();
      open = true;
      const current = enabled.indexOf(activeIndex);
      const next = current < 0 ? (event.key === "ArrowDown" ? 0 : enabled.length - 1) : event.key === "ArrowDown" ? (current + 1) % enabled.length : (current - 1 + enabled.length) % enabled.length;
      activeIndex = enabled[next];
    }
  }

  // Each chip sits in a slot whose width opens and collapses on a spring, so neighbours travel with it and nothing overlaps.
  function slotMotion(node: HTMLElement, { out = false }: { out?: boolean }) {
    if (reduced) return poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.instant })(node);
    const natural = node.offsetWidth;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return {
      duration: length,
      easing,
      css: (t: number) => `width: ${natural * t}px; opacity: ${Math.min(1, t / (out ? 0.3 : 0.5))};`,
    };
  }
  const chipMotion = (node: HTMLElement, { out = false }: { out?: boolean }) =>
    reduced
      ? poseTransition({}, {}, { duration: 0 })(node)
      : out
        ? poseTransition({ scale: 0.9, blur: blur.subtle }, { scale: 1, blur: 0 }, { duration: duration.instant, ease: "standard" })(node)
        : poseTransition({ scale: 0.9, blur: blur.soft }, { scale: 1, blur: 0 }, { spring: "snappy", fade: duration.standard })(node);
  const fade = (node: HTMLElement) => poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.instant })(node);

  // The overflow count rolls: a larger number rises from below, a smaller one drops from above.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  function roll(node: HTMLElement, { out = false }: { out?: boolean }) {
    if (reduced) return fade(node);
    const offset = em(node, (out ? -0.5 : 0.5) * countDirection);
    return poseTransition({ opacity: 0, y: offset, blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, out ? { duration: duration.instant, ease: "standard" } : { duration: duration.standard, ease: "enter" })(node);
  }

  // The clear button scales and blurs in on a spring and leaves a little faster.
  const clearAway = { opacity: 0, scale: 0.6, blur: blur.subtle };
  const clearIn = poseTransition(reduced ? { opacity: 0 } : clearAway, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const clearOut = poseTransition(reduced ? { opacity: 0 } : clearAway, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.instant, ease: "standard" });
  // The menu drops in from just above on a spring.
  const menuIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const menuOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }, { opacity: 1, y: 0, scale: 1 }, { duration: duration.instant, ease: "standard" });
  // A check that draws itself when an option is picked and retracts when it is removed.
  const draw = curveOf({ duration: duration.standard, ease: "enter" });
  const check = (node: Element) => ({
    duration: reduced ? duration.instant * 1000 : draw.duration,
    easing: reduced ? (t: number) => t : draw.easing,
    css: (t: number) => `opacity: ${t};${reduced ? "" : ` --check-draw: ${1 - t};`}`,
  });
</script>

<div bind:this={root} class="mc-multi-select__field">
  <span id={labelId} class="mc-multi-select__label">{label}</span>
  <div class="mc-multi-select__control">
    <button type="button" class={["mc-multi-select__trigger", value.length && "mc-multi-select__hasClear"]} {disabled} aria-labelledby={`${labelId} ${valueId}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} onclick={() => (open = !open)} {onkeydown}>
      <span id={valueId} class="mc-multi-select__srOnly">{value.length ? value.map(labelFor).join(", ") : placeholder}</span>
      <span class="mc-multi-select__value" aria-hidden="true">
        {#each visible as item (item.value)}
          <span class={["mc-multi-select__slot", classNames?.slot]} in:slotMotion={{}} out:slotMotion={{ out: true }}><span class="mc-multi-select__chip" in:chipMotion|global={{}} out:chipMotion|global={{ out: true }}>{item.label}</span></span>
        {/each}
        {#if remaining > 0}
          <span class={["mc-multi-select__slot", classNames?.slot]} in:slotMotion={{}} out:slotMotion={{ out: true }}>
            <span class="mc-multi-select__more" in:chipMotion|global={{}} out:chipMotion|global={{ out: true }}>+<span class="mc-multi-select__count">{#key remaining}<span in:roll={{}} out:roll={{ out: true }}>{remaining}</span>{/key}</span></span>
          </span>
        {/if}
        {#if !value.length}
          <span class="mc-multi-select__placeholder" in:fade out:fade>{placeholder}</span>
        {/if}
      </span>
      <ChevronDown class="mc-multi-select__chevron" size={16} aria-hidden="true" />
    </button>
    {#if value.length > 0 && !disabled}
      <button type="button" aria-label="Clear selections" class={["mc-multi-select__clear", classNames?.clear]} onclick={clear} use:pressAction={{ scale: 0.96 }} in:clearIn out:clearOut><X size={14} aria-hidden="true" /></button>
    {/if}
    {#if open}
      <div id={`${id}-listbox`} class="mc-multi-select__menu" role="listbox" aria-label={label} aria-multiselectable="true" in:menuIn out:menuOut>
        {#each options as option, index (option.value)}
          <button type="button" role="option" aria-selected={selectedSet.has(option.value)} aria-disabled={option.disabled || undefined} class="mc-multi-select__option" data-active={activeIndex === index} disabled={option.disabled} onpointermove={() => (activeIndex = index)} onclick={() => toggle(option)}>
            <span>{option.label}</span>
            {#if selectedSet.has(option.value)}
              <svg class="mc-multi-select__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" in:check out:check><path d="M4 12.5 9 17.5 20 6.5" pathLength="1" stroke-dasharray="1" style="stroke-dashoffset: var(--check-draw, 0)" /></svg>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  {#if description}<span class="mc-multi-select__description">{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-multi-select__field { position: relative; display: grid; gap: var(--space-2); min-width: 0; }
.mc-multi-select__control { position: relative; min-width: 0; }
.mc-multi-select__label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
/* The trigger anchors the menu, so press feedback stays in color; it never scales. */
.mc-multi-select__trigger { position: relative; display: flex; width: 100%; min-height: var(--control-height-md); align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: var(--radius-control); padding: 5px 11px 5px 12px; background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-multi-select__trigger:active:not(:disabled), .mc-multi-select__trigger[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-multi-select__trigger:disabled { opacity: .5; cursor: not-allowed; }
/* The chevron stays pinned to the trailing edge; a selection only reserves room for the clear button beside it, so nothing jumps. */
.mc-multi-select__hasClear .mc-multi-select__chevron { margin-left: 26px; }
.mc-multi-select__value { position: relative; display: flex; min-width: 0; min-height: 26px; flex: 1; align-items: center; overflow: hidden; }
.mc-multi-select__placeholder, .mc-multi-select__description { color: var(--text-muted); }
/* The placeholder sits outside the flow so the first chip can open its slot from the leading edge. */
.mc-multi-select__placeholder { position: absolute; inset: 0; display: flex; align-items: center; overflow: hidden; white-space: nowrap; }
/* The slot clips while its width springs open or closed; the chip keeps its natural width so the label never re-truncates mid-flight. */
.mc-multi-select__slot { display: flex; flex: 0 1 auto; min-width: 0; overflow: hidden; }
.mc-multi-select__slot:has(.mc-multi-select__more) { flex-shrink: 0; }
.mc-multi-select__chip, .mc-multi-select__more { box-sizing: border-box; flex: 0 0 auto; max-width: 9rem; overflow: hidden; margin-right: 5px; border-radius: var(--radius-pill); padding: 4px 8px; background: var(--surface-muted); box-shadow: inset 0 0 0 1px var(--border-subtle); color: var(--foreground); text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-xs); transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__chip, .mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__more { background: var(--surface); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__trigger:hover:not(:disabled) .mc-multi-select__chip, .mc-multi-select__trigger:hover:not(:disabled) .mc-multi-select__more { background: var(--surface); } }
.mc-multi-select__more { display: inline-flex; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.mc-multi-select__count { display: inline-grid; }
.mc-multi-select__count > span { grid-area: 1 / 1; }
.mc-multi-select__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mc-multi-select__clear { position: absolute; top: 0; bottom: 0; right: 36px; display: grid; width: 22px; height: 22px; margin: auto 0; place-items: center; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-multi-select__clear:hover { background: var(--surface); color: var(--foreground); } }
.mc-multi-select__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-multi-select__trigger[aria-expanded="true"] .mc-multi-select__chevron { transform: rotate(180deg); }
.mc-multi-select__description { font-size: var(--text-xs); }
.mc-multi-select__menu { position: absolute; z-index: 80; top: calc(100% + 8px); right: 0; left: 0; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); box-shadow: var(--shadow-floating); transform-origin: top center; will-change: transform, opacity; }
/* Arrow keys move the highlight often, so it changes almost instantly. Selection is shown by the check, not by weight, so labels never reflow. */
.mc-multi-select__option { display: flex; width: 100%; min-height: 38px; align-items: center; justify-content: space-between; gap: 12px; border: 0; border-radius: calc(var(--radius-panel) - 5px); padding: 0 11px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: background-color 80ms var(--ease-standard), color 80ms var(--ease-standard); }
.mc-multi-select__option > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-multi-select__option[data-active="true"] { background: var(--surface-muted); }
.mc-multi-select__option:disabled { opacity: .42; cursor: not-allowed; }
.mc-multi-select__check { flex: 0 0 auto; }
@media (prefers-reduced-motion: reduce) { .mc-multi-select__trigger, .mc-multi-select__chevron, .mc-multi-select__option, .mc-multi-select__clear, .mc-multi-select__chip, .mc-multi-select__more { transition: none; } }
}
</style>
