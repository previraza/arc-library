import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { useTokens } from "@/lib/rn-tokens";

export type HeroSectionVariant = "centered" | "split" | "minimal";
export interface HeroAction {
  label: string;
  href?: string;
  onPress?: () => void;
  /** Shown in place of the label for a moment after a press, such as "Trial started". */
  doneLabel?: string;
}
export interface HeroInstallCommand {
  /** Short label, such as npm or pnpm. The first command is shown. */
  label: string;
  command: string;
}

export interface HeroSectionProps extends ViewProps {
  /** `centered` and `minimal` align the copy to the middle; `split` stacks the copy over the media on phones. */
  variant?: HeroSectionVariant;
  title?: string;
  description?: string;
  announcement?: HeroAction | null;
  primaryAction?: HeroAction | null;
  secondaryAction?: HeroAction | null;
  install?: HeroInstallCommand[] | null;
  /** A visual under the copy. */
  media?: ReactNode;
  /** Small facts under the content, such as the version and license. */
  meta?: string[];
  /** Copies the install command. Pass your clipboard call, for example `Clipboard.setStringAsync`. */
  onCopy?: (value: string) => void;
  /** Extend the inner, named parts of the hero. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; actions?: StyleProp<ViewStyle>; install?: StyleProp<ViewStyle> };
}

function Action({ action, kind }: { action: HeroAction; kind: "primary" | "secondary" }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2400);
    return () => clearTimeout(timer);
  }, [done]);
  return (
    <Button
      variant={kind}
      size="lg"
      onPress={() => {
        action.onPress?.();
        if (action.href) void Linking.openURL(action.href);
        if (action.doneLabel) setDone(true);
      }}
    >
      {done && action.doneLabel ? `✓ ${action.doneLabel}` : action.label}
    </Button>
  );
}

export function HeroSection({ variant = "centered", title = "Interfaces that move with intent", description = "Components and blocks with springs, states and details already done, so you can ship the product instead of the polish.", announcement = { label: "What's new in 2.4" }, primaryAction = { label: "Get started", doneLabel: "Opened" }, secondaryAction = { label: "Browse components" }, install, media, meta, onCopy, style, styles: parts, ...props }: HeroSectionProps) {
  const tokens = useTokens();
  const [copied, setCopied] = useState(false);
  const command = install?.[0];
  const align = variant === "split" ? "flex-start" : "center";
  const textAlign = variant === "split" ? "left" : "center";

  return (
    <View {...props} style={[local.root, { alignItems: align }, style]}>
      {announcement ? (
        <Pressable accessibilityRole="button" onPress={() => { announcement.onPress?.(); if (announcement.href) void Linking.openURL(announcement.href); }} style={[local.pill, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }]}>
          <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{announcement.label} →</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground, textAlign }, variant === "minimal" && { fontSize: 44 }, parts?.title]}>{title}</Text>
      {description ? <Text style={[local.description, { color: tokens.textSecondary, textAlign }, parts?.description]}>{description}</Text> : null}
      {primaryAction || secondaryAction ? (
        <View style={[local.actions, { justifyContent: align }, parts?.actions]}>
          {primaryAction ? <Action action={primaryAction} kind="primary" /> : null}
          {secondaryAction ? <Action action={secondaryAction} kind="secondary" /> : null}
        </View>
      ) : null}
      {command ? (
        <View style={[local.install, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.install]}>
          <Text style={{ color: tokens.textMuted, fontFamily: "monospace" }}>$</Text>
          <Text selectable style={{ flex: 1, color: tokens.foreground, fontFamily: "monospace", fontSize: 13 }}>{command.command}</Text>
          <Button variant="ghost" size="sm" accessibilityLabel="Copy install command" onPress={() => { onCopy?.(command.command); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy"}</Button>
        </View>
      ) : null}
      {meta?.length ? <View style={local.meta}>{meta.map((entry) => <Text key={entry} style={{ color: tokens.textMuted, fontSize: 12 }}>{entry}</Text>)}</View> : null}
      {media}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 16, paddingVertical: 24 },
  pill: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  title: { fontSize: 36, fontWeight: "700", letterSpacing: -1.2, lineHeight: 42 },
  description: { fontSize: 16, lineHeight: 24 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  install: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 16, paddingLeft: 14 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});

export default HeroSection;
