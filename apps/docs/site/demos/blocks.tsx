"use client";

import { FilePlus2, HelpCircle, Undo2, Redo2, SearchCode, Settings2 } from "lucide-react";

import { SignupForm } from "manicat/registry/blocks/signup-form/signup-form";
import { LogoMarquee } from "manicat/registry/blocks/logo-marquee/logo-marquee";
import { PlanComparison } from "manicat/registry/blocks/plan-comparison/plan-comparison";
import { CommandPalette } from "manicat/registry/components/command-palette/command-palette";
import { NotificationCenter } from "manicat/registry/components/notification-center/notification-center";
import { FileUpload } from "manicat/registry/components/file-upload/file-upload";
import { ChangelogFeed } from "manicat/registry/blocks/changelog-feed/changelog-feed";
import { SignIn } from "manicat/registry/blocks/sign-in/sign-in";
import { PageHeader } from "manicat/registry/blocks/page-header/page-header";
import { EmptyStates } from "manicat/registry/blocks/empty-states/empty-states";
import { LoginCentered } from "manicat/registry/blocks/login-centered/login-centered";
import { SiteHeader } from "manicat/registry/blocks/site-header/site-header";
import { SiteFooter } from "manicat/registry/blocks/site-footer/site-footer";
import { HeroSection } from "manicat/registry/blocks/hero-section/hero-section";
import { FaqSection } from "manicat/registry/blocks/faq-section/faq-section";
import { ContactSection } from "manicat/registry/blocks/contact-section/contact-section";
import { BlogGrid } from "manicat/registry/blocks/blog-grid/blog-grid";
import { ComparisonTable } from "manicat/registry/blocks/comparison-table/comparison-table";
import { StatsBand } from "manicat/registry/blocks/stats-band/stats-band";
import { CtaSection } from "manicat/registry/blocks/cta-section/cta-section";
import { NewsletterSignup } from "manicat/registry/blocks/newsletter-signup/newsletter-signup";

import type { CommandItem } from "manicat/registry/components/command-palette/command-palette";
import type { NotificationItem } from "manicat/registry/components/notification-center/notification-center";

export function SignupFormDemo() {
  return <SignupForm />;
}

export function LogoMarqueeDemo() {
  return <LogoMarquee />;
}

export function PlanComparisonDemo() {
  return <PlanComparison />;
}

const paletteItems: CommandItem[] = [
  { id: "new-file", label: "New file", group: "General", icon: <FilePlus2 className="size-4" />, shortcut: "⌘ N" },
  { id: "search", label: "Search commands", group: "General", icon: <SearchCode className="size-4" />, shortcut: "⌘ K" },
  { id: "undo", label: "Undo", group: "Edit", icon: <Undo2 className="size-4" />, shortcut: "⌘ Z" },
  { id: "redo", label: "Redo", group: "Edit", icon: <Redo2 className="size-4" />, shortcut: "⇧ ⌘ Z" },
  { id: "settings", label: "Open settings", group: "Preferences", icon: <Settings2 className="size-4" />, keywords: ["options", "config"] },
  { id: "help", label: "Help center", group: "Preferences", icon: <HelpCircle className="size-4" /> },
];

export function CommandPaletteDemo() {
  return <CommandPalette items={paletteItems} />;
}

const notifications: NotificationItem[] = [
  { id: "n1", title: "Elia commented on Accordion", description: "The panel inner should keep its radius.", time: "2m", actor: { name: "Elia Kuratli", photo: "" } },
  { id: "n2", title: "Deploy succeeded", description: "manicat-docs · production", time: "18m", tone: "success" },
  { id: "n3", title: "Usage over 90%", description: "instance i-4332 is near capacity.", time: "1h", tone: "warning" },
];

export function NotificationCenterDemo() {
  return <NotificationCenter notifications={notifications} />;
}

export function FileUploadDemo() {
  return <FileUpload label="Upload a cover" description="SVG, PNG or JPG, up to 5 MB." maxSize={5 * 1024 * 1024} />;
}

export function ChangelogFeedDemo() {
  return <ChangelogFeed />;
}

export function SignInDemo() {
  return <SignIn />;
}

export function PageHeaderDemo() {
  return <PageHeader />;
}

export function EmptyStatesDemo() {
  return <EmptyStates />;
}

export function LoginCenteredDemo() {
  return <LoginCentered />;
}

export function SiteHeaderDemo() {
  return <SiteHeader />;
}

export function SiteFooterDemo() {
  return <SiteFooter />;
}

export function HeroSectionDemo() {
  return <HeroSection />;
}

export function FaqSectionDemo() {
  return <FaqSection />;
}

export function ContactSectionDemo() {
  return <ContactSection />;
}

export function BlogGridDemo() {
  return <BlogGrid />;
}

export function ComparisonTableDemo() {
  return <ComparisonTable />;
}

export function StatsBandDemo() {
  return <StatsBand />;
}

export function CtaSectionDemo() {
  return <CtaSection />;
}

export function NewsletterSignupDemo() {
  return <NewsletterSignup />;
}