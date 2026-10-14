import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export interface PasswordStrengthResult {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  met: string[];
}

export const defaultPasswordRules: PasswordRule[] = [
  { id: "length", label: "At least 12 characters", test: (password) => Array.from(password).length >= 12 },
  { id: "case", label: "Upper and lowercase letters", test: (password) => /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password) },
  { id: "number", label: "At least one number", test: (password) => /\p{N}/u.test(password) },
  { id: "symbol", label: "At least one symbol", test: (password) => /[^\p{L}\p{N}\s]/u.test(password) },
];

const LEVELS = ["", "Weak", "Fair", "Good", "Strong"] as const;

/** Four steps from the share of rules met; a password under eight characters never leaves the first. */
export function estimateStrength(password: string, rules: PasswordRule[] = defaultPasswordRules): PasswordStrengthResult {
  if (!password) return { level: 0, label: "", met: [] };
  const met = rules.filter((rule) => rule.test(password)).map((rule) => rule.id);
  if (Array.from(password).length < 8) return { level: 1, label: "Too short", met };
  const level = Math.max(1, Math.min(4, Math.ceil((met.length / rules.length) * 4))) as 1 | 2 | 3 | 4;
  return { level, label: LEVELS[level], met };
}

export interface PasswordStrengthProps extends Omit<TextInputProps, "style" | "value" | "defaultValue" | "secureTextEntry" | "onChangeText"> {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, strength: PasswordStrengthResult) => void;
  rules?: PasswordRule[];
  error?: string;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the field: label, shell, input, toggle, meter, segment, rule or error. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    toggle?: StyleProp<ViewStyle>;
    meter?: StyleProp<ViewStyle>;
    segment?: StyleProp<ViewStyle>;
    rule?: StyleProp<TextStyle>;
    error?: StyleProp<TextStyle>;
  };
}

export function PasswordStrength({ label, value, defaultValue = "", onValueChange, rules = defaultPasswordRules, error, style, styles: parts, ...props }: PasswordStrengthProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const password = value ?? internal;
  const strength = estimateStrength(password, rules);
  const color = [tokens.border, tokens.danger, tokens.warning, tokens.accent, tokens.success][strength.level];

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: error ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        <TextInput
          {...props}
          value={password}
          secureTextEntry={!shown}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onChangeText={(next) => {
            if (value === undefined) setInternal(next);
            onValueChange?.(next, estimateStrength(next, rules));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={shown ? "Hide password" : "Show password"} hitSlop={8} onPress={() => setShown((current) => !current)} style={parts?.toggle}>
          <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, fontWeight: "500" }}>{shown ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Password strength" accessibilityValue={{ min: 0, max: 4, now: strength.level, text: strength.label }} style={[local.meter, parts?.meter]}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={[local.segment, { backgroundColor: step <= strength.level ? color : tokens.surfaceMuted }, parts?.segment]} />
        ))}
      </View>
      <Text style={{ color, fontSize: metrics.text.xs, fontWeight: "500", minHeight: 16 }}>{strength.label}</Text>
      <View style={{ gap: 2 }}>
        {rules.map((rule) => (
          <Text key={rule.id} style={[{ fontSize: metrics.text.xs, color: strength.met.includes(rule.id) ? tokens.success : tokens.textMuted }, parts?.rule]}>
            {strength.met.includes(rule.id) ? "✓" : "○"} {rule.label}
          </Text>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" style={[{ color: tokens.danger, fontSize: metrics.text.xs }, parts?.error]}>{error}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  input: { flex: 1, fontSize: metrics.text.sm, paddingVertical: 0 },
  meter: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
});

export default PasswordStrength;
