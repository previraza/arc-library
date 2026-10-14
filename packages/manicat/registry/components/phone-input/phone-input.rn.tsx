// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { BY_ISO, PHONE_COUNTRIES, capDigits, flagOf, formatNational, onlyDigits, parsePhoneNumber, statusOf, toE164 } from "@/lib/phone";
import type { PhoneCountry, PhoneStatus } from "@/lib/phone";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { Check } from "lucide-react-native";

export type { PhoneCountry, PhoneStatus };
export { PHONE_COUNTRIES, flagOf, formatPhoneNumber, parsePhoneNumber } from "@/lib/phone";

export interface PhoneInputDetails {
  country: PhoneCountry;
  formatted: string;
  status: PhoneStatus;
  valid: boolean;
}

export interface PhoneInputProps {
  label: string;
  /** The number in E.164, such as "+14155550132". */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, details: PhoneInputDetails) => void;
  defaultCountry?: string;
  onCountryChange?: (iso: string) => void;
  countries?: string[];
  preferredCountries?: string[];
  description?: string;
  error?: string;
  /** Show a message after blur when the number has the wrong length. */
  validate?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the phone input: label, shell, flag, input, list, option or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    flag?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    list?: StyleProp<ViewStyle>;
    option?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

/** Country picker plus a number that formats as you type and reports E.164. Typing "+44…" or pasting an international number switches the country. */
export function PhoneInput({ label, value, defaultValue = "", onValueChange, defaultCountry = "US", onCountryChange, countries, preferredCountries = ["US", "CA", "GB"], description, error, validate = true, disabled = false, style, styles: parts }: PhoneInputProps) {
  const tokens = useTokens();
  const pool = countries ? PHONE_COUNTRIES.filter((entry) => countries.includes(entry.iso)) : PHONE_COUNTRIES;
  const start = parsePhoneNumber(value ?? defaultValue, pool);
  const [iso, setIso] = useState(start?.country.iso ?? defaultCountry);
  const [digits, setDigits] = useState(start?.national ?? "");
  const [synced, setSynced] = useState(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // A controlled value that changed from outside replaces what was typed.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const parsed = parsePhoneNumber(value, pool);
    if (parsed && toE164(parsed.country, parsed.national) !== toE164(BY_ISO.get(iso) ?? pool[0], digits)) {
      setIso(parsed.country.iso);
      setDigits(parsed.national);
    }
  }

  const country = BY_ISO.get(iso) ?? pool[0];
  const status = statusOf(country, digits);
  const formatted = formatNational(country, digits);

  function emit(entry: PhoneCountry, next: string) {
    const nextStatus = statusOf(entry, next);
    onValueChange?.(toE164(entry, next), { country: entry, formatted: formatNational(entry, next), status: nextStatus, valid: nextStatus === "valid" });
  }

  function onText(text: string) {
    if (text.trim().startsWith("+")) {
      const parsed = parsePhoneNumber(text, pool);
      if (parsed) {
        if (parsed.country.iso !== iso) onCountryChange?.(parsed.country.iso);
        setIso(parsed.country.iso);
        setDigits(parsed.national);
        return emit(parsed.country, parsed.national);
      }
      if (text.trim() === "+") return setOpen(true);
    }
    const next = capDigits(country, onlyDigits(text));
    setDigits(next);
    emit(country, next);
  }

  const needle = query.trim().toLowerCase().replace(/^\+/, "");
  const matches = pool.filter((entry) => !needle || entry.name.toLowerCase().includes(needle) || entry.dial.startsWith(needle) || entry.iso.toLowerCase() === needle);
  const suggested = needle ? [] : pool.filter((entry) => preferredCountries.includes(entry.iso));
  const message = error ?? (validate && touched && status !== "empty" && status !== "valid" ? (status === "too-long" ? "This number is too long." : "This number looks incomplete.") : undefined);

  const option = (entry: PhoneCountry) => (
    <Pressable
      key={entry.iso}
      accessibilityRole="button"
      accessibilityState={{ selected: entry.iso === iso }}
      onPress={() => {
        setIso(entry.iso);
        setDigits(capDigits(entry, digits));
        onCountryChange?.(entry.iso);
        setOpen(false);
        setQuery("");
      }}
      style={({ pressed }) => [local.option, { backgroundColor: pressed || entry.iso === iso ? tokens.surfaceMuted : "transparent" }, parts?.option]}
    >
      <Text style={{ fontSize: 18 }}>{flagOf(entry.iso)}</Text>
      <Text style={{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }}>{entry.name}</Text>
      <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, fontVariant: ["tabular-nums"] }}>+{entry.dial}</Text>
    </Pressable>
  );

  return (
    <View style={[local.field, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: message ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Country, ${country.name} +${country.dial}`} disabled={disabled} onPress={() => setOpen(true)} style={[local.flag, { borderRightColor: tokens.border }, parts?.flag]}>
          <Text style={{ fontSize: 18 }}>{flagOf(country.iso)}</Text>
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>+{country.dial}</Text>
        </Pressable>
        <TextInput
          value={formatted}
          onChangeText={onText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setTouched(true);
          }}
          editable={!disabled}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder={country.example}
          placeholderTextColor={tokens.textMuted}
          accessibilityLabel={label}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
        {status === "valid" ? <Check size={16} strokeWidth={1.75} color={tokens.success} /> : null}
      </View>
      {message ? <Text accessibilityRole="alert" style={[{ color: tokens.danger, fontSize: metrics.text.xs }, parts?.hint]}>{message}</Text> : description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close country list" onPress={() => setOpen(false)} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.list, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.list]}>
            <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search country or +code" placeholderTextColor={tokens.textMuted} accessibilityLabel="Search country" style={[local.search, { color: tokens.foreground, borderBottomColor: tokens.border }]} />
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggested.length ? <Text style={[local.group, { color: tokens.textMuted }]}>Suggested</Text> : null}
              {suggested.map(option)}
              <Text style={[local.group, { color: tokens.textMuted }]}>{needle ? "Results" : "All countries"}</Text>
              {matches.map(option)}
              {matches.length === 0 ? <Text style={{ padding: metrics.space[4], color: tokens.textMuted, fontSize: metrics.text.sm }}>No country matches.</Text> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: metrics.radiusControl, overflow: "hidden" },
  flag: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "stretch", paddingHorizontal: metrics.space[3], borderRightWidth: 1 },
  input: { flex: 1, paddingHorizontal: metrics.space[3], paddingVertical: 0, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10, 10, 10, 0.4)" },
  list: { maxHeight: "75%", borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  search: { minHeight: metrics.controlHeight.lg, paddingHorizontal: metrics.space[4], fontSize: metrics.text.sm, borderBottomWidth: 1 },
  group: { paddingHorizontal: metrics.space[4], paddingTop: metrics.space[3], paddingBottom: 4, fontSize: metrics.text.xs, fontWeight: "500" },
  option: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4] },
});

export default PhoneInput;
