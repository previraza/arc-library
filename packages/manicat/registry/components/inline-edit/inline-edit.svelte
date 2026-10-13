<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    label: string;
    /** Return a message to block the save, or nothing when the value is fine. */
    validate?: (next: string) => string | null | undefined;
    placeholder?: string;
    multiline?: boolean;
    variant?: "title" | "body";
    /** The saved value, which only changes when an edit is committed. Bind it with `bind:value`. */
    value?: string;
    onsave?: (next: string) => void;
    /** Extend the inner, named parts of the inline edit: text, input or error. */
    classNames?: { text?: string; input?: string; error?: string };
  }

  let { label, validate, placeholder = "", multiline = false, variant = "title", value = $bindable(""), onsave, classNames }: Props = $props();

  let editing = $state(false);
  let draft = $state("");
  let error = $state<string | null>(null);
  let field = $state<HTMLInputElement | HTMLTextAreaElement>();
  const id = $props.id();

  async function edit() {
    draft = value;
    editing = true;
    await tick();
    field?.focus();
    field?.select();
  }

  function commit() {
    if (!editing) return;
    const next = draft.trim();
    const problem = validate?.(next);
    if (problem) {
      error = problem;
      return;
    }
    error = null;
    editing = false;
    if (next && next !== value) {
      value = next;
      onsave?.(next);
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      error = null;
      editing = false;
    } else if (event.key === "Enter" && (!multiline || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      commit();
    }
  }
</script>

<span class="mc-inline" data-variant={variant}>
  {#if !editing}
    <button type="button" class={["mc-inline__text", classNames?.text]} aria-label="{label}: {value || placeholder}. Edit" onclick={edit}>{value || placeholder}</button>
  {:else}
    {#if multiline}
      <textarea {id} bind:this={field} bind:value={draft} class={["mc-inline__input", classNames?.input]} aria-label={label} aria-invalid={error ? true : undefined} onblur={commit} onkeydown={onKeydown}></textarea>
    {:else}
      <input {id} bind:this={field} bind:value={draft} class={["mc-inline__input", classNames?.input]} aria-label={label} aria-invalid={error ? true : undefined} onblur={commit} onkeydown={onKeydown} />
    {/if}
    {#if error}<span role="alert" class={["mc-inline__error", classNames?.error]}>{error}</span>{/if}
  {/if}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-inline { display: inline-grid; gap: 4px; }
.mc-inline__text, .mc-inline__input { padding: 2px 6px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--foreground); font: inherit; text-align: left; }
.mc-inline[data-variant="title"] .mc-inline__text, .mc-inline[data-variant="title"] .mc-inline__input { font-size: var(--text-xl); font-weight: 600; letter-spacing: var(--tracking-display); }
.mc-inline__text { cursor: text; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-inline__text:hover { background: var(--surface-muted); } }
.mc-inline__input { border-color: var(--border-strong); background: var(--surface); outline: 0; }
.mc-inline__input:focus { border-color: var(--foreground); }
.mc-inline__input[aria-invalid="true"] { border-color: var(--danger); }
.mc-inline__error { color: var(--danger); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-inline__text { transition: none; } }
}
</style>
