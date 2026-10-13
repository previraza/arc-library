import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface AnimatedCounterProps extends Omit<ViewProps, "children"> {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  /** Extend the inner, named parts of the counter: label or value. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
  };
}

export function AnimatedCounter({ value, label, prefix = "", suffix = "", decimals = 0, locale = "en-US", style, styles: parts, ...props }: AnimatedCounterProps) {
  const tokens = useTokens();
  const [shown, setShown] = useState(0);
  const [tween] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const id = tween.addListener(({ value: next }) => setShown(next));
    Animated.timing(tween, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => tween.removeListener(id);
  }, [value, tween]);

  const text = `${prefix}${shown.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  return (
    <View {...props} accessible accessibilityLabel={`${label ? `${label}: ` : ""}${prefix}${value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`} style={[local.root, style]}>
      {label ? <Text style={[local.label, { color: tokens.textSecondary }, parts?.label]}>{label}</Text> : null}
      <Text style={[local.value, { color: tokens.foreground }, parts?.value]}>{text}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 4 },
  label: { fontSize: metrics.text.sm },
  value: { fontSize: 32, fontWeight: "600", fontVariant: ["tabular-nums"], letterSpacing: -1 },
});

export default AnimatedCounter;
