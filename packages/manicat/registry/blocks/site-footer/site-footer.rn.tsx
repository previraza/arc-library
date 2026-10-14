import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Input } from "@/registry/components/input/input.rn";
import { useTokens } from "@/lib/rn-tokens";

export type SiteFooterVariant = "columns" | "minimal" | "logo";
export interface SiteFooterLink {
  label: string;
  href?: string;
  /** Shows an outward arrow. */
  external?: boolean;
}
export interface SiteFooterColumn { title: string; links: SiteFooterLink[] }
export interface SiteFooterNewsletter {
  title?: string;
  description?: string;
  placeholder?: string;
  /** Called with a valid address. Throw to show an error; resolve to show the subscribed state. */
  onSubscribe?: (email: string) => void | Promise<void>;
}

export const siteFooterExampleColumns: SiteFooterColumn[] = [
  { title: "Product", links: [{ label: "Components" }, { label: "Blocks" }, { label: "Templates" }, { label: "Pricing" }] },
  { title: "Resources", links: [{ label: "Documentation" }, { label: "Changelog" }, { label: "Guides" }, { label: "Figma kit", external: true }] },
  { title: "Company", links: [{ label: "About" }, { label: "Customers" }, { label: "Careers" }, { label: "Contact" }] },
];
const exampleLegal: SiteFooterLink[] = [{ label: "Privacy" }, { label: "Terms" }, { label: "Licenses" }];
const exampleSocials: SiteFooterLink[] = [{ label: "X", external: true }, { label: "GitHub", external: true }, { label: "LinkedIn", external: true }];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SiteFooterProps extends ViewProps {
  variant?: SiteFooterVariant;
  brand?: { name: string; href?: string; mark?: ReactNode };
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
  /** Called for every link that is pressed. Links with an href are also opened. */
  onNavigate?: (link: SiteFooterLink) => void;
  /** Extend the inner, named parts of the footer. The React Native counterpart of `classNames`. */
  styles?: { brand?: StyleProp<TextStyle>; columnTitle?: StyleProp<TextStyle>; link?: StyleProp<TextStyle>; bottom?: StyleProp<ViewStyle> };
}

function Newsletter({ title, description, placeholder = "you@example.com", onSubscribe }: SiteFooterNewsletter) {
  const tokens = useTokens();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  async function submit() {
    if (state !== "idle") return;
    if (!email.trim()) return setError("Enter your email address");
    if (!EMAIL.test(email.trim())) return setError("That email doesn't look right");
    setError("");
    setState("loading");
    try {
      await (onSubscribe ? onSubscribe(email.trim()) : new Promise((resolve) => setTimeout(resolve, 900)));
      setState("done");
    } catch {
      setState("idle");
      setError("We couldn't subscribe you. Try again in a moment");
    }
  }
  return (
    <View style={{ gap: 8 }}>
      {title ? <Text accessibilityRole="header" style={{ color: tokens.foreground, fontSize: 16, fontWeight: "600" }}>{title}</Text> : null}
      <Input label="Email address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder={placeholder} value={email} editable={state === "idle"} onChangeText={(value) => { setEmail(value); setError(""); }} error={error} description={state === "done" ? `Check ${email.trim()} to confirm` : description} />
      <Button size="sm" loading={state === "loading"} onPress={() => void submit()}>{state === "done" ? "✓ Subscribed" : "Subscribe"}</Button>
    </View>
  );
}

export function SiteFooter({ variant = "columns", brand = { name: "Manicat UI" }, tagline = "Interface components that move with intent.", columns = siteFooterExampleColumns, links, legal = exampleLegal, socials = exampleSocials, newsletter = { title: "Get the monthly release notes", description: "One email a month. Unsubscribe anytime." }, status = { label: "All systems normal", tone: "success" }, year = new Date().getFullYear(), onNavigate, style, styles: parts, ...props }: SiteFooterProps) {
  const tokens = useTokens();
  const press = (link: SiteFooterLink) => { onNavigate?.(link); if (link.href) void Linking.openURL(link.href); };
  const anchor = (link: SiteFooterLink, key?: string) => (
    <Pressable key={key ?? link.label} accessibilityRole={link.href ? "link" : "button"} onPress={() => press(link)}>
      <Text style={[{ color: tokens.textSecondary, fontSize: 14 }, parts?.link]}>{link.label}{link.external ? " ↗" : ""}</Text>
    </Pressable>
  );
  const row = (items: SiteFooterLink[], label: string) => <View accessibilityLabel={label} style={local.inline}>{items.map((link) => anchor(link))}</View>;
  const dot = { success: tokens.success, warning: tokens.warning, danger: tokens.danger }[status?.tone ?? "success"];

  const bottom = (
    <View style={[local.bottom, { borderTopColor: tokens.border }, parts?.bottom]}>
      <View style={local.inline}>
        <Text style={{ color: tokens.textMuted, fontSize: 13 }}>© {year} {brand.name}</Text>
        {legal.length ? row(legal, "Legal") : null}
      </View>
      {status ? (
        <Pressable accessibilityRole="button" onPress={() => onNavigate?.({ label: status.label, href: status.href })} style={local.status}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
          <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{status.label}</Text>
        </Pressable>
      ) : null}
      {socials.length ? row(socials, "Social") : null}
    </View>
  );

  return (
    <View {...props} accessibilityRole="summary" style={[local.root, { borderTopColor: tokens.border }, style]}>
      <Pressable accessibilityRole="link" onPress={() => press({ label: brand.name, href: brand.href })} style={local.brandRow}>
        {brand.mark}
        <Text style={[{ color: tokens.foreground, fontSize: 18, fontWeight: "600" }, parts?.brand]}>{brand.name}</Text>
      </Pressable>
      {variant !== "minimal" ? <Text style={{ color: tokens.textSecondary, fontSize: 14 }}>{tagline}</Text> : null}
      {variant === "columns" && newsletter ? <Newsletter {...newsletter} /> : null}
      {variant === "minimal" ? row(links ?? columns.map((column) => column.links[0]).filter(Boolean), "Footer") : (
        columns.map((column) => (
          <View key={column.title} style={{ gap: 8 }}>
            <Text accessibilityRole="header" style={[{ color: tokens.foreground, fontSize: 13, fontWeight: "600" }, parts?.columnTitle]}>{column.title}</Text>
            {column.links.map((link) => anchor(link, `${column.title}-${link.label}`))}
          </View>
        ))
      )}
      {bottom}
      {variant === "logo" ? <Text accessibilityElementsHidden style={{ color: tokens.border, fontSize: 72, fontWeight: "700", letterSpacing: -3 }} numberOfLines={1}>{brand.name}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 18, borderTopWidth: 1, paddingTop: 24 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inline: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  bottom: { gap: 12, borderTopWidth: 1, paddingTop: 16 },
  status: { flexDirection: "row", alignItems: "center", gap: 8 },
});

export default SiteFooter;
