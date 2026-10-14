<script lang="ts" module>
  export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    keywords?: string[];
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount, tick } from "svelte";
  import { Check, ChevronDown, Search, X } from "@lucide/svelte";
  import { followHeight } from "@/lib/command-palette";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    options: ComboboxOption[];
    /** The value of the chosen option. Bind it with `bind:value`. */
    value?: string;
    defaultValue?: string;
    description?: string;
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    id?: string;
    class?: string;
    /** Extend the inner, named parts of the combobox: control, searchIcon, clear, chevron, hint, popover, listbox, option, check or empty. */
    classNames?: { control?: string; searchIcon?: string; clear?: string; chevron?: string; hint?: string; popover?: string; listbox?: string; option?: string; check?: string; empty?: string };
    [key: string]: unknown;
  }

  let { label, options, value = $bindable(), defaultValue = "", description, placeholder = "Search or select…", emptyMessage = "No matches found", disabled = false, id, class: className, classNames, ...rest }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur, ease } = motionTokens;
  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  const listboxId = $derived(`${controlId}-listbox`);
  const hintId = $derived(description ? `${controlId}-description` : undefined);
  let root: HTMLElement;
  let input: HTMLInputElement;
  let auto = $state<HTMLElement>();
  let inner = $state<HTMLElement>();
  let internal = $state(defaultValue);
  let open = $state(false);
  let query = $state("");
  let activeIndex = $state(-1);

  const selectedValue = $derived(value ?? internal);
  const selectedOption = $derived(options.find((option) => option.value === selectedValue));
  const filtered = $derived.by(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return options;
    return options.filter((option) => [option.label, ...(option.keywords ?? [])].some((term) => term.toLocaleLowerCase().includes(normalized)));
  });
  const enabledIndices = $derived(filtered.reduce<number[]>((indices, option, index) => { if (!option.disabled) indices.push(index); return indices; }, []));
  const inputValue = $derived(open ? query : (selectedOption?.label ?? ""));
  const activeOption = $derived(activeIndex >= 0 ? filtered[activeIndex] : undefined);

  // A chosen label settles into the field: it rises in from below with a soft blur. Clearing fades the placeholder in instead of snapping from the old label.
  let settled = selectedValue;
  $effect(() => {
    const next = selectedValue;
    if (settled === next) return;
    settled = next;
    if (!input || reduced || (next && open)) return;
    if (next) animate(input, { opacity: [0, 1], y: ["0.35em", "0em"], filter: [`blur(${blur.soft}px)`, "blur(0px)"] } as never, { duration: duration.standard, ease: [...ease.enter] });
    else animate(input, { opacity: [0, 1] }, { duration: duration.fast, ease: [...ease.enter] });
  });

  // The highlighted option stays in view.
  $effect(() => {
    activeIndex;
    filtered;
    if (!open) return;
    tick().then(() => {
      const option = activeOption ? root.querySelector<HTMLElement>(`[id="${controlId}-option-${activeOption.value}"]`) : null;
      const listbox = option?.parentElement;
      if (option && listbox) {
        const top = option.offsetTop;
        const bottom = top + option.offsetHeight;
        if (top < listbox.scrollTop) listbox.scrollTop = top;
        else if (bottom > listbox.scrollTop + listbox.clientHeight) listbox.scrollTop = bottom - listbox.clientHeight;
      }
    });
  });

  onMount(() => {
    const onPointerdown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) {
        open = false;
        query = "";
      }
    };
    document.addEventListener("pointerdown", onPointerdown);
    return () => document.removeEventListener("pointerdown", onPointerdown);
  });
  // The listbox follows its content height with a critically damped spring, so filtering never snaps the menu.
  $effect(() => {
    if (!auto || !inner) return;
    return followHeight(auto, inner, reduced);
  });

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    internal = option.value;
    value = option.value;
    query = "";
    open = false;
    input.focus();
  };
  function clear(event: MouseEvent) {
    event.preventDefault();
    internal = "";
    value = "";
    query = "";
    open = true;
    input.focus();
  }
  function openMenu() {
    if (disabled) return;
    open = true;
    query = "";
    activeIndex = -1;
  }
  function onkeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return void openMenu();
      if (!enabledIndices.length) return;
      const current = enabledIndices.indexOf(activeIndex);
      const next = event.key === "ArrowDown" ? (current + 1) % enabledIndices.length : (current - 1 + enabledIndices.length) % enabledIndices.length;
      activeIndex = enabledIndices[next];
      return;
    }
    if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) choose(option);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      open = false;
      query = "";
    }
  }

  const clearIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const clearOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.instant, ease: "standard" });
  const popoverIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, reduced ? { duration: duration.instant } : { spring: "snappy", fade: duration.fast });
  const popoverOut = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }, { opacity: 1, y: 0, scale: 1 }, { duration: duration.instant, ease: "standard" });
  const emptyIn = poseTransition(reduced ? {} : { opacity: 0, y: 4, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" });
</script>

<div bind:this={root} class={["mc-combobox__field", className]}>
  <label for={controlId}>{label}</label>
  <div class={["mc-combobox__control", open && "mc-combobox__open", disabled && "mc-combobox__disabled", className, classNames?.control]}>
    <Search class={["mc-combobox__searchIcon", classNames?.searchIcon]} size={16} strokeWidth={1.75} aria-hidden="true" />
    <input
      {...rest}
      id={controlId}
      bind:this={input}
      type="text"
      role="combobox"
      value={inputValue}
      placeholder={selectedOption?.label ?? placeholder}
      {disabled}
      aria-describedby={hintId}
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={open && activeOption ? `${controlId}-option-${activeOption.value}` : undefined}
      onfocus={openMenu}
      onclick={openMenu}
      oninput={(event) => { query = (event.target as HTMLInputElement).value; open = true; activeIndex = -1; }}
      {onkeydown}
    />
    {#if selectedOption && !disabled}
      <button type="button" class={["mc-combobox__clear", classNames?.clear]} aria-label="Clear selection" onmousedown={(event) => event.preventDefault()} onclick={clear} in:clearIn out:clearOut><X size={16} strokeWidth={1.75} aria-hidden="true" /></button>
    {/if}
    <ChevronDown class={["mc-combobox__chevron", classNames?.chevron]} size={16} strokeWidth={1.75} aria-hidden="true" />
  </div>
  {#if description}<span id={hintId} class={["mc-combobox__hint", classNames?.hint]}>{description}</span>{/if}
  {#if open}
    <div class={["mc-combobox__popover", classNames?.popover]} role="presentation" in:popoverIn out:popoverOut>
      <div bind:this={auto} class="mc-combobox__autoHeight">
        <div bind:this={inner}>
          <div id={listboxId} class={["mc-combobox__listbox", classNames?.listbox]} role="listbox" aria-label={`${label} options`}>
            {#each filtered as option, index (option.value)}
              <div id={`${controlId}-option-${option.value}`} class={["mc-combobox__option", classNames?.option]} data-active={index === activeIndex ? "true" : undefined} data-disabled={option.disabled ? "true" : undefined} role="option" tabindex="-1" aria-selected={option.value === selectedValue} aria-disabled={option.disabled || undefined} onmousedown={(event) => event.preventDefault()} onmouseenter={() => !option.disabled && (activeIndex = index)} onclick={() => choose(option)} onkeydown={() => undefined}>
                <span>{option.label}</span>
                {#if option.value === selectedValue}<Check class={["mc-combobox__check", classNames?.check]} size={16} strokeWidth={1.75} aria-hidden="true" />{/if}
              </div>
            {:else}
              <div class={["mc-combobox__empty", classNames?.empty]} role="status" in:emptyIn>{emptyMessage}</div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-combobox__field { position: relative; display: grid; gap: var(--space-2); min-width: 0; }
.mc-combobox__field label { font-size: var(--text-sm); font-weight: 500; }
.mc-combobox__control { position: relative; z-index: 2; display: flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-2); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-combobox__control:hover:not(.mc-combobox__disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-combobox__control:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--focus-ring); }
.mc-combobox__control.mc-combobox__open { border-color: var(--border-strong); background: var(--surface-muted); }
.mc-combobox__control.mc-combobox__disabled { opacity: .5; cursor: not-allowed; }
.mc-combobox__searchIcon { flex: 0 0 auto; color: var(--text-muted); }
.mc-combobox__control input { width: 100%; min-width: 0; border: 0; outline: 0; padding: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-combobox__control input:focus-visible { outline: none; }
.mc-combobox__control input::placeholder { color: var(--text-muted); }
.mc-combobox__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring) var(--ease-spring); }
.mc-combobox__open .mc-combobox__chevron { transform: rotate(180deg); }
.mc-combobox__clear { display: grid; width: 22px; height: 22px; flex: 0 0 auto; place-items: center; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-combobox__clear:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-combobox__clear:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
.mc-combobox__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-combobox__popover { position: absolute; z-index: 80; top: calc(100% + 8px); right: 0; left: 0; overflow: hidden; transform-origin: top center; border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 5px; background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); will-change: transform, opacity; }
.mc-combobox__autoHeight { overflow: hidden; }
.mc-combobox__listbox { max-height: min(300px, 40vh); overflow-y: auto; overscroll-behavior: contain; }
/* Arrow keys move the highlight often, so it changes almost instantly. */
.mc-combobox__option { display: flex; min-height: 36px; align-items: center; justify-content: space-between; gap: var(--space-3); border-radius: calc(var(--radius-panel) - 5px); padding: 0 12px; color: var(--foreground); font-size: var(--text-sm); cursor: pointer; outline: none; user-select: none; transition: background-color 80ms var(--ease-standard), color 80ms var(--ease-standard); }
.mc-combobox__option > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-combobox__option[data-active="true"] { background: var(--surface-muted); }
.mc-combobox__option[data-disabled="true"] { opacity: .42; cursor: not-allowed; }
.mc-combobox__check { flex: 0 0 auto; color: var(--foreground); }
.mc-combobox__empty { padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
@media (prefers-reduced-motion: reduce) { .mc-combobox__control, .mc-combobox__chevron, .mc-combobox__clear, .mc-combobox__option { transition: none; } }
}
</style>
