import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ProgressProps extends Omit<ViewProps, "children"> {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  /** Extend the inner, named parts of the progress: meta, label, value, track or fill. The React Native counterpart of `classNames`. */
  styles?: {
    meta?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
    track?: StyleProp<ViewStyle>;
    fill?: StyleProp<ViewStyle>;
  };
}

export function Progress({ value = 0, max = 100, label, showValue = false, style, styles: parts, ...props }: ProgressProps) {
  const tokens = useTokens();
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const complete = percent >= 100;
  const [width] = useState(() => new Animated.Value(percent));

  useEffect(() => {
    Animated.timing(width, { toValue: percent, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percent, width]);

  return (
    <View
      {...props}
      accessibilityRole="progressbar"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={[local.root, style]}
    >
      {label || showValue ? (
        <View style={[local.meta, parts?.meta]}>
          {label ? <Text style={[local.text, { color: tokens.textSecondary }, parts?.label]}>{label}</Text> : <View />}
          {showValue ? <Text style={[local.text, local.value, { color: complete ? tokens.success : tokens.textMuted }, parts?.value]}>{Math.round(percent)}%</Text> : null}
        </View>
      ) : null}
      <View style={[local.track, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.track]}>
        <Animated.View
          style={[
            local.fill,
            { backgroundColor: complete ? tokens.success : tokens.accent, width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
            parts?.fill,
          ]}
        />
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignSelf: "stretch" },
  meta: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  text: { fontSize: metrics.text.sm },
  value: { fontVariant: ["tabular-nums"] },
  track: { height: 7, overflow: "hidden", borderWidth: 1, borderRadius: 99 },
  fill: { height: "100%", borderRadius: 99 },
});

export default Progress;
