<script lang="ts">
  // @manicat-dependencies motion bits-ui
  import { onMount } from "svelte";
  import { Checkbox } from "bits-ui";
  import { animateCheckbox, checkboxPath } from "@/lib/motion-dom";

  interface Props {
    label?: string;
    description?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    checked?: boolean;
    indeterminate?: boolean;
    class?: string;
    "aria-label"?: string;
    /** Extend the inner, named parts of the checkbox: field, box, visual, fill or mark. */
    classNames?: { field?: string; box?: string; visual?: string; fill?: string; mark?: string };
  }

  let { label, description, disabled = false, name, id, checked = $bindable(false), indeterminate = $bindable(false), class: className, "aria-label": ariaLabel, classNames }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  const state = $derived<boolean | "indeterminate">(indeterminate ? "indeterminate" : checked);
  let fill: HTMLElement;
  let path: SVGPathElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false;

  onMount(() => {
    animateCheckbox({ fill, path }, state, { reduced, animated: false });
    ready = true;
  });
  $effect(() => {
    const next = state;
    if (ready) animateCheckbox({ fill, path }, next, { reduced, animated: true });
  });
</script>

<div class={["mc-checkbox__field", classNames?.field]}>
  <Checkbox.Root id={controlId} bind:checked bind:indeterminate {disabled} {name} class={["mc-checkbox__box", className, classNames?.box]} aria-describedby={description ? `${controlId}-description` : undefined} aria-label={ariaLabel ?? (label ? undefined : "Checkbox")}>
    <span class={["mc-checkbox__visual", classNames?.visual]} aria-hidden="true">
      <span bind:this={fill} class={["mc-checkbox__fill", classNames?.fill]}></span>
      <svg class={["mc-checkbox__mark", classNames?.mark]} viewBox="0 0 18 18" fill="none" focusable="false">
        <path bind:this={path} d={checkboxPath} stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </Checkbox.Root>
  {#if label || description}
    <div class="mc-checkbox__copy">
      {#if label}<label for={controlId}>{label}</label>{/if}
      {#if description}<span id={`${controlId}-description`}>{description}</span>{/if}
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-checkbox__field { display: inline-flex; align-items: flex-start; gap: 0; min-width: 0; }
.mc-checkbox__box { position: relative; flex: 0 0 auto; display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 0; border-radius: var(--radius-control); padding: 0; background: transparent; color: var(--control-glyph); cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* The square is the only part that reacts to a press, so the hit area and label never move. */
.mc-checkbox__visual { position: relative; display: block; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-checkbox__fill { position: absolute; inset: -1px; border-radius: inherit; background: var(--control-on); }
.mc-checkbox__mark { position: absolute; inset: -1px; width: 18px; height: 18px; overflow: visible; }
.mc-checkbox__box[data-state="checked"] .mc-checkbox__visual, .mc-checkbox__box[data-state="indeterminate"] .mc-checkbox__visual { border-color: var(--control-on); }
@media (hover: hover) and (pointer: fine) { .mc-checkbox__box[data-state="unchecked"]:hover:not(:disabled) .mc-checkbox__visual { border-color: var(--text-muted); } }
.mc-checkbox__box:active:not(:disabled) .mc-checkbox__visual { transform: scale(.95); transition: border-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-checkbox__box:disabled { opacity: .5; cursor: not-allowed; }
/* The label's first line centers on the square: (44px box - 19.6px line) / 2. */
.mc-checkbox__copy { display: grid; gap: 2px; min-width: 0; margin-left: 1px; padding-top: calc((var(--control-height-md) - var(--text-sm) * 1.4) / 2); }
.mc-checkbox__copy label { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); cursor: pointer; }
.mc-checkbox__copy span { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
@media (prefers-reduced-motion: reduce) { .mc-checkbox__visual, .mc-checkbox__box:active:not(:disabled) .mc-checkbox__visual { transition: none; transform: none; } }
}
</style>
