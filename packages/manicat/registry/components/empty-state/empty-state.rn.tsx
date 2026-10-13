import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface EmptyStateProps extends Omit<ViewProps, "children"> {
  title: string;
  description: string;
  /** A button or link that fixes the emptiness. */
  action?: ReactNode;
  icon?: ReactNode;
  /** Extend the inner, named parts of the empty state: icon, title, description or action. The React Native counterpart of `classNames`. */
  styles?: {
    icon?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    action?: StyleProp<ViewStyle>;
  };
}

export function EmptyState({ title, description, action, icon, style, styles: parts, ...props }: EmptyStateProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="summary" style={[local.root, style]}>
      {icon ? <View style={[local.icon, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.icon]}>{icon}</View> : null}
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text>
      {action ? <View style={[local.action, parts?.action]}>{action}</View> : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignItems: "center", gap: metrics.space[2], padding: metrics.space[5], alignSelf: "stretch" },
  icon: { minWidth: 48, height: 48, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 16, marginBottom: metrics.space[2] },
  title: { fontSize: metrics.text.lg, fontWeight: "500", textAlign: "center" },
  description: { maxWidth: 320, fontSize: metrics.text.sm, lineHeight: 20, textAlign: "center" },
  action: { marginTop: metrics.space[3] },
});

export default EmptyState;
