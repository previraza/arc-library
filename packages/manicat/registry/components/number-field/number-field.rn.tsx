import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type NumberFieldAffix = string | ((value: number) => string);

export interface NumberFieldProps {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  disabled?: boolean;
  prefix?: NumberFieldAffix;
  suffix?: NumberFieldAffix;
  locale?: string;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the number field: label, shell, input, button or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    button?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

const affix = (value: NumberFieldAffix | undefined, n: number) => (typeof value === "function" ? value(n) : (value ?? ""));

export function NumberField({ label, value, defaultValue = 0, onValueChange, min = -Infinity, max = Infinity, step = 1, description, disabled = false, prefix, suffix, locale = "en-US", style, styles: parts }: NumberFieldProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const current = value ?? internal;
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  function set(next: number) {
    const clamped = clamp(Number.isFinite(next) ? next : current);
    if (value === undefined) setInternal(clamped);
    onValueChange?.(clamped);
  }

  const button = (text: string, delta: number, off: boolean, name: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={name} disabled={disabled || off} onPress={() => set(current + delta)} style={({ pressed }) => [local.button, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: off ? 0.4 : 1 }, parts?.button]}>
      <Text style={{ color: tokens.textSecondary, fontSize: 18 }}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={[local.field, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        {button("−", -step, current <= min, `Decrease ${label}`)}
        <View style={local.center}>
          {affix(prefix, current) ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{affix(prefix, current)}</Text> : null}
          <TextInput
            value={draft ?? current.toLocaleString(locale)}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (draft !== null) set(Number(draft.replace(/[^0-9.\-]/g, "")));
              setDraft(null);
            }}
            editable={!disabled}
            keyboardType="decimal-pad"
            accessibilityLabel={label}
            accessibilityValue={{ min: Number.isFinite(min) ? min : undefined, max: Number.isFinite(max) ? max : undefined, now: current }}
            style={[local.input, { color: tokens.foreground }, parts?.input]}
          />
          {affix(suffix, current) ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{affix(suffix, current)}</Text> : null}
        </View>
        {button("+", step, current >= max, `Increase ${label}`)}
      </View>
      {description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: metrics.radiusControl, overflow: "hidden" },
  button: { width: metrics.controlHeight.md, height: metrics.controlHeight.md, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
  input: { minWidth: 40, paddingVertical: 0, textAlign: "center", fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] },
});

export default NumberField;
