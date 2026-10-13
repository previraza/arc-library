<script lang="ts" module>
  export interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { tick } from "svelte";

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
    /** Extend the inner, named parts of the multi select: trigger, chip, content, item or hint. */
    classNames?: { trigger?: string; chip?: string; content?: string; item?: string; hint?: string };
  }

  let { label, options, placeholder = "Select options", description, maxVisible = 2, disabled = false, value = $bindable([]), classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let active = $state(0);

  const labels = $derived(value.map((entry) => options.find((option) => option.value === entry)?.label).filter(Boolean) as string[]);

  function toggle(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    value = value.includes(option.value) ? value.filter((entry) => entry !== option.value) : [...value, option.value];
  }

  async function move(step: number) {
    const count = options.length;
    let next = active;
    for (let tries = 0; tries < count; tries += 1) {
      next = (next + step + count) % count;
      if (!options[next].disabled) break;
    }
    active = next;
    await tick();
    document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open = true;
      }
      return;
    }
    if (event.key === "ArrowDown") move(1);
    else if (event.key === "ArrowUp") move(-1);
    else if (event.key === "Enter" || event.key === " ") toggle(active);
    else if (event.key === "Escape" || event.key === "Tab") open = false;
    else return;
    event.preventDefault();
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-multi">
  <span id="{id}-label" class="mc-multi__label">{label}</span>
  <div class="mc-multi__anchor">
    <button
      type="button"
      role="combobox"
      class={["mc-multi__trigger", classNames?.trigger]}
      aria-labelledby="{id}-label"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls="{id}-list"
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      {disabled}
      onclick={() => (open = !open)}
      onkeydown={onKeydown}
    >
      <span class="mc-multi__chips">
        {#if labels.length === 0}<span class="mc-multi__placeholder">{placeholder}</span>{/if}
        {#each labels.slice(0, maxVisible) as entry (entry)}<span class={["mc-multi__chip", classNames?.chip]}>{entry}</span>{/each}
        {#if labels.length > maxVisible}<span class="mc-multi__more">+{labels.length - maxVisible}</span>{/if}
      </span>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    {#if open}
      <ul id="{id}-list" role="listbox" aria-multiselectable="true" aria-labelledby="{id}-label" class={["mc-multi__content", classNames?.content]}>
        {#each options as option, index (option.value)}
          <li
            id="{id}-option-{index}"
            role="option"
            aria-selected={value.includes(option.value)}
            aria-disabled={option.disabled || undefined}
            data-active={active === index || undefined}
            class={["mc-multi__item", classNames?.item]}
            onpointermove={() => !option.disabled && (active = index)}
            onclick={() => toggle(index)}
            onkeydown={() => {}}
          >
            <span class="mc-multi__box" data-on={value.includes(option.value) || undefined}>
              {#if value.includes(option.value)}<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>{/if}
            </span>
            {option.label}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if description}<span class={["mc-multi__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-multi { display: grid; gap: var(--space-2); min-width: 0; }
.mc-multi__label { font-size: var(--text-sm); font-weight: 500; }
.mc-multi__anchor { position: relative; }
.mc-multi__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; min-height: var(--control-height-md); padding: 4px var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--text-muted); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-multi__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-multi__trigger[aria-expanded="true"], .mc-multi__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-multi__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-multi__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
.mc-multi__placeholder { color: var(--text-muted); }
.mc-multi__chip { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--foreground); font-size: var(--text-xs); font-weight: 500; }
.mc-multi__more { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-multi__content { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: min(320px, 60vh); margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-multi-in .18s var(--ease-enter) both; }
.mc-multi__item { display: flex; align-items: center; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); color: var(--foreground); font-size: var(--text-sm); cursor: pointer; }
.mc-multi__item[data-active] { background: var(--surface-muted); }
.mc-multi__item[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.mc-multi__box { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--control-glyph); }
.mc-multi__box[data-on] { border-color: var(--control-on); background: var(--control-on); }
.mc-multi__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-multi-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-multi__content { animation: none; } }
}
</style>
