import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Calendar } from "@/registry/components/calendar/calendar.rn";
import { sameDay, startOfMonth } from "@/lib/calendar";
import type { CalendarDateMatcher } from "@/lib/calendar";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DatePickerProps {
  label: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  description?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: CalendarDateMatcher;
  locale?: string;
  format?: Intl.DateTimeFormatOptions;
  showToday?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the date picker: label, trigger, valueText, popover or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    trigger?: StyleProp<ViewStyle>;
    valueText?: StyleProp<TextStyle>;
    popover?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

export function DatePicker({ label, value, onChange, description, placeholder = "Select a date", minDate, maxDate, disabledDates, locale = "en-US", format = { month: "short", day: "numeric", year: "numeric" }, showToday = true, disabled = false, style, styles: parts }: DatePickerProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(value ?? new Date()));

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value.toDateString()}` : ""}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => {
          setMonth(startOfMonth(value ?? new Date()));
          setOpen(true);
        }}
        style={[local.trigger, { minHeight: metrics.controlHeight.md, borderColor: tokens.border, backgroundColor: tokens.surface, opacity: disabled ? 0.5 : 1 }, parts?.trigger]}
      >
        <Text style={[{ color: value ? tokens.foreground : tokens.textMuted, fontSize: metrics.text.sm }, parts?.valueText]}>{value ? value.toLocaleDateString(locale, format) : placeholder}</Text>
        <Text style={{ color: tokens.textMuted, fontSize: 14 }}>▾</Text>
      </Pressable>
      {description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close calendar" onPress={() => setOpen(false)} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.popover, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.popover]}>
            <Calendar
              value={value}
              month={month}
              onMonthChange={setMonth}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              locale={locale}
              showToday={showToday}
              onChange={(date) => {
                onChange?.(sameDay(date, value) ? undefined : date);
                setOpen(false);
              }}
            />
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
  popover: { width: "100%", maxWidth: 340, borderWidth: 1, borderRadius: 26, padding: metrics.space[4] },
});

export default DatePicker;
