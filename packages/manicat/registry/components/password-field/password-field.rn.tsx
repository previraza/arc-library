import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface PasswordFieldProps extends Omit<TextInputProps, "style" | "secureTextEntry"> {
  label: string;
  description?: string;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the password field: label, shell, input, toggle or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    toggle?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

export function PasswordField({ label, description, style, styles: parts, onFocus, onBlur, ...props }: PasswordFieldProps) {
  const tokens = useTokens();
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        <TextInput
          {...props}
          secureTextEntry={!shown}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={tokens.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shown ? "Hide password" : "Show password"}
          hitSlop={8}
          onPress={() => setShown((value) => !value)}
          style={[local.toggle, parts?.toggle]}
        >
          <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, fontWeight: "500" }}>{shown ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
      {description ? <Text style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{description}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  input: { flex: 1, fontSize: metrics.text.sm, paddingVertical: 0 },
  toggle: { paddingHorizontal: 4, paddingVertical: 4 },
  hint: { fontSize: metrics.text.xs },
});

export default PasswordField;
