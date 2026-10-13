<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Input from "@/registry/components/input/input.vue";

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

const exampleColumns: SiteFooterColumn[] = [
  { title: "Product", links: [{ label: "Components" }, { label: "Blocks" }, { label: "Templates" }, { label: "Pricing" }] },
  { title: "Resources", links: [{ label: "Documentation" }, { label: "Changelog" }, { label: "Guides" }, { label: "Figma kit", external: true }] },
  { title: "Company", links: [{ label: "About" }, { label: "Customers" }, { label: "Careers" }, { label: "Contact" }] },
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const props = withDefaults(
  defineProps<{
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
    /** Extend the inner, named parts of the footer: brand, columnTitle, link or bottom. */
    classNames?: { brand?: string; columnTitle?: string; link?: string; bottom?: string };
  }>(),
  {
    variant: "columns",
    brand: () => ({ name: "Manicat UI" }),
    tagline: "Interface components that move with intent.",
    columns: () => exampleColumns,
    legal: () => [{ label: "Privacy" }, { label: "Terms" }, { label: "Licenses" }],
    socials: () => [{ label: "X", external: true }, { label: "GitHub", external: true }, { label: "LinkedIn", external: true }],
    newsletter: () => ({ title: "Get the monthly release notes", description: "One email a month. Unsubscribe anytime." }),
    status: () => ({ label: "All systems normal", tone: "success" as const }),
    year: new Date().getFullYear(),
  },
);
/** Fires for every link that is clicked. Links without an href render as buttons and only emit this. */
const emit = defineEmits<{ navigate: [link: SiteFooterLink] }>();

const minimalLinks = computed(() => props.links ?? props.columns.map((column) => column.links[0]).filter(Boolean));
const email = ref("");
const state = ref<"idle" | "loading" | "done">("idle");
const error = ref("");

async function subscribe() {
  if (state.value !== "idle") return;
  if (!email.value.trim()) return void (error.value = "Enter your email address");
  if (!EMAIL.test(email.value.trim())) return void (error.value = "That email doesn't look right");
  error.value = "";
  state.value = "loading";
  try {
    await (props.onSubscribe ? props.onSubscribe(email.value.trim()) : new Promise((resolve) => setTimeout(resolve, 900)));
    state.value = "done";
  } catch {
    state.value = "idle";
    error.value = "We couldn't subscribe you. Try again in a moment";
  }
}
</script>

<template>
  <footer :class="['mc-footer', `mc-footer--${variant}`]">
    <div class="mc-footer__top">
      <div class="mc-footer__intro">
        <a v-if="brand.href" :href="brand.href" :class="['mc-footer__brand', classNames?.brand]" @click="emit('navigate', { label: brand.name, href: brand.href })">{{ brand.name }}</a>
        <span v-else :class="['mc-footer__brand', classNames?.brand]">{{ brand.name }}</span>
        <p v-if="variant !== 'minimal'" class="mc-footer__tagline">{{ tagline }}</p>
        <form v-if="variant === 'columns' && newsletter" class="mc-footer__newsletter" novalidate @submit.prevent="subscribe">
          <h2 v-if="newsletter.title" class="mc-footer__newsletterTitle">{{ newsletter.title }}</h2>
          <Input v-model="email" label="Email address" type="email" inputmode="email" autocomplete="email" :placeholder="newsletter.placeholder ?? 'you@example.com'" :readonly="state !== 'idle'" :error="error" :description="state === 'done' ? `Check ${email.trim()} to confirm` : newsletter.description" @input="error = ''" />
          <Button type="submit" size="sm" :loading="state === 'loading'">{{ state === "done" ? "✓ Subscribed" : "Subscribe" }}</Button>
        </form>
      </div>
      <ul v-if="variant === 'minimal'" class="mc-footer__row" aria-label="Footer">
        <li v-for="link in minimalLinks" :key="link.label"><a :href="link.href ?? '#'" :class="classNames?.link" @click="emit('navigate', link)">{{ link.label }}</a></li>
      </ul>
      <nav v-else class="mc-footer__columns" aria-label="Footer">
        <div v-for="column in columns" :key="column.title" class="mc-footer__column">
          <h3 :class="['mc-footer__columnTitle', classNames?.columnTitle]">{{ column.title }}</h3>
          <ul>
            <li v-for="link in column.links" :key="link.label">
              <a :href="link.href ?? '#'" :class="classNames?.link" :target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener noreferrer' : undefined" @click="emit('navigate', link)">{{ link.label }}<span v-if="link.external" aria-hidden="true"> ↗</span></a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
    <div :class="['mc-footer__bottom', classNames?.bottom]">
      <div class="mc-footer__row">
        <span>© {{ year }} {{ brand.name }}</span>
        <ul v-if="legal.length" class="mc-footer__row" aria-label="Legal"><li v-for="link in legal" :key="link.label"><a :href="link.href ?? '#'" @click="emit('navigate', link)">{{ link.label }}</a></li></ul>
      </div>
      <div class="mc-footer__row">
        <a v-if="status" :href="status.href ?? '#'" class="mc-footer__status" :data-tone="status.tone ?? 'success'" @click="emit('navigate', { label: status.label, href: status.href })"><span aria-hidden="true" />{{ status.label }}</a>
        <ul v-if="socials.length" class="mc-footer__row" aria-label="Social"><li v-for="link in socials" :key="link.label"><a :href="link.href ?? '#'" target="_blank" rel="noopener noreferrer" @click="emit('navigate', link)">{{ link.label }} ↗</a></li></ul>
      </div>
    </div>
    <p v-if="variant === 'logo'" class="mc-footer__wordmark" aria-hidden="true">{{ brand.name }}</p>
  </footer>
</template>

<style>
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
</style>
