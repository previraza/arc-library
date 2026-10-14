// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { Check, Minus } from "lucide-react-native";

export type CheckedState = boolean | "indeterminate";

export interface CheckboxProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  /** Style of the outer pressable. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the checkbox: box, mark, label or description. The React Native counterpart of `classNames`. */
  styles?: {
    box?: StyleProp<ViewStyle>;
    mark?: StyleProp<TextStyle>;
    label?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
  };
}

export function Checkbox({ checked, defaultChecked = false, onCheckedChange, label, description, disabled, style, styles: parts, ...props }: CheckboxProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<CheckedState>(defaultChecked);
  const state = checked ?? internal;
  const on = state !== false;

  return (
    <Pressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ checked: state === "indeterminate" ? "mixed" : state, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        // An indeterminate box resolves to checked, like the web version.
        const next = state !== true;
        if (checked === undefined) setInternal(next);
        onCheckedChange?.(next);
      }}
      style={[local.root, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      {({ pressed }) => (
        <>
          <View style={local.hit}>
            <View
              style={[
                local.box,
                {
                  borderColor: on ? tokens.controlOn : tokens.borderStrong,
                  backgroundColor: on ? tokens.controlOn : tokens.surface,
                  transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
                },
                parts?.box,
              ]}
            >
              {on ? <View style={parts?.mark}>{state === "indeterminate" ? <Minus size={14} strokeWidth={2} color={tokens.controlGlyph} /> : <Check size={14} strokeWidth={2} color={tokens.controlGlyph} />}</View> : null}
            </View>
          </View>
          {label || description ? (
            <View style={local.copy}>
              {label ? <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text> : null}
              {description ? <Text style={[local.description, { color: tokens.textMuted }, parts?.description]}>{description}</Text> : null}
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "flex-start", alignSelf: "flex-start" },
  // The square sits in a 44px hit area, so the target is comfortable while the glyph stays small.
  hit: { width: metrics.controlHeight.md, height: metrics.controlHeight.md, alignItems: "center", justifyContent: "center" },
  box: { width: 18, height: 18, borderWidth: 1, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  mark: { fontSize: 12, fontWeight: "700", lineHeight: 14 },
  copy: { flexShrink: 1, gap: 2, paddingTop: (metrics.controlHeight.md - metrics.text.sm * 1.4) / 2 },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  description: { fontSize: metrics.text.xs },
});

export default Checkbox;
