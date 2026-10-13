import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ColorSwatch {
  id: string;
  color: string;
}

const defaultSwatches: ColorSwatch[] = ["#7747ff", "#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#111111"].map((color) => ({ id: color, color }));

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  label?: string;
  swatches?: ColorSwatch[];
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the picker: label, preview, input, swatches or swatch. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    preview?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    swatches?: StyleProp<ViewStyle>;
    swatch?: StyleProp<ViewStyle>;
  };
}

const normalise = (text: string) => {
  const hex = text.trim().replace(/^#?/, "#").toLowerCase();
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : /^#[0-9a-f]{3}$/.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : null;
};

/** A hex field and a row of swatches. For a free-form picker, feed `onValueChange` from a native colour wheel. */
export function ColorPicker({ value, defaultValue = "#7747ff", onValueChange, label = "Colour", swatches = defaultSwatches, style, styles: parts }: ColorPickerProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const current = value ?? internal;

  function set(hex: string) {
    if (value === undefined) setInternal(hex);
    onValueChange?.(hex);
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={local.row}>
        <View accessibilityLabel={`Selected colour ${current}`} style={[local.preview, { backgroundColor: current, borderColor: tokens.border }, parts?.preview]} />
        <TextInput
          value={draft ?? current}
          onChangeText={(text) => {
            setDraft(text);
            const hex = normalise(text);
            if (hex) set(hex);
          }}
          onBlur={() => setDraft(null)}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`${label} hex value`}
          style={[local.input, { minHeight: metrics.controlHeight.md, color: tokens.foreground, borderColor: tokens.borderStrong, backgroundColor: tokens.surface }, parts?.input]}
        />
      </View>
      <View style={[local.swatches, parts?.swatches]}>
        {swatches.map((swatch) => (
          <Pressable
            key={swatch.id}
            accessibilityRole="button"
            accessibilityLabel={swatch.color}
            accessibilityState={{ selected: swatch.color.toLowerCase() === current.toLowerCase() }}
            onPress={() => set(swatch.color)}
            style={[local.swatch, { backgroundColor: swatch.color, borderColor: swatch.color.toLowerCase() === current.toLowerCase() ? tokens.foreground : tokens.border }, parts?.swatch]}
          />
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: metrics.space[3] },
  preview: { width: metrics.controlHeight.md, height: metrics.controlHeight.md, borderWidth: 1, borderRadius: metrics.radiusControl },
  input: { flex: 1, paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 28, height: 28, borderWidth: 2, borderRadius: 14 },
});

export default ColorPicker;
