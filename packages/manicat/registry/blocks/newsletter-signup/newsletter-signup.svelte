<script lang="ts" module>
  export type NewsletterVariant = "inline" | "card";
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Input from "@/registry/components/input/input.svelte";

  const copy = {
    inline: { title: "Five minutes on interface craft, every Friday", description: "Three links worth your time and one short essay on the details that make software feel right." },
    card: { title: "Get the next issue on Friday", description: "Three links and one short essay on interface craft. Five minutes, once a week." },
  };
  const messages = { empty: "Enter your email address", format: "Enter an email like name@company.com", failed: "That didn't go through. Your email is kept, so try again." };

  interface Props {
    variant?: NewsletterVariant;
    title?: string;
    description?: string;
    placeholder?: string;
    buttonLabel?: string;
    privacyNote?: string;
    privacyLink?: { label: string; href: string } | null;
    /** Social proof beside the form: a reader count and image URLs for the faces. */
    readers?: { count: number; faces: string[] } | null;
    /** Receives the address once it is valid. Reject to show the failure message and keep the email. */
    onSubscribe?: (email: string) => void | Promise<void>;
    /** Extend the inner, named parts of the block: title, description, form or note. */
    classNames?: { title?: string; description?: string; form?: string; note?: string };
  }

  let { variant = "inline", title, description, placeholder = "you@company.com", buttonLabel = "Subscribe", privacyNote = "No tracking pixels. Unsubscribe with one click.", privacyLink = { label: "Privacy policy", href: "#privacy" }, readers = null, onSubscribe, classNames }: Props = $props();

  let email = $state("");
  let error = $state("");
  let busy = $state(false);
  let done = $state(false);
  const text = $derived(copy[variant]);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    const value = email.trim();
    if (!value) return void (error = messages.empty);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return void (error = messages.format);
    error = "";
    busy = true;
    try {
      await onSubscribe?.(value);
      done = true;
    } catch {
      error = messages.failed;
    } finally {
      busy = false;
    }
  }
</script>

<section class={["mc-news", `mc-news--${variant}`]} aria-label={title ?? text.title}>
  <h2 class={["mc-news__title", classNames?.title]}>{title ?? text.title}</h2>
  <p class={["mc-news__description", classNames?.description]}>{description ?? text.description}</p>
  {#if done}
    <p class="mc-news__done" role="status">✓ Check your inbox to confirm.</p>
  {:else}
    <form class={["mc-news__form", classNames?.form]} novalidate onsubmit={submit}>
      <Input bind:value={email} label="Email" type="email" inputmode="email" autocomplete="email" {placeholder} {error} oninput={() => (error = "")} />
      <Button type="submit" loading={busy}>{buttonLabel}</Button>
    </form>
  {/if}
  {#if readers}
    <p class="mc-news__readers">
      <span class="mc-news__faces" aria-hidden="true">{#each readers.faces.slice(0, 4) as src (src)}<img {src} alt="" width="24" height="24" />{/each}</span>
      {readers.count.toLocaleString("en-US")} readers
    </p>
  {/if}
  <p class={["mc-news__note", classNames?.note]}>{privacyNote} {#if privacyLink}<a href={privacyLink.href}>{privacyLink.label}</a>{/if}</p>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-news { display: grid; gap: 14px; max-width: 520px; color: var(--foreground); }
.mc-news--card { border: 1px solid var(--border); border-radius: 28px; padding: 24px; background: var(--surface); }
.mc-news__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-news__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-news__form { display: grid; gap: 12px; }
.mc-news--inline .mc-news__form { grid-template-columns: 1fr auto; align-items: end; }
.mc-news__done { margin: 0; color: var(--success); font-weight: 500; }
.mc-news__readers { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-news__faces img { width: 24px; height: 24px; margin-inline-start: -6px; border: 2px solid var(--background); border-radius: 50%; }
.mc-news__faces img:first-child { margin-inline-start: 0; }
.mc-news__note { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-news__note a { color: inherit; }
@media (max-width: 480px) { .mc-news--inline .mc-news__form { grid-template-columns: 1fr; } }
}
</style>
