<script lang="ts" module>
export type SiteHeaderVariant = "simple" | "centered" | "mega";
export interface SiteHeaderLink { label: string; description?: string; href?: string }
export interface SiteHeaderFeature { title: string; description?: string; href?: string }
export interface SiteHeaderItem {
  /** Stable id, used for the current section. */
  value: string;
  label: string;
  href?: string;
  /** Links in the dropdown panel. */
  links?: SiteHeaderLink[];
  feature?: SiteHeaderFeature;
}
export interface SiteHeaderAction { label: string; href?: string }
export interface SiteHeaderDestination { label: string; href?: string; section?: string }

export const siteHeaderExampleItems: SiteHeaderItem[] = [
  {
    value: "product", label: "Product",
    links: [
      { label: "Components", description: "140 interactive React components" },
      { label: "Blocks", description: "Complete sections, ready to ship" },
      { label: "Templates", description: "Starter sites with every page" },
      { label: "Themes", description: "Tune color, radius, and motion" },
    ],
    feature: { title: "What's new in 2.4", description: "Site headers, footers, and hero sections." },
  },
  {
    value: "resources", label: "Resources",
    links: [
      { label: "Documentation", description: "Install, theme, and compose" },
      { label: "Guides", description: "Patterns for real product work" },
      { label: "Changelog", description: "Every release, week by week" },
      { label: "Community", description: "Questions, answers, and showcases" },
    ],
  },
  { value: "pricing", label: "Pricing" },
  { value: "customers", label: "Customers" },
];
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";

  interface Props {
    variant?: SiteHeaderVariant;
    brand?: { name: string; href?: string };
    items?: SiteHeaderItem[];
    secondaryAction?: SiteHeaderAction | null;
    primaryAction?: SiteHeaderAction | null;
    /** Accessible name of the main navigation. */
    label?: string;
    /** The current section value. Bind it with `bind:current`. */
    current?: string;
    /** Called for every destination that is clicked. */
    onnavigate?: (destination: SiteHeaderDestination) => void;
    /** Extend the inner, named parts of the header: bar, brand, item or panel. */
    classNames?: { bar?: string; brand?: string; item?: string; panel?: string };
  }

  let { variant = "mega", brand = { name: "Manicat UI" }, items = siteHeaderExampleItems, secondaryAction = { label: "Sign in" }, primaryAction = { label: "Get Manicat UI" }, label = "Main", current = $bindable(""), onnavigate, classNames }: Props = $props();

  let open = $state<string | null>(null);
  let menu = $state(false);
  let root = $state<HTMLElement>();

  function choose(item: SiteHeaderItem) {
    if (item.links?.length) {
      open = open === item.value ? null : item.value;
      return;
    }
    current = item.value;
    open = null;
    menu = false;
    onnavigate?.({ label: item.label, href: item.href });
  }
  function go(link: SiteHeaderLink, section?: string) {
    open = null;
    menu = false;
    onnavigate?.({ ...link, section });
  }
  function outside(event: MouseEvent) {
    if (root && !root.contains(event.target as Node)) open = null;
  }
  function escape(event: KeyboardEvent) {
    if (event.key === "Escape") open = null;
  }
</script>

<svelte:document onpointerdown={outside} onkeydown={escape} />

<header bind:this={root} class={["mc-siteheader", `mc-siteheader--${variant}`]}>
  <div class={["mc-siteheader__bar", classNames?.bar]}>
    <a href={brand.href ?? "#"} class={["mc-siteheader__brand", classNames?.brand]} onclick={() => onnavigate?.({ label: brand.name, href: brand.href })}>{brand.name}</a>
    <nav class={["mc-siteheader__nav", { "mc-siteheader__nav--open": menu }]} aria-label={label}>
      <ul>
        {#each items as item (item.value)}
          <li>
            <button type="button" class={["mc-siteheader__item", classNames?.item]} aria-expanded={item.links?.length ? open === item.value : undefined} aria-current={current === item.value ? "page" : undefined} onclick={() => choose(item)}>{item.label}{#if item.links?.length}<span aria-hidden="true"> ▾</span>{/if}</button>
            {#if item.links?.length && open === item.value}
              <div class={["mc-siteheader__panel", classNames?.panel]}>
                <ul>
                  {#each item.links as link (link.label)}
                    <li><a href={link.href ?? "#"} onclick={() => go(link, item.label)}><strong>{link.label}</strong>{#if link.description}<small>{link.description}</small>{/if}</a></li>
                  {/each}
                </ul>
                {#if variant === "mega" && item.feature}
                  <a href={item.feature.href ?? "#"} class="mc-siteheader__feature" onclick={() => go({ label: item.feature!.title, href: item.feature!.href }, item.label)}><strong>{item.feature.title}</strong><small>{item.feature.description}</small></a>
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      <div class="mc-siteheader__actions">
        {#if secondaryAction}<Button variant="secondary" size="sm" onclick={() => onnavigate?.(secondaryAction)}>{secondaryAction.label}</Button>{/if}
        {#if primaryAction}<Button size="sm" onclick={() => onnavigate?.(primaryAction)}>{primaryAction.label}</Button>{/if}
      </div>
    </nav>
    <button type="button" class="mc-siteheader__toggle" aria-expanded={menu} aria-label="Toggle menu" onclick={() => (menu = !menu)}>{menu ? "✕" : "☰"}</button>
  </div>
</header>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-siteheader { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid var(--border); background: color-mix(in oklab, var(--background) 88%, transparent); backdrop-filter: blur(12px); color: var(--foreground); }
.mc-siteheader__bar { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 20px; }
.mc-siteheader__brand { color: inherit; font-size: 18px; font-weight: 600; letter-spacing: -.02em; text-decoration: none; }
.mc-siteheader__nav { display: flex; flex: 1; align-items: center; justify-content: space-between; gap: 16px; }
.mc-siteheader--centered .mc-siteheader__nav > ul { margin-inline: auto; }
.mc-siteheader__nav ul { display: flex; gap: 4px; margin: 0; padding: 0; list-style: none; }
.mc-siteheader__nav > ul > li { position: relative; }
.mc-siteheader__item { border: 0; border-radius: var(--radius-pill); padding: 8px 12px; background: none; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-siteheader__item:hover, .mc-siteheader__item[aria-current="page"], .mc-siteheader__item[aria-expanded="true"] { background: var(--surface-muted); color: var(--foreground); }
.mc-siteheader__panel { position: absolute; top: calc(100% + 8px); left: 0; display: flex; gap: 12px; min-width: 280px; border: 1px solid var(--border); border-radius: 20px; padding: 10px; background: var(--surface); box-shadow: 0 16px 40px rgb(0 0 0 / .12); }
.mc-siteheader__panel ul { display: grid; flex: 1; gap: 2px; }
.mc-siteheader__panel a { display: grid; gap: 2px; border-radius: 12px; padding: 8px 10px; color: inherit; text-decoration: none; }
.mc-siteheader__panel a:hover { background: var(--surface-muted); }
.mc-siteheader__panel small { color: var(--text-muted); font-size: var(--text-xs); }
.mc-siteheader__feature { width: 180px; align-content: end; background: var(--surface-muted); }
.mc-siteheader__actions { display: flex; gap: 8px; }
.mc-siteheader__toggle { display: none; border: 0; background: none; color: inherit; font-size: 20px; cursor: pointer; }
@media (max-width: 760px) {
  .mc-siteheader__toggle { display: block; }
  .mc-siteheader__nav { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: stretch; border-bottom: 1px solid var(--border); padding: 12px 20px; background: var(--background); }
  .mc-siteheader__nav--open { display: flex; }
  .mc-siteheader__nav ul { flex-direction: column; }
  .mc-siteheader__panel { position: static; box-shadow: none; }
}
}
</style>
