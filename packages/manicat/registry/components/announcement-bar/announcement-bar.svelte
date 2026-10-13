<script lang="ts" module>
  export interface AnnouncementAction {
    label: string;
    href?: string;
  }

  export interface Announcement {
    id: string;
    message: string;
    action?: AnnouncementAction;
  }
</script>

<script lang="ts">
  interface Props {
    messages: Announcement[];
    /** Milliseconds each message stays before the next one. */
    interval?: number;
    autoPlay?: boolean;
    /** Whether the bar is visible. Bind it with `bind:open`; it closes itself when dismissed. */
    open?: boolean;
    /** Called with the message's id when its action button (an action without `href`) is pressed. */
    onaction?: (id: string) => void;
    /** Extend the inner, named parts of the bar: message, action or dismiss. */
    classNames?: { bar?: string; message?: string; action?: string; dismiss?: string };
  }

  let { messages, interval = 6000, autoPlay = true, open = $bindable(true), onaction, classNames }: Props = $props();

  let index = $state(0);
  const current = $derived(messages[index % Math.max(1, messages.length)]);

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The same motion as the CSS of the other ports: the old message leaves up, the next one rises in.
  function rise(_node: Element, { y, duration }: { y: number; duration: number }) {
    return {
      duration: reduced ? 120 : duration,
      css: (t: number) => `opacity: ${t}; ${reduced ? "" : `transform: translateY(${(1 - t) * y}em);`}`,
    };
  }

  $effect(() => {
    if (!autoPlay || messages.length < 2) return;
    const timer = setInterval(() => (index = (index + 1) % messages.length), interval);
    return () => clearInterval(timer);
  });
</script>

{#if open && current}
  <div role="region" aria-label="Announcement" class={["mc-announce", classNames?.bar]}>
    {#key current.id}
      <p class="mc-announce__copy" in:rise={{ y: 0.5, duration: 300 }} out:rise={{ y: -0.5, duration: 160 }}>
        <span class={["mc-announce__message", classNames?.message]}>{current.message}</span>
        {#if current.action?.href}
          <a href={current.action.href} class={["mc-announce__action", classNames?.action]}>{current.action.label}</a>
        {:else if current.action}
          <button type="button" class={["mc-announce__action", classNames?.action]} onclick={() => onaction?.(current.id)}>{current.action.label}</button>
        {/if}
      </p>
    {/key}
    <button type="button" class={["mc-announce__dismiss", classNames?.dismiss]} aria-label="Dismiss announcement" onclick={() => (open = false)}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    </button>
  </div>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-announce { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--foreground); color: var(--background); font-size: var(--text-sm); }
.mc-announce__copy { display: flex; flex: 1; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); margin: 0; text-align: center; }
.mc-announce__action { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.mc-announce__dismiss { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--radius-pill); background: transparent; color: inherit; cursor: pointer; opacity: .8; }
@media (hover: hover) and (pointer: fine) { .mc-announce__dismiss:hover { opacity: 1; background: color-mix(in oklab, var(--background) 16%, transparent); } }
.mc-announce-enter-active { transition: opacity .3s var(--ease-enter), transform .3s var(--ease-enter); }
.mc-announce-leave-active { transition: opacity .16s var(--ease-standard), transform .16s var(--ease-standard); }
.mc-announce-enter-from { opacity: 0; transform: translateY(.5em); } .mc-announce-leave-to { opacity: 0; transform: translateY(-.5em); }
@media (prefers-reduced-motion: reduce) { .mc-announce-enter-active, .mc-announce-leave-active { transition: opacity .12s linear; } .mc-announce-enter-from, .mc-announce-leave-to { transform: none; } }
}
</style>
