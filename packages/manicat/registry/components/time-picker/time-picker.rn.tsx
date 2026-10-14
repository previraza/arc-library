// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { Check, ChevronDown } from "lucide-react-native";

export interface TimePickerProps {
  label: string;
  /** Time as "HH:MM" in 24-hour form. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  description?: string;
  placeholder?: string;
  minuteStep?: 1 | 5 | 10 | 15 | 30;
  format?: "12h" | "24h";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the time picker: label, trigger, valueText, menu, option or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    trigger?: StyleProp<ViewStyle>;
    valueText?: StyleProp<TextStyle>;
    menu?: StyleProp<ViewStyle>;
    option?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

function display(time: string, format: "12h" | "24h") {
  const [h, m] = time.split(":").map(Number);
  if (format === "24h") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function TimePicker({ label, value, defaultValue = "09:00", onChange, description, placeholder = "Select a time", minuteStep = 15, format = "12h", disabled = false, style, styles: parts }: TimePickerProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value ?? internal;
  const times = Array.from({ length: (24 * 60) / minuteStep }, (_, index) => {
    const minutes = index * minuteStep;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  });

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
        <Text style={[{ color: current ? tokens.foreground : tokens.textMuted, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] }, parts?.valueText]}>{current ? display(current, format) : placeholder}</Text>
        <ChevronDown size={16} strokeWidth={1.75} color={tokens.textMuted} />
      </Pressable>
      {description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close list" onPress={() => setOpen(false)} style={local.overlay}>
          <View style={[local.menu, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.menu]}>
            <ScrollView contentOffset={{ x: 0, y: Math.max(0, times.indexOf(current ?? "") - 2) * 44 }}>
              {times.map((time) => {
                const active = time === current;
                return (
                  <Pressable
                    key={time}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      if (value === undefined) setInternal(time);
                      onChange?.(time);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [local.option, { backgroundColor: pressed || active ? tokens.surfaceMuted : "transparent" }, parts?.option]}
                  >
                    <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] }}>{display(time, format)}</Text>
                    {active ? <Check size={16} strokeWidth={1.75} color={tokens.foreground} /> : null}
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
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  overlay: { flex: 1, justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  menu: { maxHeight: 380, borderWidth: 1, borderRadius: 26, padding: 6, overflow: "hidden" },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
});

export default TimePicker;
