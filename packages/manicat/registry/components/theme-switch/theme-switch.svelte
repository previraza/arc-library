<script lang="ts" module>
  export type Theme = "light" | "dark";
</script>

<script lang="ts">
  interface Props {
    label?: string;
    iconOnly?: boolean;
    /** The current theme. Bind it with `bind:theme`. The React version animates a reveal over the page; here the switch flips the value you own. */
    theme?: Theme;
    /** Extend the inner, named parts of the theme switch: icon or label. */
    classNames?: { icon?: string; label?: string };
  }

  let { label, iconOnly = true, theme = $bindable("light"), classNames }: Props = $props();
</script>

<button
  type="button"
  role="switch"
  class="mc-theme"
  aria-checked={theme === "dark"}
  aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} theme"
  onclick={() => (theme = theme === "dark" ? "light" : "dark")}
>
  <span class={["mc-theme__icon", classNames?.icon]} aria-hidden="true">
    {#if theme === "dark"}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
    {:else}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    {/if}
  </span>
  {#if !iconOnly}<span class={["mc-theme__label", classNames?.label]}>{label ?? (theme === "dark" ? "Dark" : "Light")}</span>{/if}
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-theme { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: var(--control-height-sm); min-height: var(--control-height-sm); padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-theme:hover { background: var(--surface-muted); } }
.mc-theme:active { transform: scale(.96); }
.mc-theme__icon { display: grid; place-items: center; }
@media (prefers-reduced-motion: reduce) { .mc-theme { transition: none; } .mc-theme:active { transform: none; } }
}
</style>
