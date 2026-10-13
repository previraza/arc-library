<script lang="ts" module>
  export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    label: string;
    options: SelectOption[];
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /** The selected value. Bind it with `bind:value`. */
    value?: string;
    /** Extend the inner, named parts of the select: trigger, valueText, chevron, content, item, indicator or hint. */
    classNames?: { trigger?: string; valueText?: string; chevron?: string; content?: string; item?: string; indicator?: string; hint?: string };
  }

  let { label, options, description, placeholder = "Select…", disabled = false, value = $bindable(), classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let active = $state(-1);

  const selected = $derived(options.find((option) => option.value === value));
  const enabled = $derived(options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled));

  async function show() {
    if (disabled) return;
    open = true;
    active = Math.max(0, options.findIndex((option) => option.value === value));
    await tick();
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }

  function hide(refocus = false) {
    open = false;
    if (refocus) root?.querySelector<HTMLElement>("button")?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    value = option.value;
    hide(true);
  }

  async function move(step: number) {
    const list = enabled;
    if (!list.length) return;
    const at = list.findIndex(({ index }) => index === active);
    active = list[(at + step + list.length) % list.length].index;
    await tick();
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "ArrowDown") move(1);
    else if (event.key === "ArrowUp") move(-1);
    else if (event.key === "Home") active = enabled[0]?.index ?? -1;
    else if (event.key === "End") active = enabled.at(-1)?.index ?? -1;
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") hide(true);
    else if (event.key === "Tab") hide();
    else if (event.key.length === 1) {
      // Type-ahead: jump to the next option starting with the typed letter.
      const letter = event.key.toLowerCase();
      const next = options.findIndex((option, index) => index > active && !option.disabled && option.label.toLowerCase().startsWith(letter));
      const first = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(letter));
      if (next >= 0 || first >= 0) active = next >= 0 ? next : first;
      return;
    } else return;
    event.preventDefault();
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) hide();
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-select">
  <span id="{id}-label" class="mc-select__label">{label}</span>
  <div class="mc-select__anchor">
    <button
      type="button"
      role="combobox"
      class={["mc-select__trigger", classNames?.trigger]}
      aria-labelledby="{id}-label"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls="{id}-list"
      aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
      data-state={open ? "open" : "closed"}
      {disabled}
      onclick={() => (open ? hide() : show())}
      onkeydown={onKeydown}
    >
      <span class={["mc-select__value", { "mc-select__value--placeholder": !selected }, classNames?.valueText]}>{selected?.label ?? placeholder}</span>
      <svg class={["mc-select__chevron", classNames?.chevron]} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    {#if open}
      <ul id="{id}-list" role="listbox" aria-labelledby="{id}-label" class={["mc-select__content", classNames?.content]}>
        {#each options as option, index (option.value)}
          <li
            id="{id}-option-{index}"
            role="option"
            aria-selected={option.value === value}
            aria-disabled={option.disabled || undefined}
            data-active={active === index || undefined}
            class={["mc-select__item", classNames?.item]}
            onpointermove={() => !option.disabled && (active = index)}
            onclick={() => choose(index)}
            onkeydown={() => {}}
          >
            <span>{option.label}</span>
            {#if option.value === value}
              <svg class={["mc-select__indicator", classNames?.indicator]} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if description}<span class={["mc-select__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-select { display: grid; gap: var(--space-2); min-width: 0; }
.mc-select__label { font-size: var(--text-sm); font-weight: 500; }
.mc-select__anchor { position: relative; }
.mc-select__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-select__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-select__trigger[data-state="open"], .mc-select__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-select__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-select__value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-select__value--placeholder { color: var(--text-muted); }
.mc-select__chevron { flex: 0 0 auto; color: var(--text-muted); transition: transform var(--duration-spring, .3s) var(--ease-spring, var(--ease-standard)); }
.mc-select__trigger[data-state="open"] .mc-select__chevron { transform: rotate(180deg); }
.mc-select__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: min(320px, 60vh); margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-select-in .18s var(--ease-enter) both; transform-origin: top center; }
.mc-select__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-select__item[data-active] { background: var(--surface-muted); }
.mc-select__item[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-select__indicator { flex: 0 0 auto; }
.mc-select__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-select-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-select__trigger, .mc-select__chevron { transition: none; } .mc-select__content { animation: none; } }
}
</style>
