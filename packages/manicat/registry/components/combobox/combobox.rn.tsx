import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Extra words that match this option when searching. */
  keywords?: string[];
}

export interface ComboboxProps extends Omit<TextInputProps, "style" | "value" | "defaultValue" | "onChange" | "onChangeText"> {
  label: string;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  description?: string;
  emptyMessage?: string;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the combobox: label, input, list, option, optionText, empty or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    input?: StyleProp<TextStyle>;
    list?: StyleProp<ViewStyle>;
    option?: StyleProp<ViewStyle>;
    optionText?: StyleProp<TextStyle>;
    empty?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

/** The list opens inline under the field, so the keyboard and the list never fight over the screen. */
export function Combobox({ label, options, value, defaultValue, onValueChange, description, emptyMessage = "No results", style, styles: parts, onFocus, onBlur, ...props }: ComboboxProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value ?? internal;
  const selected = options.find((option) => option.value === current);
  const [query, setQuery] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const text = query ?? selected?.label ?? "";
  const needle = (query ?? "").trim().toLowerCase();
  const results = needle
    ? options.filter((option) => [option.label, ...(option.keywords ?? [])].some((word) => word.toLowerCase().includes(needle)))
    : options;

  function choose(option: ComboboxOption) {
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value);
    setQuery(null);
    setFocused(false);
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <TextInput
        {...props}
        value={text}
        accessibilityRole="search"
        accessibilityLabel={label}
        accessibilityState={{ expanded: focused }}
        placeholderTextColor={tokens.textMuted}
        onChangeText={setQuery}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          // A short delay lets a press on an option land before the list closes.
          setTimeout(() => setFocused(false), 120);
          setQuery(null);
          onBlur?.(event);
        }}
        style={[
          local.input,
          { minHeight: metrics.controlHeight.md, borderColor: focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface, color: tokens.foreground },
          parts?.input,
        ]}
      />
      {focused ? (
        <View style={[local.list, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.list]}>
          {results.length === 0 ? (
            <Text style={[local.empty, { color: tokens.textMuted }, parts?.empty]}>{emptyMessage}</Text>
          ) : (
            results.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === current, disabled: option.disabled }}
                disabled={option.disabled}
                onPress={() => choose(option)}
                style={({ pressed }) => [local.option, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: option.disabled ? 0.45 : 1 }, parts?.option]}
              >
                <Text style={[{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }, parts?.optionText]}>{option.label}</Text>
                {option.value === current ? <Text style={{ color: tokens.foreground }}>✓</Text> : null}
              </Pressable>
            ))
          )}
        </View>
      ) : description ? (
        <Text style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{description}</Text>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: metrics.radiusControl, paddingHorizontal: metrics.space[3], fontSize: metrics.text.sm },
  hint: { fontSize: metrics.text.xs },
  list: { borderWidth: 1, borderRadius: 22, padding: 6 },
  option: { flexDirection: "row", alignItems: "center", minHeight: metrics.controlHeight.sm + 4, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
  empty: { padding: metrics.space[3], fontSize: metrics.text.sm },
});

export default Combobox;
