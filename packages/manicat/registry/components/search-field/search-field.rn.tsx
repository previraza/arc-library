// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";

export interface SearchFieldProps extends Omit<TextInputProps, "style" | "value" | "onChangeText"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the search field: label, shell, input or clear. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    clear?: StyleProp<ViewStyle>;
  };
}

export function SearchField({ label, value, onValueChange, style, styles: parts, onFocus, onBlur, ...props }: SearchFieldProps) {
  const tokens = useTokens();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View
        style={[
          local.shell,
          { minHeight: metrics.controlHeight.md, borderColor: focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface },
          parts?.shell,
        ]}
      >
        <Text style={{ color: tokens.textMuted, fontSize: 16 }}>⌕</Text>
        <TextInput
          {...props}
          value={value}
          onChangeText={onValueChange}
          accessibilityLabel={props.accessibilityLabel ?? label}
          returnKeyType="search"
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
        {/* The clear button keeps its slot, so the field never changes width when it appears. */}
        <View style={local.clearSlot}>
          {value ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => onValueChange("")} style={[local.clear, { backgroundColor: tokens.surfaceMuted }, parts?.clear]}>
              <X size={16} strokeWidth={1.75} color={tokens.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  input: { flex: 1, fontSize: metrics.text.sm, paddingVertical: 0 },
  clearSlot: { width: 20, alignItems: "center" },
  clear: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

export default SearchField;
