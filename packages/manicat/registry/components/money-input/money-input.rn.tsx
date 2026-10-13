import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface MoneyInputDetails {
  currency: string;
  major: number | null;
  formatted: string;
}

export interface MoneyInputProps {
  label: string;
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null, details: MoneyInputDetails) => void;
  currency?: string;
  defaultCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  currencies?: string[];
  min?: number;
  max?: number;
  locale?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the money input: label, shell, input, currency or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    currency?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

const symbolOf = (currency: string, locale: string) => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;

/** The value is the amount in major units (12.5 is twelve dollars fifty), or null when the field is empty. */
export function MoneyInput({ label, value, defaultValue = null, onValueChange, currency, defaultCurrency = "USD", onCurrencyChange, currencies = ["USD", "EUR", "GBP"], min, max, locale = "en-US", description, error, disabled = false, style, styles: parts }: MoneyInputProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [internalCurrency, setInternalCurrency] = useState(defaultCurrency);
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const amount = value === undefined ? internal : value;
  const code = currency ?? internalCurrency;
  const format = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(n);

  function emit(next: number | null, nextCurrency = code) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next, { currency: nextCurrency, major: next, formatted: next === null ? "" : format(next) });
  }

  return (
    <View style={[local.field, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: error ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{symbolOf(code, locale)}</Text>
        <TextInput
          value={draft ?? (amount === null ? "" : String(amount))}
          onChangeText={(text) => {
            setDraft(text);
            const parsed = text.trim() === "" ? null : Number(text.replace(/[^0-9.]/g, ""));
            if (parsed === null || Number.isFinite(parsed)) emit(parsed === null ? null : Math.min(max ?? Infinity, Math.max(min ?? 0, parsed)));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setDraft(null);
          }}
          editable={!disabled}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={tokens.textMuted}
          accessibilityLabel={label}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Currency, ${code}`}
          disabled={disabled || currencies.length < 2}
          onPress={() => {
            const next = currencies[(currencies.indexOf(code) + 1) % currencies.length];
            if (currency === undefined) setInternalCurrency(next);
            onCurrencyChange?.(next);
            emit(amount, next);
          }}
          style={[local.currency, { backgroundColor: tokens.surfaceMuted }, parts?.currency]}
        >
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs, fontWeight: "600" }}>{code}</Text>
        </Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={[{ color: tokens.danger, fontSize: metrics.text.xs }, parts?.hint]}>{error}</Text> : description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingLeft: metrics.space[3], paddingRight: 6, borderWidth: 1, borderRadius: metrics.radiusControl },
  input: { flex: 1, paddingVertical: 0, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] },
  currency: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
});

export default MoneyInput;
