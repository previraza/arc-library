<script lang="ts" module>
  export interface CtaAction {
    label: string;
    /** Renders a link. */
    href?: string;
    /** With no href, the button confirms in place with this label, which suits previews. */
    confirmedLabel?: string;
  }
  export type CtaVariant = "centered" | "split" | "banner";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "@/registry/components/button/button.svelte";

  const copy: Record<CtaVariant, { title: string; description: string; primary: CtaAction; secondary?: CtaAction; note: string; points: string[] }> = {
    centered: { title: "Start building in minutes", description: "Set up a workspace, invite your team, and ship the first project this week. Free for 14 days.", primary: { label: "Start free trial", confirmedLabel: "Trial started" }, secondary: { label: "Talk to sales", confirmedLabel: "We'll email you" }, note: "No credit card required", points: [] },
    split: { title: "Your team, set up before lunch", description: "Import your projects, bring everyone in, and keep working the way you already do.", primary: { label: "Create a workspace", confirmedLabel: "Workspace created" }, secondary: { label: "Book a demo", confirmedLabel: "Demo requested" }, note: "", points: ["Import from any tracker in one step", "Single sign-on and audit logs included", "Cancel anytime from settings"] },
    banner: { title: "Workflows are here", description: "Automate handoffs between teams with no code.", primary: { label: "See how it works", confirmedLabel: "Opened" }, note: "", points: [] },
  };

  interface Props {
    variant?: CtaVariant;
    title?: string;
    description?: string;
    primaryAction?: CtaAction;
    /** Not shown in the banner variant. Pass null to hide it. */
    secondaryAction?: CtaAction | null;
    note?: string;
    /** Image URLs for the faces beside the note in the centered variant. */
    faces?: string[];
    points?: string[];
    /** Banner only: shows a dismiss button. */
    dismissible?: boolean;
    ondismiss?: () => void;
    /** The visual beside the copy in the split variant. */
    visual?: Snippet;
    /** Extend the inner, named parts of the block: title, description, actions or note. */
    classNames?: { title?: string; description?: string; actions?: string; note?: string };
  }

  let { variant = "centered", title, description, primaryAction, secondaryAction, note, faces = [], points, dismissible, ondismiss, visual, classNames }: Props = $props();

  const text = $derived(copy[variant]);
  const primary = $derived(primaryAction ?? text.primary);
  const secondary = $derived(secondaryAction === null ? null : (secondaryAction ?? text.secondary));
  const list = $derived(points ?? text.points);
  let open = $state(true);
  let confirmed = $state<Record<string, boolean>>({});

  function press(key: string) {
    confirmed = { ...confirmed, [key]: !confirmed[key] };
  }
  function dismiss() {
    open = false;
    ondismiss?.();
  }
</script>

{#if variant !== "banner" || open}
  <section class={["mc-cta", `mc-cta--${variant}`]}>
    {#if variant === "banner"}
      <div class="mc-cta__banner">
        <p class="mc-cta__bannerText"><strong>{title ?? text.title}</strong> <span>{description ?? text.description}</span></p>
        {#if primary.href}
          <a href={primary.href} class="mc-cta__link">{primary.label}</a>
        {:else}
          <Button size="sm" onclick={() => press("primary")}>{confirmed.primary ? `✓ ${primary.confirmedLabel ?? primary.label}` : primary.label}</Button>
        {/if}
        {#if dismissible}<button type="button" class="mc-cta__dismiss" aria-label="Dismiss" onclick={dismiss}>✕</button>{/if}
      </div>
    {:else}
      <div class="mc-cta__body">
        <div class="mc-cta__copy">
          <h2 class={["mc-cta__title", classNames?.title]}>{title ?? text.title}</h2>
          <p class={["mc-cta__description", classNames?.description]}>{description ?? text.description}</p>
          {#if variant === "split" && list.length}<ul class="mc-cta__points">{#each list as point (point)}<li>✓ {point}</li>{/each}</ul>{/if}
          <div class={["mc-cta__actions", classNames?.actions]}>
            {#if primary.href}
              <a href={primary.href} class="mc-cta__link">{primary.label}</a>
            {:else}
              <Button size="lg" onclick={() => press("primary")}>{confirmed.primary ? `✓ ${primary.confirmedLabel ?? primary.label}` : primary.label}</Button>
            {/if}
            {#if secondary}
              {#if secondary.href}
                <a href={secondary.href} class="mc-cta__link mc-cta__link--secondary">{secondary.label}</a>
              {:else}
                <Button variant="secondary" size="lg" onclick={() => press("secondary")}>{confirmed.secondary ? `✓ ${secondary.confirmedLabel ?? secondary.label}` : secondary.label}</Button>
              {/if}
            {/if}
          </div>
          {#if variant === "centered"}
            <p class={["mc-cta__note", classNames?.note]}>
              <span class="mc-cta__faces" aria-hidden="true">{#each faces.slice(0, 4) as src (src)}<img {src} alt="" width="26" height="26" />{/each}</span>
              {note ?? text.note}
            </p>
          {/if}
        </div>
        {#if variant === "split"}<div class="mc-cta__stage">{@render visual?.()}</div>{/if}
      </div>
    {/if}
  </section>
{/if}

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-cta { color: var(--foreground); }
.mc-cta__body { display: grid; gap: 32px; }
.mc-cta--split .mc-cta__body { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: center; }
.mc-cta--centered .mc-cta__copy { display: grid; justify-items: center; text-align: center; }
.mc-cta__copy { display: grid; gap: 14px; }
.mc-cta__title { margin: 0; font-size: 34px; font-weight: 600; letter-spacing: -.04em; }
.mc-cta__description { margin: 0; max-width: 48ch; color: var(--text-secondary); }
.mc-cta__points { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; font-size: var(--text-sm); }
.mc-cta__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.mc-cta__link { display: inline-flex; align-items: center; min-height: 50px; padding: 0 22px; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-weight: 500; text-decoration: none; }
.mc-cta__link--secondary { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); }
.mc-cta__note { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-cta__faces { display: inline-flex; }
.mc-cta__faces img { width: 26px; height: 26px; margin-inline-start: -6px; border: 2px solid var(--background); border-radius: 50%; }
.mc-cta__faces img:first-child { margin-inline-start: 0; }
.mc-cta__banner { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 20px; padding: 10px 14px; background: var(--surface-muted); }
.mc-cta__bannerText { flex: 1; margin: 0; min-width: 200px; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-cta__bannerText strong { color: var(--foreground); }
.mc-cta__dismiss { border: 0; background: none; color: var(--text-muted); cursor: pointer; }
}
</style>
