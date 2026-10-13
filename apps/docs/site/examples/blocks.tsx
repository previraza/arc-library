"use client";

import { useState } from "react";
import { FilePlus2, HelpCircle, Redo2, SearchCode, Settings2, Undo2 } from "lucide-react";
import { SignupForm } from "manicat/registry/blocks/signup-form/signup-form";
import { SignIn } from "manicat/registry/blocks/sign-in/sign-in";
import { LoginCentered } from "manicat/registry/blocks/login-centered/login-centered";
import { LogoMarquee } from "manicat/registry/blocks/logo-marquee/logo-marquee";
import { PlanComparison } from "manicat/registry/blocks/plan-comparison/plan-comparison";
import { HeroSection } from "manicat/registry/blocks/hero-section/hero-section";
import { CtaSection } from "manicat/registry/blocks/cta-section/cta-section";
import { StatsBand } from "manicat/registry/blocks/stats-band/stats-band";
import { FaqSection } from "manicat/registry/blocks/faq-section/faq-section";
import { SiteHeader } from "manicat/registry/blocks/site-header/site-header";
import { SiteFooter } from "manicat/registry/blocks/site-footer/site-footer";
import { PageHeader } from "manicat/registry/blocks/page-header/page-header";
import { NewsletterSignup } from "manicat/registry/blocks/newsletter-signup/newsletter-signup";
import { ContactSection } from "manicat/registry/blocks/contact-section/contact-section";
import { BlogGrid } from "manicat/registry/blocks/blog-grid/blog-grid";
import { ComparisonTable } from "manicat/registry/blocks/comparison-table/comparison-table";
import type { ComparisonColumn, ComparisonSection } from "manicat/registry/blocks/comparison-table/comparison-table";
import { ChangelogFeed } from "manicat/registry/blocks/changelog-feed/changelog-feed";
import { EmptyStates } from "manicat/registry/blocks/empty-states/empty-states";
import { CommandPalette } from "manicat/registry/components/command-palette/command-palette";
import type { CommandItem } from "manicat/registry/components/command-palette/command-palette";
import { NotificationCenter } from "manicat/registry/components/notification-center/notification-center";
import type { NotificationItem } from "manicat/registry/components/notification-center/notification-center";
import { FileUpload } from "manicat/registry/components/file-upload/file-upload";

/**
 * @title Create account
 * Handle the submit yourself; surface a server error and react to the social providers.
 */
export function SignupFormAccountExample() {
  const [error, setError] = useState<string | null>(null);

  return (
    <SignupForm
      serverError={error}
      onSubmit={async (details) => {
        // Replace with your own request.
        setError(details.email.endsWith("@example.com") ? "That address is already registered." : null);
      }}
      onProvider={(provider) => console.log("continue with", provider)}
    />
  );
}

/**
 * @title Sign in
 * Email code, passkey and providers in one card; onSignIn receives the account and the method used.
 */
export function SignInAccountExample() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="grid w-full gap-3">
      <SignIn onSignIn={(account, method) => setLast(`${account.name} signed in with ${method}`)} />
      {last && <p className="text-center text-sm text-fd-muted-foreground">{last}</p>}
    </div>
  );
}

/**
 * @title Centered login page
 * A full login screen with terms and privacy links.
 */
export function LoginCenteredPageExample() {
  return <LoginCentered termsHref="/terms" privacyHref="/privacy" onSignIn={(email, method) => console.log(email, method)} />;
}

/**
 * @title Customers strip
 * “Trusted by” logos drifting under a headline, in mono tone to stay quiet.
 */
export function LogoMarqueeTrustedExample() {
  return <LogoMarquee title="Trusted by teams who ship" description="From two-person studios to public companies." tone="mono" />;
}

/**
 * @title Pricing page
 * Drop the plan comparison on a pricing route as is.
 */
export function PlanComparisonPricingExample() {
  return <PlanComparison />;
}

/**
 * @title Landing hero
 * A hero with an announcement pill, install command and two actions.
 */
export function HeroSectionLandingExample() {
  return (
    <HeroSection
      variant="minimal"
      title="Interfaces that feel finished"
      description="Copy a component, own the code, and ship."
      announcement={{ label: "New: morph select", href: "/components/morph-select" }}
      primaryAction={{ label: "Get started", href: "/docs" }}
      secondaryAction={{ label: "Browse components", href: "/components" }}
      install={[{ label: "pnpm", command: "pnpm dlx shadcn@latest add @manicat/button" }]}
    />
  );
}

/**
 * @title Closing banner
 * The call to action at the end of a landing page.
 */
export function CtaSectionClosingExample() {
  return (
    <CtaSection
      variant="centered"
      title="Start building today"
      description="Free to use. Every component is yours to edit."
      primaryAction={{ label: "Get started", href: "/docs" }}
      secondaryAction={{ label: "Talk to us", href: "/contact" }}
      note="No credit card required"
    />
  );
}

/**
 * @title Numbers that count up
 * Four headline stats with detail lines, ruled with hairlines.
 */
export function StatsBandHeadlineExample() {
  return (
    <StatsBand
      layout="divided"
      title="Built for scale"
      stats={[
        { value: 12, suffix: "M", label: "Requests a day", detail: "Across 35 regions" },
        { value: 99.99, suffix: "%", decimals: 2, label: "Uptime", detail: "Last 90 days" },
        { value: 38, suffix: " ms", label: "Median latency", detail: "At the edge" },
        { value: 4200, label: "Teams", detail: "And growing" },
      ]}
    />
  );
}

/**
 * @title Pricing FAQ
 * Your own questions, one open at a time.
 */
export function FaqSectionPricingExample() {
  return (
    <FaqSection
      variant="accordion"
      title="Pricing questions"
      items={[
        { question: "Can I cancel any time?", answer: "Yes. Your plan stays active until the end of the billing period." },
        { question: "Do you offer refunds?", answer: "Within 14 days of purchase, no questions asked." },
        { question: "Is there a team discount?", answer: "Teams of ten or more get 20% off." },
      ]}
    />
  );
}

/**
 * @title Searchable help center
 * A search variant that filters the questions as the visitor types.
 */
export function FaqSectionSearchExample() {
  return (
    <FaqSection
      variant="search"
      title="How can we help?"
      items={[
        { question: "How do I reset my password?", answer: "Use “Forgot password” on the sign-in page.", category: "Account" },
        { question: "How do I invite teammates?", answer: "Open Settings, then Members, then Invite.", category: "Team" },
        { question: "Where are invoices?", answer: "Billing, then Invoices. Each one downloads as PDF.", category: "Billing" },
      ]}
    />
  );
}

/**
 * @title Marketing header
 * A simple header with brand, links and two actions.
 */
export function SiteHeaderMarketingExample() {
  return (
    <SiteHeader
      variant="simple"
      brand={{ name: "Acme" }}
      items={[
        { value: "product", label: "Product", href: "/product" },
        { value: "pricing", label: "Pricing", href: "/pricing" },
        { value: "docs", label: "Docs", href: "/docs" },
      ]}
      defaultCurrent="product"
      secondaryAction={{ label: "Sign in", href: "/sign-in" }}
      primaryAction={{ label: "Get started", href: "/signup" }}
    />
  );
}

/**
 * @title Site footer
 * Link columns, a newsletter box and legal links.
 */
export function SiteFooterColumnsExample() {
  return (
    <SiteFooter
      variant="columns"
      brand={{ name: "Acme" }}
      tagline="Software that gets out of the way."
      columns={[
        { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }] },
        { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }] },
      ]}
      legal={[{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }]}
      newsletter={{ title: "Stay in the loop", onSubscribe: async (email) => console.log(email) }}
    />
  );
}

/**
 * @title Settings page header
 * The top of an app page: title, description and actions.
 */
export function PageHeaderSettingsExample() {
  return <PageHeader />;
}

/**
 * @title Newsletter box
 * Collect an email and handle the subscription yourself.
 */
export function NewsletterSignupInlineExample() {
  return (
    <NewsletterSignup
      variant="inline"
      title="The Friday digest"
      description="One short email a week. Unsubscribe any time."
      buttonLabel="Subscribe"
      onSubscribe={async (email) => console.log("subscribe", email)}
    />
  );
}

/**
 * @title Contact form
 * A form with topics; onSubmit receives the message.
 */
export function ContactSectionFormExample() {
  return (
    <ContactSection
      variant="form"
      title="Talk to us"
      description="We usually answer within one business day."
      topics={["Sales", "Support", "Press"]}
      onSubmit={async (message) => console.log(message)}
    />
  );
}

/**
 * @title Blog index
 * A filterable grid with featured post and pagination.
 */
export function BlogGridIndexExample() {
  return <BlogGrid title="From the blog" description="Notes on design and engineering." pageSize={6} showFeatured />;
}

const columns: ComparisonColumn[] = [
  { id: "us", name: "Acme", caption: "$10 per seat", highlight: true },
  { id: "them", name: "Legacy suite", caption: "$24 per seat" },
];

const sections: ComparisonSection[] = [
  {
    id: "planning",
    title: "Planning",
    rows: [
      { id: "projects", feature: "Projects", values: { us: "Unlimited", them: "Up to 50" } },
      { id: "roadmaps", feature: "Timelines", values: { us: true, them: true } },
      { id: "deps", feature: "Dependencies", hint: "Blocked work moves with its blocker", values: { us: true, them: false } },
    ],
  },
];

/**
 * @title Us vs them
 * Your product against one competitor, with a switch to hide the rows that don't differ.
 */
export function ComparisonTableVersusExample() {
  return (
    <ComparisonTable
      title="How we compare"
      columns={columns}
      sections={sections}
      cta={{ label: "Start free", href: "/signup" }}
    />
  );
}

/**
 * @title Product changelog
 * A month-by-month feed of what changed.
 */
export function ChangelogFeedProductExample() {
  return <ChangelogFeed title="What's new" subtitle="Everything we shipped this quarter." />;
}

/**
 * @title Empty states
 * Pick the illustration that fits: no results, no data, offline.
 */
export function EmptyStatesGalleryExample() {
  return <EmptyStates />;
}

const commands: CommandItem[] = [
  { id: "new-file", label: "New file", group: "General", icon: <FilePlus2 className="size-4" />, shortcut: "⌘ N" },
  { id: "search", label: "Search commands", group: "General", icon: <SearchCode className="size-4" />, shortcut: "⌘ K" },
  { id: "undo", label: "Undo", group: "Edit", icon: <Undo2 className="size-4" />, shortcut: "⌘ Z" },
  { id: "redo", label: "Redo", group: "Edit", icon: <Redo2 className="size-4" />, shortcut: "⇧ ⌘ Z" },
  { id: "settings", label: "Open settings", group: "Preferences", icon: <Settings2 className="size-4" />, keywords: ["options", "config"] },
  { id: "help", label: "Help center", group: "Preferences", icon: <HelpCircle className="size-4" /> },
];

/**
 * @title App command menu
 * Grouped commands with shortcuts and search keywords: typing “config” finds Open settings.
 */
export function CommandPaletteAppExample() {
  return <CommandPalette items={commands} />;
}

const inbox: NotificationItem[] = [
  { id: "n1", title: "Elia commented on Accordion", description: "The panel inner should keep its radius.", time: "2m", actor: { name: "Elia Kuratli", photo: "" } },
  { id: "n2", title: "Deploy succeeded", description: "docs · production", time: "18m", tone: "success" },
  { id: "n3", title: "Usage over 90%", description: "Instance i-4332 is near capacity.", time: "1h", tone: "warning" },
];

/**
 * @title Notification inbox
 * A bell with an unread count, grouped by time, with tones for success and warnings.
 */
export function NotificationCenterInboxExample() {
  return <NotificationCenter notifications={inbox} />;
}

/**
 * @title Cover upload
 * A single-file uploader with a size limit and a hint about accepted formats.
 */
export function FileUploadCoverExample() {
  return <FileUpload label="Upload a cover" description="SVG, PNG or JPG, up to 5 MB." maxSize={5 * 1024 * 1024} />;
}
