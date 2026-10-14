import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface BillingToggleOption {
  value: string;
  label: string;
  badge?: string;
}

const DEFAULT_OPTIONS: BillingToggleOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly", badge: "Save 20%" },
];

export interface BillingToggleProps extends Omit<ViewProps, "children"> {
  value: string;
  onValueChange: (value: string) => void;
  options?: BillingToggleOption[];
  label?: string;
  /** Extend the inner, named parts of the toggle: track, button, selection, text or badge. The React Native counterpart of `classNames`. */
  styles?: {
    track?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    selection?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
    badge?: StyleProp<TextStyle>;
  };
}

export function BillingToggle({ value, onValueChange, options = DEFAULT_OPTIONS, label = "Billing period", style, styles: parts, ...props }: BillingToggleProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="radiogroup" accessibilityLabel={label} style={[local.track, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, style, parts?.track]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onValueChange(option.value)}
            style={[local.button, selected && { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.button, selected && parts?.selection]}
          >
            <Text style={[{ color: selected ? tokens.accentStrong : tokens.textSecondary, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.text]}>{option.label}</Text>
            {option.badge ? <Text style={[{ color: tokens.success, fontSize: 11, fontWeight: "600" }, parts?.badge]}>{option.badge}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export interface BillingPriceProps {
  amount: number;
  currency?: string;
  /** Period after the price, such as "per month". */
  period?: string;
  /** Previous price, shown struck through when it is higher than `amount`. */
  was?: number;
  decimals?: number;
  style?: StyleProp<ViewStyle>;
}

export function BillingPrice({ amount, currency = "$", period, was, decimals = 0, style }: BillingPriceProps) {
  const tokens = useTokens();
  const money = (n: number) => `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  return (
    <View accessible accessibilityLabel={`${money(amount)}${period ? ` ${period}` : ""}`} style={[local.price, style]}>
      {was !== undefined && was > amount ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm, textDecorationLine: "line-through" }}>{money(was)}</Text> : null}
      <Text style={{ color: tokens.foreground, fontSize: 32, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{money(amount)}</Text>
      {period ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>{period}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  track: { flexDirection: "row", alignSelf: "flex-start", gap: metrics.space[1], padding: metrics.space[1], borderWidth: 1, borderRadius: 999 },
  button: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: metrics.controlHeight.sm, paddingHorizontal: metrics.space[4], borderWidth: 1, borderColor: "transparent", borderRadius: 999 },
  price: { flexDirection: "row", alignItems: "baseline", gap: metrics.space[2] },
});

export default BillingToggle;
