<script lang="ts" module>
  export type HeroSectionVariant = "centered" | "split" | "minimal";
  export interface HeroAction {
    label: string;
    href?: string;
    /** Opens in a new tab and shows an outward arrow. */
    external?: boolean;
    /** Shown in place of the label for a moment after a click, such as "Trial started". Buttons only. */
    doneLabel?: string;
  }
  export interface HeroInstallCommand {
    /** Short label, such as npm or pnpm. The first command is shown. */
    label: string;
    command: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "@/registry/components/button/button.svelte";

  interface Props {
    /** `centered` and `minimal` align the copy to the middle; `split` puts it beside the `media` snippet. */
    variant?: HeroSectionVariant;
    title?: string;
    description?: string;
    announcement?: HeroAction | null;
    primaryAction?: HeroAction | null;
    secondaryAction?: HeroAction | null;
    install?: HeroInstallCommand[] | null;
    /** Small facts under the content, such as the version and license. */
    meta?: string[];
    /** Called when an action or the announcement is clicked. */
    onaction?: (action: HeroAction) => void;
    media?: Snippet;
    /** Extend the inner, named parts of the hero: title, description, actions or install. */
    classNames?: { title?: string; description?: string; actions?: string; install?: string };
  }

  let {
    variant = "centered",
    title = "Interfaces that move with intent",
    description = "Components and blocks with springs, states and details already done, so you can ship the product instead of the polish.",
    announcement = { label: "What's new in 2.4" },
    primaryAction = { label: "Get started", doneLabel: "Opened" },
    secondaryAction = { label: "Browse components" },
    install = null,
    meta,
    onaction,
    media,
    classNames,
  }: Props = $props();

  let done = $state<string | null>(null);
  let copied = $state(false);

  function press(action: HeroAction) {
    onaction?.(action);
    if (action.doneLabel && !action.href) {
      done = action.label;
      setTimeout(() => (done = null), 2400);
    }
  }
  async function copy(value: string) {
    await navigator.clipboard?.writeText(value);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<section class={["mc-hero", `mc-hero--${variant}`]}>
  <div class="mc-hero__inner">
    <div class="mc-hero__copy">
      {#if announcement}<a href={announcement.href ?? "#"} class="mc-hero__announcement" onclick={() => onaction?.(announcement)}>{announcement.label} →</a>{/if}
      <h1 class={["mc-hero__title", classNames?.title]}>{title}</h1>
      {#if description}<p class={["mc-hero__description", classNames?.description]}>{description}</p>{/if}
      {#if primaryAction || secondaryAction}
        <div class={["mc-hero__actions", classNames?.actions]}>
          {#each [primaryAction, secondaryAction] as action, index (index)}
            {#if action}
              {#if action.href}
                <a href={action.href} class={["mc-hero__link", { "mc-hero__link--secondary": index === 1 }]} target={action.external ? "_blank" : undefined} rel={action.external ? "noopener noreferrer" : undefined} onclick={() => onaction?.(action)}>{action.label}</a>
              {:else}
                <Button variant={index === 0 ? "primary" : "secondary"} size="lg" onclick={() => press(action)}>{done === action.label && action.doneLabel ? `✓ ${action.doneLabel}` : action.label}</Button>
              {/if}
            {/if}
          {/each}
        </div>
      {/if}
      {#if install?.[0]}
        <div class={["mc-hero__install", classNames?.install]}>
          <span aria-hidden="true">$</span><code>{install[0].command}</code>
          <button type="button" aria-label="Copy install command" onclick={() => copy(install[0].command)}>{copied ? "Copied" : "Copy"}</button>
        </div>
      {/if}
      {#if meta?.length}<ul class="mc-hero__meta">{#each meta as entry (entry)}<li>{entry}</li>{/each}</ul>{/if}
    </div>
    {#if media}<div class="mc-hero__media">{@render media()}</div>{/if}
  </div>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-hero { padding: clamp(32px, 8vw, 96px) 20px; color: var(--foreground); }
.mc-hero__inner { display: grid; gap: 40px; max-width: 1100px; margin-inline: auto; }
.mc-hero--split .mc-hero__inner { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: center; }
.mc-hero__copy { display: grid; gap: 18px; justify-items: center; text-align: center; }
.mc-hero--split .mc-hero__copy { justify-items: start; text-align: start; }
.mc-hero__announcement { border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 6px 14px; background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-sm); text-decoration: none; }
.mc-hero__title { margin: 0; max-width: 16ch; font-size: clamp(36px, 7vw, 72px); font-weight: 700; letter-spacing: -.05em; line-height: 1.02; text-wrap: balance; }
.mc-hero--minimal .mc-hero__title { max-width: 12ch; font-size: clamp(44px, 10vw, 112px); }
.mc-hero__description { margin: 0; max-width: 52ch; color: var(--text-secondary); font-size: 18px; line-height: 1.55; }
.mc-hero__actions { display: flex; flex-wrap: wrap; justify-content: inherit; gap: 10px; }
.mc-hero__link { display: inline-flex; align-items: center; min-height: 50px; padding: 0 22px; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-weight: 500; text-decoration: none; }
.mc-hero__link--secondary { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); }
.mc-hero__install { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 16px; padding: 6px 6px 6px 14px; background: var(--surface-muted); font-size: var(--text-sm); }
.mc-hero__install span { color: var(--text-muted); }
.mc-hero__install button { border: 0; border-radius: 10px; padding: 6px 10px; background: none; color: var(--text-secondary); font: inherit; cursor: pointer; }
.mc-hero__meta { display: flex; flex-wrap: wrap; gap: 14px; margin: 0; padding: 0; list-style: none; color: var(--text-muted); font-size: var(--text-xs); }
}
</style>
