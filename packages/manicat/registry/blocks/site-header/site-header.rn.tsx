import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { useTokens } from "@/lib/rn-tokens";

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

export interface SiteHeaderProps extends ViewProps {
  /** Layout hint kept for parity with the web block; phones always use the collapsed menu. */
  variant?: SiteHeaderVariant;
  brand?: { name: string; href?: string };
  items?: SiteHeaderItem[];
  /** Current section value (controlled). */
  current?: string;
  defaultCurrent?: string;
  onCurrentChange?: (value: string) => void;
  /** Called for every destination that is pressed. Destinations with an href are also opened. */
  onNavigate?: (destination: SiteHeaderDestination) => void;
  secondaryAction?: SiteHeaderAction | null;
  primaryAction?: SiteHeaderAction | null;
  /** Extend the inner, named parts of the header. The React Native counterpart of `classNames`. */
  styles?: { bar?: StyleProp<ViewStyle>; brand?: StyleProp<TextStyle>; item?: StyleProp<TextStyle>; panel?: StyleProp<ViewStyle> };
}

export function SiteHeader({ brand = { name: "Manicat UI" }, items = siteHeaderExampleItems, current: currentProp, defaultCurrent, onCurrentChange, onNavigate, secondaryAction = { label: "Sign in" }, primaryAction = { label: "Get Manicat UI" }, style, styles: parts, ...props }: SiteHeaderProps) {
  const tokens = useTokens();
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inner, setInner] = useState(defaultCurrent ?? "");
  const current = currentProp ?? inner;

  const go = (destination: SiteHeaderDestination) => {
    onNavigate?.(destination);
    if (destination.href) void Linking.openURL(destination.href);
  };
  const choose = (item: SiteHeaderItem) => {
    if (item.links?.length) return setExpanded((value) => (value === item.value ? null : item.value));
    setInner(item.value);
    onCurrentChange?.(item.value);
    go({ label: item.label, href: item.href });
    setMenu(false);
  };

  return (
    <View {...props} accessibilityRole="header" style={[{ borderBottomWidth: 1, borderBottomColor: tokens.border, backgroundColor: tokens.background }, style]}>
      <View style={[local.bar, parts?.bar]}>
        <Pressable accessibilityRole="link" onPress={() => go({ label: brand.name, href: brand.href })}>
          <Text style={[{ color: tokens.foreground, fontSize: 18, fontWeight: "600" }, parts?.brand]}>{brand.name}</Text>
        </Pressable>
        <Button variant="ghost" size="sm" accessibilityLabel={menu ? "Close menu" : "Open menu"} accessibilityState={{ expanded: menu }} onPress={() => setMenu((value) => !value)}>{menu ? "✕" : "☰"}</Button>
      </View>
      {menu ? (
        <View style={[local.panel, parts?.panel]}>
          {items.map((item) => (
            <View key={item.value}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === item.value, selected: current === item.value }} onPress={() => choose(item)} style={local.row}>
                <Text style={[{ color: current === item.value ? tokens.foreground : tokens.textSecondary, fontSize: 16, fontWeight: current === item.value ? "600" : "400" }, parts?.item]}>{item.label}</Text>
                {item.links?.length ? <Text style={{ color: tokens.textMuted }}>{expanded === item.value ? "−" : "+"}</Text> : null}
              </Pressable>
              {expanded === item.value ? (
                <View style={{ paddingLeft: 12, gap: 10, paddingBottom: 8 }}>
                  {item.links?.map((link) => (
                    <Pressable key={link.label} accessibilityRole="link" onPress={() => { go({ ...link, section: item.label }); setMenu(false); }}>
                      <Text style={{ color: tokens.foreground, fontSize: 15 }}>{link.label}</Text>
                      {link.description ? <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{link.description}</Text> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
          <View style={local.actions}>
            {secondaryAction ? <Button variant="secondary" onPress={() => go(secondaryAction)}>{secondaryAction.label}</Button> : null}
            {primaryAction ? <Button onPress={() => go(primaryAction)}>{primaryAction.label}</Button> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  panel: { gap: 4, paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  actions: { flexDirection: "row", gap: 8, paddingTop: 8 },
});

export default SiteHeader;
