import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface MetricCardProps extends Omit<ViewProps, "children"> {
  label: string;
  value: number;
  suffix?: string;
  /** One line of context under the number, such as the previous period. */
  context: string;
  /** Change since the previous period, such as "+15.2%". A leading minus reads as a decrease. */
  change?: string;
  /** Extend the inner, named parts of the metric card: label, value, change or context. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
    change?: StyleProp<ViewStyle>;
    changeText?: StyleProp<TextStyle>;
    context?: StyleProp<TextStyle>;
  };
}

export function MetricCard({ label, value, suffix, context, change, style, styles: parts, ...props }: MetricCardProps) {
  const tokens = useTokens();
  const down = change?.trim().startsWith("-") || change?.trim().startsWith("−");
  const tone = down ? tokens.danger : tokens.success;

  return (
    <View
      {...props}
      accessible
      accessibilityLabel={`${label}: ${value.toLocaleString()}${suffix ?? ""}${change ? `, ${change}` : ""}. ${context}`}
      style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface }, style]}
    >
      <Text style={[local.label, { color: tokens.textSecondary }, parts?.label]}>{label}</Text>
      <View style={local.row}>
        <Text style={[local.value, { color: tokens.foreground }, parts?.value]}>
          {value.toLocaleString()}
          {suffix ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{suffix}</Text> : null}
        </Text>
        {change ? (
          <View style={[local.change, { backgroundColor: `${tone}1A` }, parts?.change]}>
            <Text style={[{ color: tone, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.changeText]}>{change}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[local.context, { color: tokens.textMuted }, parts?.context]}>{context}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  card: { gap: metrics.space[2], padding: metrics.space[5], borderWidth: 1, borderRadius: 26, alignSelf: "flex-start", minWidth: 200 },
  label: { fontSize: metrics.text.sm },
  row: { flexDirection: "row", alignItems: "baseline", gap: metrics.space[3] },
  value: { fontSize: 30, fontWeight: "600", fontVariant: ["tabular-nums"] },
  change: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  context: { fontSize: metrics.text.xs },
});

export default MetricCard;
