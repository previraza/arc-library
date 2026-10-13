import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface Segment {
  value: string;
  label: string;
  /** Optional content after the label, such as a badge. */
  accessory?: ReactNode;
}

export interface SegmentedControlProps extends Omit<ViewProps, "children"> {
  options: Segment[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  /** Extend the inner, named parts of the segmented control: track, button, selection or text. The React Native counterpart of `classNames`. */
  styles?: {
    track?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    selection?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
  };
}

export function SegmentedControl({ options, value, onValueChange, label, style, styles: parts, ...props }: SegmentedControlProps) {
  const tokens = useTokens();

  return (
    <View
      {...props}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[local.track, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, style, parts?.track]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onValueChange(option.value)}
            style={[
              local.button,
              selected && { borderColor: tokens.border, backgroundColor: tokens.surface },
              parts?.button,
              selected && parts?.selection,
            ]}
          >
            <Text style={[{ color: selected ? tokens.accentStrong : tokens.textSecondary, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.text]}>{option.label}</Text>
            {option.accessory}
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  track: { flexDirection: "row", alignSelf: "flex-start", gap: metrics.space[1], padding: metrics.space[1], borderWidth: 1, borderRadius: metrics.radiusControl },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: metrics.controlHeight.sm, paddingHorizontal: metrics.space[3], borderWidth: 1, borderColor: "transparent", borderRadius: metrics.radiusControl - 3 },
});

export default SegmentedControl;
