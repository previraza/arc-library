<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import type { HTMLInputAttributes } from "svelte/elements";
  import { Search, X } from "@lucide/svelte";
  import { poseTransition, pressAction } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props extends Omit<HTMLInputAttributes, "type" | "class"> {
    label: string;
    value?: string;
    class?: string;
    /** Extend the inner, named parts of the search field: shell, input or clearSlot. */
    classNames?: { shell?: string; input?: string; clearSlot?: string };
  }

  let { label, value = $bindable(""), id, class: className, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  let input: HTMLInputElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Clearing returns focus to the field, since the clear button unmounts under the pointer.
  function clear() {
    value = "";
    input.focus();
  }

  // The clear button scales and blurs in on a spring and leaves a little faster; its slot is reserved, so the field never resizes.
  const away = { opacity: 0, scale: 0.8, blur: motionTokens.blur.subtle };
  const rest_ = { opacity: 1, scale: 1, blur: 0 };
  const enter = poseTransition(reduced ? { opacity: 0 } : away, rest_, reduced ? { duration: motionTokens.duration.instant } : { spring: "snappy", fade: motionTokens.duration.fast });
  const leave = poseTransition(reduced ? { opacity: 0 } : away, rest_, reduced ? { duration: 0 } : { duration: motionTokens.duration.instant, ease: "standard" });
</script>

<div class={["mc-search-field__field", className]}>
  <label for={controlId}>{label}</label>
  <div class={["mc-search-field__shell", classNames?.shell]} data-filled={value ? "true" : undefined}>
    <Search size={18} aria-hidden="true" />
    <input {...rest} bind:this={input} id={controlId} type="search" bind:value class={["mc-search-field__input", className, classNames?.input]} />
    <!-- The clear button has a reserved slot, so the field never changes width when it appears or leaves. -->
    <span class={["mc-search-field__clearSlot", classNames?.clearSlot]}>
      {#if value}
        <button type="button" tabindex="0" aria-label="Clear search" onclick={clear} in:enter out:leave use:pressAction={{ scale: 0.96 }}><X size={16} aria-hidden="true" /></button>
      {/if}
    </span>
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-search-field__field { display: grid; gap: var(--space-2); min-width: 0; }
.mc-search-field__field label { font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); }
/* Focus darkens the border; the shell never changes size. */
.mc-search-field__shell { display: flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-2); border: 1px solid var(--border-strong); border-radius: var(--radius-control); padding: 0 var(--space-3); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-search-field__shell:hover:not(:focus-within) { border-color: var(--foreground); } }
.mc-search-field__shell:focus-within { border-color: var(--foreground); }
/* The glass wakes up with the field: muted at rest, full contrast while searching. */
.mc-search-field__shell > svg { flex: 0 0 auto; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-search-field__shell:focus-within > svg, .mc-search-field__shell[data-filled="true"] > svg { color: var(--foreground); }
.mc-search-field__input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); letter-spacing: var(--tracking-body); outline: 0; }
.mc-search-field__input:focus-visible { outline: 0; }
.mc-search-field__input::placeholder { color: var(--text-muted); }
.mc-search-field__input::-webkit-search-cancel-button { display: none; }
.mc-search-field__clearSlot { display: grid; width: 24px; height: 24px; flex: 0 0 auto; place-items: center; }
.mc-search-field__shell button { display: grid; width: 24px; height: 24px; flex: 0 0 auto; place-items: center; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-search-field__shell button:hover { background: var(--surface-muted); color: var(--foreground); } }
@media (prefers-reduced-motion: reduce) { .mc-search-field__shell, .mc-search-field__shell > svg, .mc-search-field__shell button { transition: none; } }
}
</style>
