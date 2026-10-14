import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TextareaProps extends Omit<TextInputProps, "style" | "multiline"> {
  label: string;
  description?: string;
  error?: string;
  /** Visible lines before the text scrolls. */
  rows?: number;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the textarea: label, control, hint or error. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    control?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
    error?: StyleProp<TextStyle>;
  };
}

export function Textarea({ label, description, error, rows = 4, editable = true, style, styles: parts, onFocus, onBlur, ...props }: TextareaProps) {
  const tokens = useTokens();
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;
  const border = error ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong;

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <TextInput
        {...props}
        multiline
        textAlignVertical="top"
        numberOfLines={rows}
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
          local.control,
          {
            minHeight: rows * 22 + metrics.space[3] * 2,
            borderColor: border,
            backgroundColor: disabled ? tokens.surfaceMuted : tokens.surface,
            color: tokens.foreground,
            opacity: disabled ? 0.6 : 1,
          },
          parts?.control,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[local.message, { color: tokens.danger }, parts?.error]}>
          {error}
        </Text>
      ) : description ? (
        <Text style={[local.message, { color: tokens.textMuted }, parts?.hint]}>{description}</Text>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch" },
  label: { marginBottom: metrics.space[2], fontSize: metrics.text.sm, fontWeight: "500" },
  control: { borderWidth: 1, borderRadius: metrics.radiusControl, padding: metrics.space[3], fontSize: metrics.text.sm },
  message: { paddingTop: metrics.space[2], fontSize: metrics.text.xs },
});

export default Textarea;
