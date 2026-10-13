<script lang="ts" module>
  export interface ExpandingButtonGroupItem {
    id: string;
    label: string;
    /** Return false to cancel. A promise keeps the button pending. */
    onSelect?: () => void | boolean | Promise<void | boolean>;
    /** Shown briefly after the action succeeds, such as "Archived". */
    doneLabel?: string;
    tone?: "neutral" | "danger";
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    items: readonly ExpandingButtonGroupItem[];
    label: string;
    size?: "sm" | "md";
    /** Milliseconds the done label shows. */
    confirmDuration?: number;
    /** Called with the item's id once its action succeeds. */
    onaction?: (id: string) => void;
    /** Draws each button's icon. It receives the item's id. Hover or focus expands one; clicking runs it. */
    icon?: Snippet<[string]>;
    /** Extend the inner, named parts of the group: button or label. */
    classNames?: { button?: string; label?: string };
  }

  let { items, label, size = "md", confirmDuration = 1400, onaction, icon, classNames }: Props = $props();

  let expanded = $state<string | null>(null);
  let done = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function run(item: ExpandingButtonGroupItem) {
    const result = await item.onSelect?.();
    if (result === false) return;
    onaction?.(item.id);
    done = item.id;
    clearTimeout(timer);
    timer = setTimeout(() => (done = null), confirmDuration);
  }

  $effect(() => () => clearTimeout(timer));
</script>

<div class={["mc-xgroup", `mc-xgroup--${size}`]} role="toolbar" aria-label={label} tabindex="-1" onpointerleave={() => (expanded = null)}>
  {#each items as item (item.id)}
    <button
      type="button"
      class={["mc-xgroup__button", classNames?.button]}
      aria-label={item.label}
      data-open={expanded === item.id || done === item.id || undefined}
      data-tone={item.tone}
      disabled={item.disabled}
      onpointerenter={() => (expanded = item.id)}
      onfocus={() => (expanded = item.id)}
      onblur={() => (expanded = null)}
      onclick={() => run(item)}
    >
      {@render icon?.(item.id)}
      <span class={["mc-xgroup__label", classNames?.label]}><span>{done === item.id ? (item.doneLabel ?? item.label) : item.label}</span></span>
    </button>
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-xgroup { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-xgroup__button { display: inline-flex; align-items: center; gap: 0; min-width: 40px; height: 40px; padding: 0 10px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-xgroup--sm .mc-xgroup__button { height: 32px; min-width: 32px; }
.mc-xgroup__button[data-tone="danger"] { color: var(--danger); }
.mc-xgroup__button[data-open] { background: var(--surface); box-shadow: var(--shadow-resting); }
/* The label opens through grid columns, so the button grows to fit without measuring. */
.mc-xgroup__label { display: grid; grid-template-columns: 0fr; transition: grid-template-columns .28s var(--ease-standard), margin .28s var(--ease-standard); }
.mc-xgroup__label > span { overflow: hidden; white-space: nowrap; }
.mc-xgroup__button[data-open] .mc-xgroup__label { grid-template-columns: 1fr; margin-left: 6px; }
.mc-xgroup__button:disabled { opacity: .45; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .mc-xgroup__label, .mc-xgroup__button { transition: none; } }
}
</style>
