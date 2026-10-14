// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { addMonths, isDisabled, monthGrid, monthLabel, sameDay, startOfMonth, weekdayLabels } from "@/lib/calendar";
import type { CalendarDateMatcher } from "@/lib/calendar";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

export interface CalendarProps extends Omit<ViewProps, "children"> {
  value?: Date;
  onChange?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: CalendarDateMatcher;
  locale?: string;
  weekStartsOn?: 0 | 1;
  showToday?: boolean;
  /** Draws a range between these two days (used by the date range picker). */
  range?: { start: Date; end?: Date | null };
  /** Extend the inner, named parts of the calendar: header, title, nav, weekday, day, dayText, selected or today. The React Native counterpart of `classNames`. */
  styles?: {
    header?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    nav?: StyleProp<ViewStyle>;
    weekday?: StyleProp<TextStyle>;
    day?: StyleProp<ViewStyle>;
    dayText?: StyleProp<TextStyle>;
    selected?: StyleProp<ViewStyle>;
    today?: StyleProp<ViewStyle>;
  };
}

export function Calendar({ value, onChange, month, onMonthChange, minDate, maxDate, disabledDates, locale = "en-US", weekStartsOn = 0, showToday = true, range, style, styles: parts, ...props }: CalendarProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(startOfMonth(value ?? range?.start ?? new Date()));
  const shown = month ?? internal;
  const today = new Date();
  const days = monthGrid(shown, weekStartsOn);

  function go(count: number) {
    const next = addMonths(shown, count);
    if (month === undefined) setInternal(next);
    onMonthChange?.(next);
  }

  const inRange = (date: Date) => Boolean(range?.start && range.end && date >= range.start && date <= range.end);

  return (
    <View {...props} accessibilityRole="none" style={[{ alignSelf: "stretch" }, style]}>
      <View style={[local.header, parts?.header]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => go(-1)} style={[local.nav, parts?.nav]}>
          <ChevronLeft size={16} strokeWidth={1.75} color={tokens.textSecondary} />
        </Pressable>
        <Text accessibilityRole="header" style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "600" }, parts?.title]}>{monthLabel(shown, locale)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={8} onPress={() => go(1)} style={[local.nav, parts?.nav]}>
          <ChevronRight size={16} strokeWidth={1.75} color={tokens.textSecondary} />
        </Pressable>
      </View>
      <View style={local.week}>
        {weekdayLabels(locale, weekStartsOn).map((label) => (
          <Text key={label} style={[local.cell, { color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.weekday]}>{label.slice(0, 2)}</Text>
        ))}
      </View>
      <View style={local.grid}>
        {days.map((date) => {
          const outside = date.getMonth() !== shown.getMonth();
          const off = isDisabled(date, { minDate, maxDate, disabledDates });
          const selected = sameDay(date, value) || sameDay(date, range?.start) || sameDay(date, range?.end);
          const isToday = showToday && sameDay(date, today);
          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={date.toDateString()}
              accessibilityState={{ selected, disabled: off }}
              disabled={off}
              onPress={() => onChange?.(date)}
              style={[local.day, inRange(date) && !selected && { backgroundColor: tokens.surfaceMuted }, selected && { backgroundColor: tokens.controlOn }, isToday && !selected && { borderColor: tokens.borderStrong, borderWidth: 1 }, parts?.day, selected && parts?.selected, isToday && parts?.today]}
            >
              <Text style={[{ color: selected ? tokens.controlThumbOn : outside ? tokens.textMuted : tokens.foreground, opacity: off ? 0.4 : 1, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] }, parts?.dayText]}>{date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: metrics.space[2] },
  nav: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  week: { flexDirection: "row" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, textAlign: "center", paddingVertical: 6 },
  day: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999 },
});

export default Calendar;
