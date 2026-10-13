import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface RadioCardOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface RadioCardsProps extends Omit<ViewProps, "children"> {
  options: RadioCardOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Extend the inner, named parts of the radio cards: card, selected, title, description or meta. The React Native counterpart of `classNames`. */
  styles?: {
    card?: StyleProp<ViewStyle>;
    selected?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    meta?: StyleProp<TextStyle>;
  };
}

export function RadioCards({ options, value, defaultValue = null, onValueChange, style, styles: parts, ...props }: RadioCardsProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const current = value === undefined ? internal : value;

  return (
    <View {...props} accessibilityRole="radiogroup" style={[local.group, style]}>
      {options.map((option) => {
        const selected = option.value === current;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: option.disabled }}
            disabled={option.disabled}
            onPress={() => {
              if (value === undefined) setInternal(option.value);
              onValueChange?.(option.value);
            }}
            style={[
              local.card,
              { borderColor: selected ? tokens.foreground : tokens.border, backgroundColor: selected ? tokens.surfaceMuted : tokens.surface, opacity: option.disabled ? 0.5 : 1 },
              parts?.card,
              selected && parts?.selected,
            ]}
          >
            {option.icon}
            <View style={local.copy}>
              <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.title]}>{option.label}</Text>
              {option.description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.description]}>{option.description}</Text> : null}
            </View>
            {option.meta ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.meta]}>{option.meta}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  group: { alignSelf: "stretch", gap: metrics.space[2] },
  card: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], padding: metrics.space[4], borderWidth: 1, borderRadius: metrics.radiusControl },
  copy: { flex: 1, gap: 2 },
});

export default RadioCards;
