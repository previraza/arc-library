<script lang="ts" module>
  export type AvatarSize = "sm" | "md" | "lg" | "xl";
</script>

<script lang="ts">
  interface Props {
    name: string;
    src?: string;
    size?: AvatarSize;
    status?: "online" | "offline";
    /** Extend the inner, named parts of the avatar: image, fallback or status. */
    classNames?: { image?: string; fallback?: string; status?: string };
  }

  let { name, src, size = "md", status, classNames }: Props = $props();

  let failed = $state(false);
  $effect(() => {
    void src;
    failed = false;
  });

  const initials = $derived(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));
</script>

<span class={["mc-avatar", `mc-avatar--${size}`]} role="img" aria-label={`${name}${status ? `, ${status}` : ""}`}>
  {#if src && !failed}
    <img {src} alt="" class={["mc-avatar__image", classNames?.image]} onerror={() => (failed = true)} />
  {:else}
    <span class={["mc-avatar__fallback", classNames?.fallback]} aria-hidden="true">{initials}</span>
  {/if}
  {#if status}<i class={["mc-avatar__status", `mc-avatar__status--${status}`, classNames?.status]} aria-hidden="true"></i>{/if}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar { position: relative; display: inline-grid; flex: 0 0 auto; place-items: center; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--foreground); font-size: var(--text-xs); font-weight: 500; }
.mc-avatar__image { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; pointer-events: none; }
.mc-avatar--sm { width: 28px; height: 28px; font-size: 10px; }
.mc-avatar--md { width: 36px; height: 36px; }
.mc-avatar--lg { width: 48px; height: 48px; font-size: var(--text-sm); }
.mc-avatar--xl { width: 88px; height: 88px; font-size: var(--text-xl); }
.mc-avatar__status { position: absolute; right: 0; bottom: 0; z-index: 2; width: 10px; height: 10px; border: 2px solid var(--background); border-radius: 50%; }
.mc-avatar__status--online { background: var(--success); }
.mc-avatar__status--offline { background: var(--text-muted); }
}
</style>
