import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  description?: string;
  /** How many chosen labels show in the trigger before it summarises as "+N". */
  maxVisible?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the multi select: label, trigger, chip, content, item or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    trigger?: StyleProp<ViewStyle>;
    chip?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

export function MultiSelect({ label, options, value, defaultValue = [], onValueChange, placeholder = "Select options", description, maxVisible = 2, disabled = false, style, styles: parts }: MultiSelectProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const chosen = value ?? internal;
  const labels = chosen.map((entry) => options.find((option) => option.value === entry)?.label).filter(Boolean) as string[];

  function toggle(entry: string) {
    const next = chosen.includes(entry) ? chosen.filter((item) => item !== entry) : [...chosen, entry];
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[local.trigger, { minHeight: metrics.controlHeight.md, borderColor: tokens.border, backgroundColor: tokens.surface, opacity: disabled ? 0.5 : 1 }, parts?.trigger]}
      >
        <View style={local.chips}>
          {labels.length === 0 ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{placeholder}</Text> : null}
          {labels.slice(0, maxVisible).map((entry) => (
            <View key={entry} style={[local.chip, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }, parts?.chip]}>
              <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }}>{entry}</Text>
            </View>
          ))}
          {labels.length > maxVisible ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>+{labels.length - maxVisible}</Text> : null}
        </View>
        <Text style={{ color: tokens.textMuted, fontSize: 16 }}>⌄</Text>
      </Pressable>
      {description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close list" onPress={() => setOpen(false)} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            <ScrollView>
              {options.map((option) => {
                const on = chosen.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: option.disabled }}
                    disabled={option.disabled}
                    onPress={() => toggle(option.value)}
                    style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: option.disabled ? 0.45 : 1 }, parts?.item]}
                  >
                    <View style={[local.box, { borderColor: on ? tokens.controlOn : tokens.borderStrong, backgroundColor: on ? tokens.controlOn : tokens.surface }]}>
                      {on ? <Text style={{ color: tokens.controlThumbOn, fontSize: 11, fontWeight: "700" }}>✓</Text> : null}
                    </View>
                    <Text style={{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={[local.done, { borderTopColor: tokens.border }]}>
              <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: metrics.space[3], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  overlay: { flex: 1, justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { maxHeight: 420, borderWidth: 1, borderRadius: 26, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4] },
  box: { width: 18, height: 18, borderWidth: 1, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  done: { alignItems: "center", justifyContent: "center", minHeight: metrics.controlHeight.md, borderTopWidth: 1 },
});

export default MultiSelect;
