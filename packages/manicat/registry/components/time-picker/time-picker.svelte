<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    label: string;
    description?: string;
    placeholder?: string;
    minuteStep?: 1 | 5 | 10 | 15 | 30;
    format?: "12h" | "24h";
    disabled?: boolean;
    /** The time as "HH:MM" in 24-hour form. Bind it with `bind:value`. */
    value?: string;
    /** Extend the inner, named parts of the time picker: trigger, menu, option or hint. */
    classNames?: { trigger?: string; menu?: string; option?: string; hint?: string };
  }

  let { label, description, placeholder = "Select a time", minuteStep = 15, format = "12h", disabled = false, value = $bindable("09:00"), classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let open = $state(false);
  let active = $state(0);

  const times = $derived(
    Array.from({ length: (24 * 60) / minuteStep }, (_, index) => {
      const minutes = index * minuteStep;
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    }),
  );

  function display(time: string) {
    const [h, m] = time.split(":").map(Number);
    if (format === "24h") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }

  async function show() {
    if (disabled) return;
    open = true;
    active = Math.max(0, times.indexOf(value));
    await tick();
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "center" });
  }

  function choose(index: number) {
    value = times[index];
    open = false;
  }

  async function onKeydown(event: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "ArrowDown") active = Math.min(times.length - 1, active + 1);
    else if (event.key === "ArrowUp") active = Math.max(0, active - 1);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape" || event.key === "Tab") open = false;
    else return;
    event.preventDefault();
    await tick();
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-time">
  <span id="{id}-label" class="mc-time__label">{label}</span>
  <div class="mc-time__anchor">
    <button
      type="button"
      role="combobox"
      class={["mc-time__trigger", classNames?.trigger]}
      aria-labelledby="{id}-label"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls="{id}-list"
      {disabled}
      onclick={() => (open ? (open = false) : show())}
      onkeydown={onKeydown}
    >
      <span class={{ "mc-time__placeholder": !value }}>{value ? display(value) : placeholder}</span>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
    </button>
    {#if open}
      <ul id="{id}-list" role="listbox" aria-labelledby="{id}-label" class={["mc-time__menu", classNames?.menu]}>
        {#each times as time, index (time)}
          <li id="{id}-option-{index}" role="option" aria-selected={time === value} data-active={active === index || undefined} class={["mc-time__option", classNames?.option]} onpointermove={() => (active = index)} onclick={() => choose(index)} onkeydown={() => {}}>
            {display(time)}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if description}<span class={["mc-time__hint", classNames?.hint]}>{description}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-time { display: grid; gap: var(--space-2); min-width: 0; }
.mc-time__label { font-size: var(--text-sm); font-weight: 500; }
.mc-time__anchor { position: relative; }
.mc-time__trigger { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-time__trigger:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-time__trigger[aria-expanded="true"], .mc-time__trigger:focus-visible { border-color: var(--border-strong); outline: none; }
.mc-time__trigger:disabled { opacity: .5; cursor: not-allowed; }
.mc-time__placeholder { color: var(--text-muted); }
.mc-time__menu { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: 100%; max-height: 260px; margin: 0; padding: 4px; overflow: auto; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-time-in .18s var(--ease-enter) both; }
.mc-time__option { display: flex; align-items: center; min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); font-variant-numeric: tabular-nums; cursor: pointer; }
.mc-time__option[data-active] { background: var(--surface-muted); }
.mc-time__option[aria-selected="true"] { font-weight: 600; }
.mc-time__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-time-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-time__menu { animation: none; } }
}
</style>
