<script lang="ts" module>
  import type { PhoneCountry, PhoneStatus } from "@/lib/phone";

  export interface PhoneInputDetails {
    country: PhoneCountry;
    formatted: string;
    status: PhoneStatus;
    valid: boolean;
  }
</script>

<script lang="ts">
  import { tick, untrack } from "svelte";
  import { BY_ISO, PHONE_COUNTRIES, capDigits, flagOf, formatNational, onlyDigits, parsePhoneNumber, statusOf, toE164 } from "@/lib/phone";

  interface Props {
    label: string;
    defaultCountry?: string;
    countries?: string[];
    preferredCountries?: string[];
    description?: string;
    error?: string;
    /** Show a message after blur when the number has the wrong length. */
    validate?: boolean;
    disabled?: boolean;
    /** The number in E.164, such as "+14155550132". Bind it with `bind:value`. */
    value?: string;
    onchange?: (details: PhoneInputDetails) => void;
    oncountrychange?: (iso: string) => void;
    /** Extend the inner, named parts of the phone input: shell, flag, input, list, option or hint. */
    classNames?: { shell?: string; flag?: string; input?: string; list?: string; option?: string; hint?: string };
  }

  let { label, defaultCountry = "US", countries, preferredCountries = ["US", "CA", "GB"], description, error, validate = true, disabled = false, value = $bindable(""), onchange, oncountrychange, classNames }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLElement>();
  let search = $state<HTMLInputElement>();
  let open = $state(false);
  let query = $state("");
  let active = $state(0);
  let touched = $state(false);

  const pool = $derived(countries ? PHONE_COUNTRIES.filter((entry) => countries.includes(entry.iso)) : PHONE_COUNTRIES);
  const start = untrack(() => parsePhoneNumber(value, pool));
  let iso = $state(start?.country.iso ?? untrack(() => defaultCountry));
  let digits = $state(start?.national ?? "");

  const country = $derived(BY_ISO.get(iso) ?? pool[0]);
  const status = $derived(statusOf(country, digits));
  const formatted = $derived(formatNational(country, digits));

  // A value changed from outside replaces what was typed.
  $effect(() => {
    const next = value;
    untrack(() => {
      if (next === toE164(country, digits)) return;
      const parsed = parsePhoneNumber(next, pool);
      if (parsed) {
        iso = parsed.country.iso;
        digits = parsed.national;
      } else if (!next) digits = "";
    });
  });

  const needle = $derived(query.trim().toLowerCase().replace(/^\+/, ""));
  const matches = $derived(pool.filter((entry) => !needle || entry.name.toLowerCase().includes(needle) || entry.dial.startsWith(needle) || entry.iso.toLowerCase() === needle));
  const suggested = $derived(needle ? [] : pool.filter((entry) => preferredCountries.includes(entry.iso)));
  const flat = $derived([...suggested, ...matches]);
  const message = $derived(error ?? (validate && touched && status !== "empty" && status !== "valid" ? (status === "too-long" ? "This number is too long." : "This number looks incomplete.") : undefined));

  function publish(entry: PhoneCountry, next: string) {
    const nextStatus = statusOf(entry, next);
    value = toE164(entry, next);
    onchange?.({ country: entry, formatted: formatNational(entry, next), status: nextStatus, valid: nextStatus === "valid" });
  }

  function onInput(event: Event) {
    const text = (event.target as HTMLInputElement).value;
    if (text.trim().startsWith("+")) {
      const parsed = parsePhoneNumber(text, pool);
      if (parsed) {
        if (parsed.country.iso !== iso) oncountrychange?.(parsed.country.iso);
        iso = parsed.country.iso;
        digits = parsed.national;
        return publish(parsed.country, parsed.national);
      }
      if (text.trim() === "+") return show();
    }
    digits = capDigits(country, onlyDigits(text));
    (event.target as HTMLInputElement).value = formatNational(country, digits);
    publish(country, digits);
  }

  async function show() {
    open = true;
    query = "";
    active = 0;
    await tick();
    search?.focus();
  }

  function hide() {
    open = false;
    root?.querySelector<HTMLElement>(".mc-phone__flag")?.focus();
  }

  function choose(entry: PhoneCountry) {
    iso = entry.iso;
    digits = capDigits(entry, digits);
    oncountrychange?.(entry.iso);
    publish(entry, digits);
    hide();
  }

  async function onSearchKeydown(event: KeyboardEvent) {
    const count = flat.length;
    if (event.key === "ArrowDown" && count) active = (active + 1) % count;
    else if (event.key === "ArrowUp" && count) active = (active - 1 + count) % count;
    else if (event.key === "Home") active = 0;
    else if (event.key === "End") active = Math.max(0, count - 1);
    else if (event.key === "Enter" && flat[active]) choose(flat[active]);
    else if (event.key === "Escape") hide();
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

<div bind:this={root} class="mc-phone" data-disabled={disabled || undefined}>
  <label for="{id}-input" class="mc-phone__label">{label}</label>
  <div class="mc-phone__anchor">
    <div class={["mc-phone__shell", classNames?.shell]} data-invalid={message ? "" : undefined}>
      <button
        type="button"
        class={["mc-phone__flag", classNames?.flag]}
        aria-label="Country, {country.name} +{country.dial}"
        aria-haspopup="listbox"
        aria-expanded={open}
        {disabled}
        onclick={() => (open ? hide() : show())}
        onkeydown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            show();
          }
        }}
      >
        <span aria-hidden="true">{flagOf(country.iso)}</span><span>+{country.dial}</span>
      </button>
      <input id="{id}-input" type="tel" autocomplete="tel" inputmode="tel" value={formatted} placeholder={country.example} {disabled} aria-invalid={message ? true : undefined} aria-describedby={message || description ? `${id}-hint` : undefined} class={["mc-phone__input", classNames?.input]} oninput={onInput} onblur={() => (touched = true)} />
      {#if status === "valid"}
        <svg class="mc-phone__valid" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
      {/if}
    </div>
    {#if open}
      <div class={["mc-phone__list", classNames?.list]}>
        <input bind:this={search} bind:value={query} class="mc-phone__search" type="text" role="combobox" autocomplete="off" placeholder="Search country or +code" aria-label="Search country" aria-expanded="true" aria-controls="{id}-list" aria-activedescendant={flat.length ? `${id}-option-${active}` : undefined} onkeydown={onSearchKeydown} oninput={() => (active = 0)} />
        <div id="{id}-list" role="listbox" aria-label="Countries" class="mc-phone__options">
          {#if suggested.length}<div class="mc-phone__group" role="presentation">Suggested</div>{/if}
          {#each suggested as entry, index (`s-${entry.iso}`)}
            <div id="{id}-option-{index}" role="option" tabindex="-1" aria-selected={entry.iso === iso} data-active={active === index || undefined} class={["mc-phone__option", classNames?.option]} onpointermove={() => (active = index)} onclick={() => choose(entry)} onkeydown={() => {}}><span aria-hidden="true">{flagOf(entry.iso)}</span><span class="mc-phone__name">{entry.name}</span><span class="mc-phone__dial">+{entry.dial}</span></div>
          {/each}
          <div class="mc-phone__group" role="presentation">{needle ? "Results" : "All countries"}</div>
          {#each matches as entry, index (entry.iso)}
            <div id="{id}-option-{suggested.length + index}" role="option" tabindex="-1" aria-selected={entry.iso === iso} data-active={active === suggested.length + index || undefined} class={["mc-phone__option", classNames?.option]} onpointermove={() => (active = suggested.length + index)} onclick={() => choose(entry)} onkeydown={() => {}}><span aria-hidden="true">{flagOf(entry.iso)}</span><span class="mc-phone__name">{entry.name}</span><span class="mc-phone__dial">+{entry.dial}</span></div>
          {/each}
          {#if matches.length === 0}<p class="mc-phone__empty">No country matches.</p>{/if}
        </div>
      </div>
    {/if}
  </div>
  {#if message}
    <span id="{id}-hint" role="alert" class={["mc-phone__hint", "mc-phone__hint--error", classNames?.hint]}>{message}</span>
  {:else if description}
    <span id="{id}-hint" class={["mc-phone__hint", classNames?.hint]}>{description}</span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-phone { display: grid; gap: var(--space-2); min-width: 0; }
.mc-phone[data-disabled] { opacity: .5; }
.mc-phone__label { font-size: var(--text-sm); font-weight: 500; }
.mc-phone__anchor { position: relative; }
.mc-phone__shell { display: flex; align-items: center; min-height: var(--control-height-md); overflow: hidden; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-phone__shell:focus-within { border-color: var(--foreground); }
.mc-phone__shell[data-invalid] { border-color: var(--danger); }
.mc-phone__flag { display: inline-flex; align-items: center; gap: 6px; align-self: stretch; padding: 0 var(--space-3); border: 0; border-right: 1px solid var(--border); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-phone__flag:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-phone__input { flex: 1; min-width: 0; padding: 0 var(--space-3); border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
.mc-phone__valid { margin-right: var(--space-3); color: var(--success); }
.mc-phone__list { position: absolute; z-index: 1000; top: calc(100% + 6px); left: 0; box-sizing: border-box; width: min(100%, 340px); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-phone-in .18s var(--ease-enter) both; transform-origin: top left; }
.mc-phone__search { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 0; border-bottom: 1px solid var(--border); outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-phone__options { max-height: 260px; padding: 4px; overflow: auto; }
.mc-phone__group { padding: var(--space-2) var(--space-3) 2px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; }
.mc-phone__option { display: flex; align-items: center; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-phone__option[data-active] { background: var(--surface-muted); }
.mc-phone__option[aria-selected="true"] { font-weight: 600; }
.mc-phone__name { flex: 1; } .mc-phone__dial { color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-phone__empty { margin: 0; padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
.mc-phone__hint { color: var(--text-muted); font-size: var(--text-xs); }
.mc-phone__hint--error { color: var(--danger); }
@keyframes mc-phone-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-phone__shell { transition: none; } .mc-phone__list { animation: none; } }
}
</style>
