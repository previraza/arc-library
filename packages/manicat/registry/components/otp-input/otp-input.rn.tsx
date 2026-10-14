import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  label: string;
  description?: string;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputMode?: "numeric" | "text";
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the OTP input: label, cell, cellText or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    cell?: StyleProp<ViewStyle>;
    cellText?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

/** One hidden input holds the code, so paste, autofill from SMS and the keyboard all work; the cells only draw it. */
export function OtpInput({ length = 6, value = "", onChange, label, description, error, autoFocus = false, disabled = false, inputMode = "numeric", style, styles: parts }: OtpInputProps) {
  const tokens = useTokens();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.slice(0, length).split("");

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={local.row} onTouchEnd={() => input.current?.focus()}>
        {Array.from({ length }, (_, index) => {
          const active = focused && index === Math.min(digits.length, length - 1);
          return (
            <View
              key={index}
              style={[
                local.cell,
                { borderColor: error ? tokens.danger : active ? tokens.foreground : tokens.borderStrong, backgroundColor: disabled ? tokens.surfaceMuted : tokens.surface },
                parts?.cell,
              ]}
            >
              <Text style={[{ color: tokens.foreground, fontSize: 20, fontWeight: "500", fontVariant: ["tabular-nums"] }, parts?.cellText]}>{digits[index] ?? ""}</Text>
            </View>
          );
        })}
        <TextInput
          ref={input}
          value={value}
          onChangeText={(text) => onChange?.((inputMode === "numeric" ? text.replace(/\D/g, "") : text).slice(0, length))}
          maxLength={length}
          autoFocus={autoFocus}
          editable={!disabled}
          keyboardType={inputMode === "numeric" ? "number-pad" : "default"}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={local.hidden}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[local.hint, { color: tokens.danger }, parts?.hint]}>{error}</Text>
      ) : description ? (
        <Text style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{description}</Text>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "flex-start", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  row: { flexDirection: "row", gap: 8 },
  cell: { width: 44, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: metrics.radiusControl },
  hidden: { position: "absolute", width: "100%", height: "100%", opacity: 0 },
  hint: { fontSize: metrics.text.xs },
});

export default OtpInput;
