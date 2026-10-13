import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Calendar } from "@/registry/components/calendar/calendar.rn";
import { addDays, startOfDay, startOfMonth } from "@/lib/calendar";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangePreset {
  label: string;
  range: (today: Date) => DateRange;
}

const defaultPresets: DateRangePreset[] = [
  { label: "Last 7 days", range: (today) => ({ start: addDays(startOfDay(today), -6), end: startOfDay(today) }) },
  { label: "Last 30 days", range: (today) => ({ start: addDays(startOfDay(today), -29), end: startOfDay(today) }) },
  { label: "This month", range: (today) => ({ start: startOfMonth(today), end: startOfDay(today) }) },
];

export interface DateRangePickerProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
  presets?: DateRangePreset[];
  minDate?: Date;
  maxDate?: Date;
  weekStartsOn?: 0 | 1;
  locale?: string;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the picker: label, trigger, valueText, popover or preset. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    trigger?: StyleProp<ViewStyle>;
    valueText?: StyleProp<TextStyle>;
    popover?: StyleProp<ViewStyle>;
    preset?: StyleProp<ViewStyle>;
  };
}

export function DateRangePicker({ value, defaultValue = null, onChange, label = "Date range", placeholder = "Select a range", presets = defaultPresets, minDate, maxDate, weekStartsOn = 0, locale = "en-US", style, styles: parts }: DateRangePickerProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<DateRange | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const current = value === undefined ? internal : value;
  const short = (date: Date) => date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  function commit(range: DateRange) {
    if (value === undefined) setInternal(range);
    onChange?.(range);
    setAnchor(null);
    setOpen(false);
  }

  function pick(date: Date) {
    if (!anchor) return setAnchor(date);
    commit(date < anchor ? { start: date, end: anchor } : { start: anchor, end: date });
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${current ? `, ${short(current.start)} to ${short(current.end)}` : ""}`}
        onPress={() => {
          setMonth(startOfMonth(current?.start ?? new Date()));
          setOpen(true);
        }}
        style={[local.trigger, { minHeight: metrics.controlHeight.md, borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.trigger]}
      >
        <Text style={[{ color: current ? tokens.foreground : tokens.textMuted, fontSize: metrics.text.sm }, parts?.valueText]}>{current ? `${short(current.start)} – ${short(current.end)}` : placeholder}</Text>
        <Text style={{ color: tokens.textMuted, fontSize: 14 }}>▾</Text>
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close calendar" onPress={() => (setAnchor(null), setOpen(false))} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.popover, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.popover]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: metrics.space[3] }}>
              {presets.map((preset) => (
                <Pressable key={preset.label} accessibilityRole="button" onPress={() => commit(preset.range(new Date()))} style={[local.preset, { borderColor: tokens.border }, parts?.preset]}>
                  <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }}>{preset.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, marginBottom: 4 }}>{anchor ? "Choose the end date" : "Choose the start date"}</Text>
            <Calendar month={month} onMonthChange={setMonth} locale={locale} weekStartsOn={weekStartsOn} minDate={minDate} maxDate={maxDate} range={anchor ? { start: anchor } : (current ?? undefined)} onChange={pick} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  popover: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 26, padding: metrics.space[4] },
  preset: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
});

export default DateRangePicker;
