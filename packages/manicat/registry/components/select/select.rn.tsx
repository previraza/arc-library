import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  description?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the select: label, trigger, valueText, chevron, content, item, itemText or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    trigger?: StyleProp<ViewStyle>;
    valueText?: StyleProp<TextStyle>;
    chevron?: StyleProp<TextStyle>;
    content?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    itemText?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

/** On a phone the list opens as a sheet over the screen rather than a popover anchored under the field. */
export function Select({ label, options, description, placeholder = "Select…", value, defaultValue, onValueChange, disabled, style, styles: parts }: SelectProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value ?? internal;
  const selected = options.find((option) => option.value === current);

  function choose(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          local.trigger,
          {
            minHeight: metrics.controlHeight.md,
            borderColor: open || pressed ? tokens.borderStrong : tokens.border,
            backgroundColor: open || pressed ? tokens.surfaceMuted : tokens.surface,
            opacity: disabled ? 0.5 : 1,
          },
          parts?.trigger,
        ]}
      >
        <Text numberOfLines={1} style={[local.value, { color: selected ? tokens.foreground : tokens.textMuted }, parts?.valueText]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={[{ color: tokens.textMuted, fontSize: 16, transform: [{ rotate: open ? "180deg" : "0deg" }] }, parts?.chevron]}>⌄</Text>
      </Pressable>
      {description ? <Text style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{description}</Text> : null}

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close list" onPress={() => setOpen(false)} style={local.overlay}>
          <View
            accessibilityRole="menu"
            style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}
          >
            <ScrollView>
              {options.map((option) => {
                const active = option.value === current;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active, disabled: option.disabled }}
                    disabled={option.disabled}
                    onPress={() => choose(option.value)}
                    style={({ pressed }) => [
                      local.item,
                      { backgroundColor: pressed || active ? tokens.surfaceMuted : "transparent", opacity: option.disabled ? 0.45 : 1 },
                      parts?.item,
                    ]}
                  >
                    <Text style={[{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }, parts?.itemText]}>{option.label}</Text>
                    {active ? <Text style={{ color: tokens.foreground }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: metrics.space[3], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  value: { flex: 1, fontSize: metrics.text.sm },
  hint: { fontSize: metrics.text.xs },
  overlay: { flex: 1, justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { maxHeight: 360, borderWidth: 1, borderRadius: 26, padding: 6, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
});

export default Select;
