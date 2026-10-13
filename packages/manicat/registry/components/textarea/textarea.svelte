<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { createFieldMessage } from "@/lib/field-message";
  import type { FieldMessage } from "@/lib/field-message";

  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label: string;
    description?: string;
    error?: string;
    class?: string;
    /** Extend the inner, named parts of the textarea: messageSlot, hint, error, words, word or column. */
    classNames?: { messageSlot?: string; hint?: string; error?: string; words?: string; word?: string; column?: string };
  }

  let { label, description, error, value = $bindable(), id, class: className, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  let hintHost: HTMLElement;
  let errorHost: HTMLElement;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hint: FieldMessage | undefined;
  let problem: FieldMessage | undefined;

  const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
  const classes = (copy: string) => ({
    messageSlot: cn("mc-textarea__messageSlot", classNames?.messageSlot),
    copy,
    srOnly: "mc-textarea__srOnly",
    words: cn("mc-textarea__words", classNames?.words),
    word: cn("mc-textarea__word", classNames?.word),
    column: cn("mc-textarea__column", classNames?.column),
  });

  onMount(() => {
    hint = createFieldMessage(hintHost, { id: description ? `${controlId}-description` : undefined, classes: classes(cn("mc-textarea__hint", classNames?.hint)), reduced });
    problem = createFieldMessage(errorHost, { id: error ? `${controlId}-error` : undefined, classes: classes(cn("mc-textarea__error", classNames?.error)), alert: true, reduced });
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

<div class="mc-textarea__field">
  <label for={controlId}>{label}</label>
  <textarea
    {...rest}
    id={controlId}
    bind:value
    class={["mc-textarea__control", className]}
    aria-invalid={error ? true : rest["aria-invalid"]}
    aria-describedby={[rest["aria-describedby"], description ? `${controlId}-description` : undefined, error ? `${controlId}-error` : undefined].filter(Boolean).join(" ") || undefined}
  ></textarea>
  <span bind:this={hintHost} style="display: contents"></span>
  <span bind:this={errorHost} style="display: contents"></span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
.mc-textarea__field { display: grid; min-width: 0; }
.mc-textarea__field label { margin-bottom: var(--space-2); font-size: var(--text-sm); font-weight: 500; }
/* Same focus language as Input: the ring contracts onto the border while it fades in, and the box never changes size. */
.mc-textarea__control { width: 100%; min-height: 110px; resize: vertical; border: 1px solid var(--border-strong); border-radius: var(--radius-control); padding: var(--space-3); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); outline: none; box-shadow: 0 0 0 6px transparent; transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-textarea__control::placeholder { color: var(--text-muted); }
@media (hover: hover) and (pointer: fine) { .mc-textarea__control:hover:not(:disabled, [aria-invalid="true"]) { border-color: var(--foreground); } }
.mc-textarea__control:focus-visible { border-color: var(--foreground); box-shadow: 0 0 0 3px var(--focus-ring); outline: 2px solid transparent; outline-offset: 2px; }
.mc-textarea__control[aria-invalid="true"] { border-color: var(--danger); }
.mc-textarea__control:disabled { cursor: not-allowed; background: var(--surface-muted); opacity: .6; }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-textarea__messageSlot { display: block; overflow: hidden; }
.mc-textarea__hint, .mc-textarea__error { display: block; padding-top: var(--space-2); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-textarea__hint { color: var(--text-muted); } .mc-textarea__error { color: var(--danger); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-textarea__words { position: relative; display: block; }
.mc-textarea__word { display: inline-block; white-space: pre; }
/* One column per character of a count. Tabular digits keep columns equal, so only a gained or lost digit changes the width. */
.mc-textarea__column { position: relative; display: inline-flex; justify-content: center; font-variant-numeric: tabular-nums; }
.mc-textarea__column > span { display: inline-block; }
.mc-textarea__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-textarea__control { transition: none; } }
}
</style>
