import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label: string;
  description?: string;
  error?: string;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the input: label, input, description or error. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    input?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    error?: StyleProp<TextStyle>;
  };
}

export function Input({ label, description, error, editable = true, style, styles: parts, onFocus, onBlur, ...props }: InputProps) {
  const tokens = useTokens();
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;
  // Focus answers with the border alone, and the field never changes size.
  const border = error ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong;

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        accessibilityHint={error ?? description}
        placeholderTextColor={tokens.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          local.input,
          {
            minHeight: metrics.controlHeight.md,
            borderColor: border,
            backgroundColor: disabled ? tokens.surfaceMuted : tokens.surface,
            color: tokens.foreground,
            opacity: disabled ? 0.5 : 1,
          },
          parts?.input,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[local.message, { color: tokens.danger }, parts?.error]}>
          {error}
        </Text>
      ) : description ? (
        <Text style={[local.message, { color: tokens.textMuted }, parts?.description]}>{description}</Text>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch" },
  label: { marginBottom: metrics.space[2], fontSize: metrics.text.sm, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: metrics.radiusControl, paddingHorizontal: metrics.space[3], fontSize: metrics.text.sm },
  message: { paddingTop: metrics.space[2], fontSize: metrics.text.xs },
});

export default Input;
