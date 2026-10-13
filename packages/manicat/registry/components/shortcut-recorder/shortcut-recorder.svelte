<script lang="ts" module>
  export type Platform = "mac" | "other";

  export interface ShortcutBinding {
    shortcut: string;
    label: string;
  }
</script>

<script lang="ts">
  const MODIFIERS = ["mod", "ctrl", "alt", "shift", "meta"] as const;
  const SYMBOLS_MAC: Record<string, string> = { mod: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘", enter: "↵", escape: "esc", space: "␣", up: "↑", down: "↓", left: "←", right: "→" };
  const SYMBOLS_OTHER: Record<string, string> = { mod: "Ctrl", ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win", enter: "Enter", escape: "Esc", space: "Space", up: "↑", down: "↓", left: "←", right: "→" };
  const KEYS: Record<string, string> = { " ": "space", Enter: "enter", Escape: "escape", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

  interface Props {
    label: string;
    resetValue?: string | null;
    bindings?: ShortcutBinding[];
    requireModifier?: boolean;
    platform?: Platform;
    placeholder?: string;
    description?: string;
    disabled?: boolean;
    /** The shortcut as "mod+shift+k": modifiers first in a fixed order, then one key. `mod` is ⌘ on Mac and Ctrl elsewhere. Bind it with `bind:value`. */
    value?: string | null;
    onreplaced?: (binding: ShortcutBinding) => void;
    /** Extend the inner, named parts of the recorder: field, key, hint or reset. */
    classNames?: { field?: string; key?: string; hint?: string; reset?: string };
  }

  let { label, resetValue, bindings = [], requireModifier = true, platform, placeholder = "Click, then press keys", description, disabled = false, value = $bindable(null), onreplaced, classNames }: Props = $props();

  const id = $props.id();
  let recording = $state(false);
  let held = $state<string[]>([]);
  let problem = $state<string | null>(null);
  const resolvedPlatform = $derived<Platform>(platform ?? (typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform) ? "mac" : "other"));
  const symbols = $derived(resolvedPlatform === "mac" ? SYMBOLS_MAC : SYMBOLS_OTHER);

  function fromEvent(event: KeyboardEvent): { shortcut: string; complete: boolean } {
    const mods: string[] = [];
    const mod = resolvedPlatform === "mac" ? event.metaKey : event.ctrlKey;
    if (mod) mods.push("mod");
    if (event.ctrlKey && resolvedPlatform === "mac") mods.push("ctrl");
    if (event.altKey) mods.push("alt");
    if (event.shiftKey) mods.push("shift");
    const key = ["Shift", "Control", "Alt", "Meta"].includes(event.key) ? null : (KEYS[event.key] ?? event.key.toLowerCase());
    return { shortcut: [...mods, ...(key ? [key] : [])].join("+"), complete: Boolean(key) };
  }

  function onKeydown(event: KeyboardEvent) {
    if (!recording) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        recording = true;
      }
      return;
    }
    event.preventDefault();
    if (event.key === "Escape" && !event.metaKey && !event.ctrlKey) {
      recording = false;
      held = [];
      return;
    }
    const { shortcut, complete } = fromEvent(event);
    held = shortcut.split("+").filter(Boolean);
    if (!complete) return;
    if (requireModifier && !MODIFIERS.some((modifier) => shortcut.startsWith(modifier))) {
      problem = "Add a modifier such as ⌘, Ctrl or Alt.";
      return;
    }
    const replaced = bindings.find((binding) => binding.shortcut === shortcut);
    problem = replaced ? `Replaces "${replaced.label}".` : null;
    if (replaced) onreplaced?.(replaced);
    value = shortcut;
    recording = false;
    held = [];
  }

  const parts = $derived(recording ? held : (value ?? "").split("+").filter(Boolean));
</script>

<div class="mc-shortcut" data-disabled={disabled || undefined}>
  <span id="{id}-label" class="mc-shortcut__label">{label}</span>
  <div class="mc-shortcut__row">
    <button
      type="button"
      class={["mc-shortcut__field", classNames?.field]}
      data-recording={recording || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-hint"
      {disabled}
      onclick={() => (recording = true)}
      onkeydown={onKeydown}
      onblur={() => {
        recording = false;
        held = [];
      }}
    >
      {#each parts as part (part)}
        <span class={["mc-shortcut__key", classNames?.key]}><kbd>{symbols[part] ?? part.toUpperCase()}</kbd></span>
      {/each}
      {#if !parts.length}<span class="mc-shortcut__placeholder">{recording ? "Press the keys…" : placeholder}</span>{/if}
    </button>
    {#if resetValue !== undefined && value !== resetValue}<button type="button" class={["mc-shortcut__reset", classNames?.reset]} onclick={() => (value = resetValue)}>Reset</button>{/if}
  </div>
  <span id="{id}-hint" class={["mc-shortcut__hint", { "mc-shortcut__hint--warn": problem }, classNames?.hint]} role={problem ? "alert" : undefined}>{problem ?? description}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-shortcut { display: grid; gap: var(--space-2); min-width: 0; }
.mc-shortcut[data-disabled] { opacity: .5; }
.mc-shortcut__label { font-size: var(--text-sm); font-weight: 500; }
.mc-shortcut__row { display: flex; align-items: center; gap: var(--space-2); }
.mc-shortcut__field { display: flex; flex: 1; align-items: center; gap: 4px; min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-shortcut__field[data-recording] { border-color: var(--foreground); }
.mc-shortcut__key kbd { display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 6px; border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 6px; background: var(--surface-muted); font: inherit; font-size: var(--text-xs); font-weight: 600; }
.mc-shortcut__placeholder { color: var(--text-muted); }
.mc-shortcut__reset { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-shortcut__hint { min-height: 1em; color: var(--text-muted); font-size: var(--text-xs); }
.mc-shortcut__hint--warn { color: var(--warning); }
@media (prefers-reduced-motion: reduce) { .mc-shortcut__field { transition: none; } }
}
</style>
