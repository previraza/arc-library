<script lang="ts" module>
  export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    time: string;
    read?: boolean;
    tone?: "info" | "success" | "warning";
  }
</script>

<script lang="ts">
  interface Props {
    label?: string;
    /** The list; reading and dismissing update it. Bind it with `bind:items`. */
    items?: NotificationItem[];
    onreadchange?: (notification: NotificationItem, read: boolean) => void;
    ondismiss?: (notification: NotificationItem) => void;
    /** Extend the inner, named parts of the center: trigger, badge, panel, item, title or description. */
    classNames?: { trigger?: string; badge?: string; panel?: string; item?: string; title?: string; description?: string };
  }

  let { label = "Notifications", items = $bindable([]), onreadchange, ondismiss, classNames }: Props = $props();

  let open = $state(false);
  let root = $state<HTMLElement>();
  const id = $props.id();
  const unread = $derived(items.filter((item) => !item.read).length);

  function setRead(item: NotificationItem, read: boolean) {
    items = items.map((entry) => (entry.id === item.id ? { ...entry, read } : entry));
    onreadchange?.(item, read);
  }

  function dismiss(item: NotificationItem) {
    items = items.filter((entry) => entry.id !== item.id);
    ondismiss?.(item);
  }

  function onOutside(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      root?.querySelector<HTMLElement>("button")?.focus();
    }
  }
</script>

<svelte:document onpointerdown={onOutside} />

<div bind:this={root} class="mc-notify" role="presentation" onkeydown={onKeydown}>
  <button type="button" class={["mc-notify__trigger", classNames?.trigger]} aria-label="{label}{unread ? `, ${unread} unread` : ''}" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onclick={() => (open = !open)}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
    {#if unread}<span class={["mc-notify__badge", classNames?.badge]}>{unread}</span>{/if}
  </button>
  {#if open}
    <div {id} role="dialog" aria-label={label} class={["mc-notify__panel", classNames?.panel]}>
      <header class="mc-notify__head">
        <h3>{label}</h3>
        <button type="button" onclick={() => items.filter((item) => !item.read).forEach((item) => setRead(item, true))}>Mark all read</button>
      </header>
      {#if items.length === 0}<p class="mc-notify__empty">You're all caught up.</p>{/if}
      <ul class="mc-notify__list">
        {#each items as item (item.id)}
          <li class={["mc-notify__item", classNames?.item]} data-read={item.read || undefined} data-tone={item.tone ?? "info"}>
            <button type="button" class="mc-notify__body" aria-label="{item.title}, {item.read ? 'read' : 'unread'}" onclick={() => setRead(item, !item.read)}>
              <span class="mc-notify__dot" aria-hidden="true"></span>
              <span class="mc-notify__copy">
                <span class={["mc-notify__title", classNames?.title]}>{item.title}</span>
                {#if item.description}<span class={["mc-notify__description", classNames?.description]}>{item.description}</span>{/if}
                <span class="mc-notify__time">{item.time}</span>
              </span>
            </button>
            <button type="button" class="mc-notify__dismiss" aria-label="Dismiss {item.title}" onclick={() => dismiss(item)}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-notify { position: relative; display: inline-block; }
.mc-notify__trigger { position: relative; display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-notify__trigger:hover { background: var(--surface-muted); } }
.mc-notify__badge { position: absolute; top: -4px; right: -4px; display: grid; place-items: center; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; }
.mc-notify__panel { position: absolute; z-index: 60; top: calc(100% + 8px); right: 0; width: min(22rem, calc(100vw - 2rem)); max-height: 26rem; overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-notify-in .18s var(--ease-enter) both; transform-origin: top right; }
.mc-notify__head { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); border-bottom: 1px solid var(--border); }
.mc-notify__head h3 { margin: 0; font-size: var(--text-base); font-weight: 500; }
.mc-notify__head button { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-notify__empty { margin: 0; padding: var(--space-5); color: var(--text-muted); font-size: var(--text-sm); text-align: center; }
.mc-notify__list { margin: 0; padding: 0; list-style: none; }
.mc-notify__item { display: flex; align-items: flex-start; }
.mc-notify__body { display: flex; flex: 1; gap: var(--space-3); padding: var(--space-4); border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-notify__body:hover { background: var(--surface-muted); } }
.mc-notify__dot { width: 8px; height: 8px; margin-top: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--accent); }
.mc-notify__item[data-tone="success"] .mc-notify__dot { background: var(--success); } .mc-notify__item[data-tone="warning"] .mc-notify__dot { background: var(--warning); }
.mc-notify__item[data-read] .mc-notify__dot { background: transparent; }
.mc-notify__copy { display: grid; gap: 2px; }
.mc-notify__title { font-size: var(--text-sm); font-weight: 600; } .mc-notify__item[data-read] .mc-notify__title { font-weight: 400; }
.mc-notify__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-notify__time { color: var(--text-muted); font-size: var(--text-xs); }
.mc-notify__dismiss { display: grid; place-items: center; width: 28px; height: 28px; margin: var(--space-3) var(--space-3) 0 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; }
@keyframes mc-notify-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-notify__panel { animation: none; } }
}
</style>
