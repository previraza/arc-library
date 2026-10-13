<script lang="ts" module>
  export interface ColorSwatch {
    id: string;
    color: string;
  }
</script>

<script lang="ts">
  const defaultSwatches: ColorSwatch[] = ["#7747ff", "#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#111111"].map((color) => ({ id: color, color }));

  interface Props {
    label?: string;
    swatches?: ColorSwatch[];
    /** A #rrggbb string. Bind it with `bind:value`. The native colour input opens the system picker. */
    value?: string;
    /** Extend the inner, named parts of the picker: preview, input, swatches or swatch. */
    classNames?: { preview?: string; input?: string; swatches?: string; swatch?: string };
  }

  let { label = "Colour", swatches = defaultSwatches, value = $bindable("#7747ff"), classNames }: Props = $props();

  const normalise = (text: string) => {
    const hex = text.trim().replace(/^#?/, "#").toLowerCase();
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : /^#[0-9a-f]{3}$/.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : null;
  };

  let draft = $state<string | null>(null);
  const id = $props.id();

  function onType(event: Event) {
    draft = (event.target as HTMLInputElement).value;
    const hex = normalise(draft);
    if (hex) value = hex;
  }
</script>

<div class="mc-color">
  <label for="{id}-hex" class="mc-color__label">{label}</label>
  <div class="mc-color__row">
    <label class={["mc-color__preview", classNames?.preview]} style="background: {value}">
      <input type="color" class="mc-color__native" {value} aria-label="{label} picker" oninput={(event) => (value = event.currentTarget.value)} />
    </label>
    <input id="{id}-hex" value={draft ?? value} class={["mc-color__input", classNames?.input]} spellcheck="false" autocapitalize="none" oninput={onType} onblur={() => (draft = null)} />
  </div>
  <div class={["mc-color__swatches", classNames?.swatches]} role="group" aria-label="Swatches">
    {#each swatches as swatch (swatch.id)}
      <button type="button" class={["mc-color__swatch", classNames?.swatch]} style="background: {swatch.color}" aria-label={swatch.color} aria-pressed={swatch.color.toLowerCase() === value.toLowerCase()} onclick={() => (value = swatch.color)}></button>
    {/each}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-color { display: grid; gap: var(--space-2); min-width: 0; }
.mc-color__label { font-size: var(--text-sm); font-weight: 500; }
.mc-color__row { display: flex; align-items: center; gap: var(--space-3); }
.mc-color__preview { position: relative; flex: 0 0 auto; width: var(--control-height-md); height: var(--control-height-md); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-control); cursor: pointer; }
.mc-color__native { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.mc-color__input { flex: 1; min-width: 0; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
.mc-color__input:focus-visible { border-color: var(--foreground); outline: none; }
.mc-color__swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-color__swatch { width: 28px; height: 28px; padding: 0; border: 2px solid var(--border); border-radius: 50%; cursor: pointer; transition: transform var(--duration-instant) var(--ease-standard); }
.mc-color__swatch[aria-pressed="true"] { border-color: var(--foreground); }
.mc-color__swatch:active { transform: scale(.94); }
@media (prefers-reduced-motion: reduce) { .mc-color__swatch { transition: none; } .mc-color__swatch:active { transform: none; } }
}
</style>
