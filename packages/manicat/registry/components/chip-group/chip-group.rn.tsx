import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import { useState } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ChipOption {
  value: string;
  label: string;
}

export interface ChipGroupProps {
  options: ChipOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  label: string;
  multiple?: boolean;
  /** How many chips show before the rest collapse into a "+N more" chip. */
  maxVisible?: number;
  /** Style of the group wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the chip group: chip, selected, chipText or more. The React Native counterpart of `classNames`. */
  styles?: {
    chip?: StyleProp<ViewStyle>;
    selected?: StyleProp<ViewStyle>;
    chipText?: StyleProp<TextStyle>;
    more?: StyleProp<ViewStyle>;
  };
}

export function ChipGroup({ options, value, onValueChange, label, multiple = true, maxVisible = Infinity, style, styles: parts }: ChipGroupProps) {
  const tokens = useTokens();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? options : options.slice(0, maxVisible);
  const hidden = options.length - shown.length;

  function toggle(next: string) {
    if (!multiple) return onValueChange(value.includes(next) ? [] : [next]);
    onValueChange(value.includes(next) ? value.filter((entry) => entry !== next) : [...value, next]);
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[local.group, style]}>
      {shown.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked: selected }}
            onPress={() => toggle(option.value)}
            style={[
              local.chip,
              { borderColor: selected ? tokens.foreground : tokens.border, backgroundColor: selected ? tokens.foreground : tokens.surface },
              parts?.chip,
              selected && parts?.selected,
            ]}
          >
            <Text style={[{ color: selected ? tokens.background : tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.chipText]}>{option.label}</Text>
          </Pressable>
        );
      })}
      {hidden > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} style={[local.chip, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.more]}>
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm, fontWeight: "500" }}>+{hidden} more</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  group: { flexDirection: "row", flexWrap: "wrap", gap: metrics.space[2], alignSelf: "stretch" },
  chip: { minHeight: metrics.controlHeight.sm, paddingHorizontal: metrics.space[3], alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 999 },
});

export default ChipGroup;
