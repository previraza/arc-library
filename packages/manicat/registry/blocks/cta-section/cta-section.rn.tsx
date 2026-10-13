import { useState } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { useTokens } from "@/lib/rn-tokens";

export interface CtaAction {
  label: string;
  /** Opens this URL. */
  href?: string;
  onPress?: () => void;
  /** With no href or onPress, the button confirms in place with this label, which suits previews. */
  confirmedLabel?: string;
}
export type CtaVariant = "centered" | "split" | "banner";

const copy = {
  centered: { title: "Start building in minutes", description: "Set up a workspace, invite your team, and ship the first project this week. Free for 14 days.", primary: { label: "Start free trial", confirmedLabel: "Trial started" }, secondary: { label: "Talk to sales", confirmedLabel: "We'll email you" }, note: "No credit card required" },
  split: { title: "Your team, set up before lunch", description: "Import your projects, bring everyone in, and keep working the way you already do.", primary: { label: "Create a workspace", confirmedLabel: "Workspace created" }, secondary: { label: "Book a demo", confirmedLabel: "Demo requested" }, points: ["Import from any tracker in one step", "Single sign-on and audit logs included", "Cancel anytime from settings"] },
  banner: { title: "Workflows are here", description: "Automate handoffs between teams with no code.", primary: { label: "See how it works", confirmedLabel: "Opened" } },
};

export interface CtaSectionProps extends ViewProps {
  variant?: CtaVariant;
  title?: string;
  description?: string;
  primaryAction?: CtaAction;
  /** Not shown in the banner variant. Pass null to hide it. */
  secondaryAction?: CtaAction | null;
  note?: string;
  /** Image URIs for the faces beside the note in the centered variant. */
  faces?: string[];
  points?: string[];
  /** Replaces nothing in the split variant but is shown under its actions, such as a product screenshot. */
  visual?: ReactNode;
  /** Banner only: shows a dismiss button and calls this after it closes. */
  onDismiss?: () => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; actions?: StyleProp<ViewStyle>; note?: StyleProp<TextStyle> };
}

function Action({ action, variant, size = "lg" }: { action: CtaAction; variant: "primary" | "secondary"; size?: "sm" | "md" | "lg" }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      onPress={() => {
        if (action.href) void Linking.openURL(action.href);
        else if (action.onPress) action.onPress();
        else setConfirmed((value) => !value);
      }}
    >
      {confirmed ? `✓ ${action.confirmedLabel ?? action.label}` : action.label}
    </Button>
  );
}

export function CtaSection({ variant = "centered", title, description, primaryAction, secondaryAction, note, faces = [], points, visual, onDismiss, style, styles: parts, ...props }: CtaSectionProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(true);
  const text = copy[variant];
  const primary = primaryAction ?? text.primary;
  const secondary = secondaryAction === null ? null : secondaryAction ?? ("secondary" in text ? text.secondary : undefined);

  if (variant === "banner") {
    if (!open) return null;
    return (
      <View {...props} style={[local.banner, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, style]}>
        <Text style={[{ flex: 1, color: tokens.textSecondary, fontSize: 14 }, parts?.description]}>
          <Text style={{ color: tokens.foreground, fontWeight: "600" }}>{title ?? text.title} </Text>
          {description ?? text.description}
        </Text>
        <Action action={primary} variant="primary" size="sm" />
        {onDismiss !== undefined ? <Button variant="ghost" size="sm" accessibilityLabel="Dismiss" onPress={() => { setOpen(false); onDismiss(); }}>✕</Button> : null}
      </View>
    );
  }

  const list = points ?? ("points" in text ? text.points : []);
  return (
    <View {...props} style={[local.root, variant === "centered" && { alignItems: "center" }, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, variant === "centered" && { textAlign: "center" }, parts?.title]}>{title ?? text.title}</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, variant === "centered" && { textAlign: "center" }, parts?.description]}>{description ?? text.description}</Text>
      {variant === "split" && list.length > 0 ? (
        <View style={{ gap: 6 }}>{list.map((point) => <Text key={point} style={{ color: tokens.foreground, fontSize: 14 }}>✓ {point}</Text>)}</View>
      ) : null}
      <View style={[local.actions, parts?.actions]}>
        <Action action={primary} variant="primary" />
        {secondary ? <Action action={secondary} variant="secondary" /> : null}
      </View>
      {variant === "centered" ? (
        <View style={local.noteRow}>
          {faces.slice(0, 4).map((uri) => <Image key={uri} source={{ uri }} alt="" accessibilityIgnoresInvertColors style={local.face} />)}
          <Text style={[{ color: tokens.textMuted, fontSize: 13 }, parts?.note]}>{note ?? ("note" in text ? text.note : "")}</Text>
        </View>
      ) : visual}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 14 },
  title: { fontSize: 28, fontWeight: "600", letterSpacing: -0.6 },
  description: { fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  face: { width: 26, height: 26, borderRadius: 13 },
  banner: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 20, padding: 12 },
});

export default CtaSection;
