<script lang="ts" module>
  export interface FloatingButtonGroupAction {
    type?: "action";
    id: string;
    label: string;
    iconOnly?: boolean;
    disabled?: boolean;
    pressed?: boolean;
    shortcut?: string;
  }

  export interface FloatingButtonGroupSeparator {
    type: "separator";
    id?: string;
  }

  export type FloatingButtonGroupItem = FloatingButtonGroupAction | FloatingButtonGroupSeparator;
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    items: FloatingButtonGroupItem[];
    label: string;
    variant?: "muted" | "floating";
    size?: "sm" | "md";
    orientation?: "horizontal" | "vertical";
    iconOnly?: boolean;
    /** Called with the action's id. */
    onaction?: (id: string) => void;
    /** Draws an action's icon. It receives the action's id. */
    icon?: Snippet<[string]>;
    /** Extend the inner, named parts of the group: button or separator. */
    classNames?: { button?: string; separator?: string };
  }

  let { items, label, variant = "muted", size = "md", orientation = "horizontal", iconOnly = false, onaction, icon, classNames }: Props = $props();
</script>

<div class={["mc-fgroup", `mc-fgroup--${variant}`, `mc-fgroup--${size}`, `mc-fgroup--${orientation}`]} role="toolbar" aria-label={label}>
  {#each items as item, index (item.id ?? `sep-${index}`)}
    {#if item.type === "separator"}
      <span class={["mc-fgroup__separator", classNames?.separator]} role="separator"></span>
    {:else}
      <button
        type="button"
        class={["mc-fgroup__button", classNames?.button]}
        aria-label={item.label}
        aria-pressed={item.pressed}
        title={iconOnly || item.iconOnly ? item.label : undefined}
        disabled={item.disabled}
        onclick={() => onaction?.(item.id)}
      >
        {@render icon?.(item.id)}
        {#if !iconOnly && !item.iconOnly}<span>{item.label}</span>{/if}
        {#if item.shortcut && !iconOnly && !item.iconOnly}<kbd>{item.shortcut}</kbd>{/if}
      </button>
    {/if}
  {/each}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-fgroup { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); }
.mc-fgroup--vertical { flex-direction: column; }
.mc-fgroup--floating { background: var(--surface); box-shadow: var(--shadow-raised); }
.mc-fgroup__button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 12px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.mc-fgroup--sm .mc-fgroup__button { min-height: 32px; }
@media (hover: hover) and (pointer: fine) { .mc-fgroup__button:hover:not(:disabled) { background: var(--border); } }
.mc-fgroup__button[aria-pressed="true"] { background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-fgroup__button:disabled { opacity: .45; cursor: not-allowed; }
.mc-fgroup__button kbd { color: var(--text-muted); font: inherit; font-size: var(--text-xs); }
.mc-fgroup__separator { width: 1px; height: 18px; margin: 0 4px; background: var(--border); }
.mc-fgroup--vertical .mc-fgroup__separator { width: 18px; height: 1px; margin: 4px 0; }
@media (prefers-reduced-motion: reduce) { .mc-fgroup__button { transition: none; } }
}
</style>
