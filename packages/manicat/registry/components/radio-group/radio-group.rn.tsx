import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps extends Omit<ViewProps, "children"> {
  label: string;
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Extend the inner, named parts of the radio group: label, option, mark, dot, optionLabel or description. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    option?: StyleProp<ViewStyle>;
    mark?: StyleProp<ViewStyle>;
    dot?: StyleProp<ViewStyle>;
    optionLabel?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
  };
}

export function RadioGroup({ label, options, value, onValueChange, style, styles: parts, ...props }: RadioGroupProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="radiogroup" accessibilityLabel={label} style={[local.group, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onValueChange(option.value)}
            style={[local.option, parts?.option]}
          >
            <View style={[local.hit]}>
              <View style={[local.mark, { borderColor: selected ? tokens.controlOn : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.mark]}>
                {selected ? <View style={[local.dot, { backgroundColor: tokens.controlOn }, parts?.dot]} /> : null}
              </View>
            </View>
            <View style={local.copy}>
              <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.optionLabel]}>{option.label}</Text>
              {option.description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.description]}>{option.description}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  group: { alignSelf: "stretch" },
  label: { marginBottom: metrics.space[1], fontSize: metrics.text.sm, fontWeight: "500" },
  option: { flexDirection: "row", alignItems: "flex-start" },
  hit: { width: metrics.controlHeight.md, height: metrics.controlHeight.md, alignItems: "center", justifyContent: "center" },
  mark: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  copy: { flexShrink: 1, gap: 2, paddingTop: (metrics.controlHeight.md - metrics.text.sm * 1.4) / 2 },
});

export default RadioGroup;
