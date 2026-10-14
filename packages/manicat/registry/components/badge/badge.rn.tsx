import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends Omit<ViewProps, "children"> {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  children?: ReactNode;
  /** Extend the inner, named parts of the badge: root, icon or label. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    icon?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
  };
}

export function Badge({ tone = "neutral", size = "md", icon, children, style, styles: parts, ...props }: BadgeProps) {
  const tokens = useTokens();

  const color = {
    neutral: { text: tokens.textSecondary, background: tokens.surfaceMuted, border: tokens.border },
    success: { text: tokens.success, background: `${tokens.success}1A`, border: `${tokens.success}40` },
    info: { text: tokens.accentStrong, background: tokens.accentSubtle, border: `${tokens.accent}3D` },
    warning: { text: tokens.warning, background: `${tokens.warning}1C`, border: `${tokens.warning}45` },
    danger: { text: tokens.danger, background: `${tokens.danger}1A`, border: `${tokens.danger}42` },
  }[tone];

  const small = size === "sm";

  return (
    <View
      {...props}
      style={[
        local.root,
        {
          minHeight: small ? 22 : 26,
          paddingHorizontal: small ? 8 : 10,
          gap: small ? 4 : 5,
          borderColor: color.border,
          backgroundColor: color.background,
        },
        style,
        parts?.root,
      ]}
    >
      {icon ? <View style={[local.icon, parts?.icon]}>{icon}</View> : null}
      <Text style={[local.label, { color: color.text, fontSize: small ? 11 : metrics.text.xs }, parts?.label]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: metrics.radiusPill },
  icon: { alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "500", letterSpacing: -0.12 },
});

export default Badge;
