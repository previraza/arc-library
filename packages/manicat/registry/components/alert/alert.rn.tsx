// @manicat-dependencies lucide-react-native react-native-svg
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";
import { Check, CircleX, Info, TriangleAlert } from "lucide-react-native";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps extends Omit<ViewProps, "children"> {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  /** Controls visibility. Leave it out for an alert that is always shown. */
  open?: boolean;
  /** Shows a dismiss button when given. */
  onDismiss?: () => void;
  /** Extend the inner, named parts of the alert: icon, copy, title, description or dismiss. The React Native counterpart of `classNames`. */
  styles?: {
    icon?: StyleProp<ViewStyle>;
    copy?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    dismiss?: StyleProp<ViewStyle>;
  };
}

const glyph: Record<AlertTone, typeof Info> = { info: Info, success: Check, warning: TriangleAlert, danger: CircleX };

export function Alert({ tone = "info", title, children, open = true, onDismiss, style, styles: parts, ...props }: AlertProps) {
  const tokens = useTokens();
  if (!open) return null;

  const color = { info: tokens.accent, success: tokens.success, warning: tokens.warning, danger: tokens.danger }[tone];

  return (
    <View
      {...props}
      accessibilityRole="alert"
      style={[local.root, { borderColor: tokens.border, backgroundColor: tokens.surface }, style]}
    >
      <View style={[local.icon, { borderColor: color }, parts?.icon]}>
        {(() => { const Glyph = glyph[tone]; return <Glyph size={18} strokeWidth={1.75} color={color} />; })()}
      </View>
      <View style={[local.copy, parts?.copy]}>
        <Text style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
        {children ? (
          typeof children === "string" ? (
            <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{children}</Text>
          ) : (
            children
          )
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={onDismiss} style={[local.dismiss, parts?.dismiss]}>
          <X size={16} strokeWidth={1.75} color={tokens.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "flex-start", gap: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl, padding: metrics.space[4] },
  icon: { width: 18, height: 18, marginTop: 1, alignItems: "center", justifyContent: "center" },
  glyph: { fontSize: 11, fontWeight: "700", lineHeight: 13 },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: metrics.text.sm, fontWeight: "500" },
  description: { fontSize: metrics.text.xs },
  dismiss: { width: 28, height: 28, marginTop: -5, marginRight: -6, alignItems: "center", justifyContent: "center", borderRadius: metrics.radiusPill },
});

export default Alert;
