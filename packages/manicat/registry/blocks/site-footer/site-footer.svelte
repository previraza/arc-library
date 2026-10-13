<script lang="ts" module>
export type SiteFooterVariant = "columns" | "minimal" | "logo";
export interface SiteFooterLink {
  label: string;
  href?: string;
  /** Opens in a new tab and shows an outward arrow. */
  external?: boolean;
}
export interface SiteFooterColumn { title: string; links: SiteFooterLink[] }
export interface SiteFooterNewsletter {
  title?: string;
  description?: string;
  placeholder?: string;
}
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Input from "@/registry/components/input/input.svelte";

const exampleColumns: SiteFooterColumn[] = [
  { title: "Product", links: [{ label: "Components" }, { label: "Blocks" }, { label: "Templates" }, { label: "Pricing" }] },
  { title: "Resources", links: [{ label: "Documentation" }, { label: "Changelog" }, { label: "Guides" }, { label: "Figma kit", external: true }] },
  { title: "Company", links: [{ label: "About" }, { label: "Customers" }, { label: "Careers" }, { label: "Contact" }] },
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  interface Props {
    variant?: SiteFooterVariant;
    brand?: { name: string; href?: string };
    tagline?: string;
    columns?: SiteFooterColumn[];
    /** Links for the minimal variant. Defaults to the first link of each column. */
    links?: SiteFooterLink[];
    legal?: SiteFooterLink[];
    socials?: SiteFooterLink[];
    /** Newsletter signup in the columns variant. Pass null to hide it. */
    newsletter?: SiteFooterNewsletter | null;
    /** A system status line. Pass null to hide it. */
    status?: { label: string; tone?: "success" | "warning" | "danger"; href?: string } | null;
    year?: number;
    /** Called with a valid address. Reject to show an error; resolve to show the subscribed state. */
    onSubscribe?: (email: string) => void | Promise<void>;
    /** Called for every link that is clicked. */
    onnavigate?: (link: SiteFooterLink) => void;
    /** Extend the inner, named parts of the footer: brand, columnTitle, link or bottom. */
    classNames?: { brand?: string; columnTitle?: string; link?: string; bottom?: string };
  }

  let {
    variant = "columns",
    brand = { name: "Manicat UI" },
    tagline = "Interface components that move with intent.",
    columns = exampleColumns,
    links,
    legal = [{ label: "Privacy" }, { label: "Terms" }, { label: "Licenses" }],
    socials = [{ label: "X", external: true }, { label: "GitHub", external: true }, { label: "LinkedIn", external: true }],
    newsletter = { title: "Get the monthly release notes", description: "One email a month. Unsubscribe anytime." },
    status = { label: "All systems normal", tone: "success" as const },
    year = new Date().getFullYear(),
    onSubscribe,
    onnavigate,
    classNames,
  }: Props = $props();

  const minimalLinks = $derived(links ?? columns.map((column) => column.links[0]).filter(Boolean));
  let email = $state("");
  let phase = $state<"idle" | "loading" | "done">("idle");
  let error = $state("");

  async function subscribe(event: SubmitEvent) {
    event.preventDefault();
    if (phase !== "idle") return;
    if (!email.trim()) return void (error = "Enter your email address");
    if (!EMAIL.test(email.trim())) return void (error = "That email doesn't look right");
    error = "";
    phase = "loading";
    try {
      await (onSubscribe ? onSubscribe(email.trim()) : new Promise((resolve) => setTimeout(resolve, 900)));
      phase = "done";
    } catch {
      phase = "idle";
      error = "We couldn't subscribe you. Try again in a moment";
    }
  }
</script>

<footer class={["mc-footer", `mc-footer--${variant}`]}>
  <div class="mc-footer__top">
    <div class="mc-footer__intro">
      {#if brand.href}
        <a href={brand.href} class={["mc-footer__brand", classNames?.brand]} onclick={() => onnavigate?.({ label: brand.name, href: brand.href })}>{brand.name}</a>
      {:else}
        <span class={["mc-footer__brand", classNames?.brand]}>{brand.name}</span>
      {/if}
      {#if variant !== "minimal"}<p class="mc-footer__tagline">{tagline}</p>{/if}
      {#if variant === "columns" && newsletter}
        <form class="mc-footer__newsletter" novalidate onsubmit={subscribe}>
          {#if newsletter.title}<h2 class="mc-footer__newsletterTitle">{newsletter.title}</h2>{/if}
          <Input bind:value={email} label="Email address" type="email" inputmode="email" autocomplete="email" placeholder={newsletter.placeholder ?? "you@example.com"} readonly={phase !== "idle"} {error} description={phase === "done" ? `Check ${email.trim()} to confirm` : newsletter.description} oninput={() => (error = "")} />
          <Button type="submit" size="sm" loading={phase === "loading"}>{phase === "done" ? "✓ Subscribed" : "Subscribe"}</Button>
        </form>
      {/if}
    </div>
    {#if variant === "minimal"}
      <ul class="mc-footer__row" aria-label="Footer">
        {#each minimalLinks as link (link.label)}
          <li><a href={link.href ?? "#"} class={classNames?.link} onclick={() => onnavigate?.(link)}>{link.label}</a></li>
        {/each}
      </ul>
    {:else}
      <nav class="mc-footer__columns" aria-label="Footer">
        {#each columns as column (column.title)}
          <div class="mc-footer__column">
            <h3 class={["mc-footer__columnTitle", classNames?.columnTitle]}>{column.title}</h3>
            <ul>
              {#each column.links as link (link.label)}
                <li>
                  <a href={link.href ?? "#"} class={classNames?.link} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} onclick={() => onnavigate?.(link)}>{link.label}{#if link.external}<span aria-hidden="true"> ↗</span>{/if}</a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </nav>
    {/if}
  </div>
  <div class={["mc-footer__bottom", classNames?.bottom]}>
    <div class="mc-footer__row">
      <span>© {year} {brand.name}</span>
      {#if legal.length}<ul class="mc-footer__row" aria-label="Legal">{#each legal as link (link.label)}<li><a href={link.href ?? "#"} onclick={() => onnavigate?.(link)}>{link.label}</a></li>{/each}</ul>{/if}
    </div>
    <div class="mc-footer__row">
      {#if status}<a href={status.href ?? "#"} class="mc-footer__status" data-tone={status.tone ?? "success"} onclick={() => onnavigate?.({ label: status.label, href: status.href })}><span aria-hidden="true"></span>{status.label}</a>{/if}
      {#if socials.length}<ul class="mc-footer__row" aria-label="Social">{#each socials as link (link.label)}<li><a href={link.href ?? "#"} target="_blank" rel="noopener noreferrer" onclick={() => onnavigate?.(link)}>{link.label} ↗</a></li>{/each}</ul>{/if}
    </div>
  </div>
  {#if variant === "logo"}<p class="mc-footer__wordmark" aria-hidden="true">{brand.name}</p>{/if}
</footer>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-footer { display: grid; gap: 28px; border-top: 1px solid var(--border); padding-top: 32px; color: var(--foreground); overflow: hidden; }
.mc-footer__top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 40px; }
.mc-footer__intro { display: grid; align-content: start; gap: 12px; }
.mc-footer__brand { font-size: 18px; font-weight: 600; letter-spacing: -.02em; color: inherit; text-decoration: none; }
.mc-footer__tagline { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-footer__newsletter { display: grid; gap: 10px; max-width: 320px; }
.mc-footer__newsletterTitle { margin: 0; font-size: 16px; font-weight: 600; }
.mc-footer__columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 24px; }
.mc-footer__columnTitle { margin: 0 0 10px; font-size: var(--text-sm); font-weight: 600; }
.mc-footer ul { margin: 0; padding: 0; list-style: none; }
.mc-footer__column ul { display: grid; gap: 8px; }
.mc-footer a { color: var(--text-secondary); font-size: var(--text-sm); text-decoration: none; transition: color var(--duration-standard) var(--ease-standard); }
.mc-footer a:hover { color: var(--foreground); }
.mc-footer__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; color: var(--text-muted); font-size: var(--text-xs); }
.mc-footer__bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px; }
.mc-footer__status { display: inline-flex; align-items: center; gap: 8px; }
.mc-footer__status span { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
.mc-footer__status[data-tone="warning"] span { background: var(--warning); }
.mc-footer__status[data-tone="danger"] span { background: var(--danger); }
.mc-footer__wordmark { margin: 0; color: var(--border); font-size: clamp(64px, 18vw, 220px); font-weight: 700; letter-spacing: -.06em; line-height: .8; mask-image: linear-gradient(#000, transparent); white-space: nowrap; }
@media (max-width: 720px) { .mc-footer__top { grid-template-columns: 1fr; } }
}
</style>
