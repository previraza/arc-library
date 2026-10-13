<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { createFieldMessage } from "@/lib/field-message";
  import type { FieldMessage } from "@/lib/field-message";

  interface Props extends Omit<HTMLInputAttributes, "class"> {
    label: string;
    description?: string;
    error?: string;
    class?: string;
    /** Extend the inner, named parts of the input: label or input. */
    classNames?: { label?: string; input?: string };
  }

  let { label, description, error, value = $bindable(), id, class: className, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  let hintHost: HTMLElement;
  let errorHost: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hint: FieldMessage | undefined;
  let problem: FieldMessage | undefined;

  const classes = (copy: string) => ({ messageSlot: "mc-input__messageSlot", copy, srOnly: "mc-input__srOnly", words: "mc-input__words", word: "mc-input__word", column: "mc-input__column" });

  onMount(() => {
    hint = createFieldMessage(hintHost, { id: description ? `${controlId}-description` : undefined, classes: classes("mc-input__description"), reduced });
    problem = createFieldMessage(errorHost, { id: error ? `${controlId}-error` : undefined, classes: classes("mc-input__error"), alert: true, reduced });
    hint.set(description);
    problem.set(error);
    return () => {
      hint?.destroy();
      problem?.destroy();
    };
  });
  $effect(() => hint?.set(description));
  $effect(() => problem?.set(error));
</script>

<div class="mc-input__field">
  <label class={["mc-input__label", classNames?.label]} for={controlId}>{label}</label>
  <input
    {...rest}
    id={controlId}
    bind:value
    class={["mc-input__input", className, classNames?.input]}
    aria-invalid={error ? true : rest["aria-invalid"]}
    aria-describedby={[rest["aria-describedby"], description ? `${controlId}-description` : undefined, error ? `${controlId}-error` : undefined].filter(Boolean).join(" ") || undefined}
  />
  <span bind:this={hintHost} style="display: contents"></span>
  <span bind:this={errorHost} style="display: contents"></span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
.mc-input__field { display: grid; min-width: 0; }
.mc-input__label { margin-bottom: var(--space-2); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
/* Focus answers with the border colour alone (no rings or halos); the field itself never changes size. */
.mc-input__input { width: 100%; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); outline: none; transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-input__input::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-input__input:hover:not(:disabled, [aria-invalid="true"]) { border-color: var(--foreground); } }
.mc-input__input:focus-visible { border-color: var(--foreground); }
.mc-input__input[aria-invalid="true"] { border-color: var(--danger); }
.mc-input__input:disabled { cursor: not-allowed; opacity: .5; background: var(--surface-muted); }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-input__messageSlot { display: block; overflow: hidden; }
.mc-input__description, .mc-input__error { display: block; padding-top: var(--space-2); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-input__description { color: var(--text-muted); } .mc-input__error { color: var(--danger); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-input__words { position: relative; display: block; }
.mc-input__word { display: inline-block; white-space: pre; }
/* One column per character of a count. Tabular digits keep columns equal, so only a gained or lost digit changes the width. */
.mc-input__column { position: relative; display: inline-flex; justify-content: center; font-variant-numeric: tabular-nums; }
.mc-input__column > span { display: inline-block; }
.mc-input__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-input__input { transition-duration: .01ms; } }
}
</style>
