import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ActivityDay {
  /** ISO date, "2026-05-04". */
  date: string;
  count: number;
}

export interface ActivityHeatmapProps extends Omit<ViewProps, "children"> {
  days: ActivityDay[];
  label: string;
  period: string;
  unit?: { one: string; other: string };
  /** Counts at which the three darker levels start. */
  thresholds?: [number, number, number];
  weekStartsOn?: 0 | 1;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  locale?: string;
  /** Extend the inner, named parts of the heatmap: readout, cell or legend. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    cell?: StyleProp<ViewStyle>;
    legend?: StyleProp<ViewStyle>;
  };
}

const CELL = 14;

/** Weeks run left to right, days top to bottom, like a contribution graph. Cells are views, so no SVG is needed. */
export function ActivityHeatmap({ days, label, period, unit = { one: "contribution", other: "contributions" }, thresholds = [1, 6, 14], weekStartsOn = 0, selectedDate, onSelectDate, locale = "en-US", style, styles: parts, ...props }: ActivityHeatmapProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<string | null>(null);
  const selected = selectedDate === undefined ? internal : selectedDate;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0] ? new Date(`${sorted[0].date}T12:00:00`) : null;
  const lead = first ? (first.getDay() - weekStartsOn + 7) % 7 : 0;
  const cells: (ActivityDay | null)[] = [...Array<null>(lead).fill(null), ...sorted];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => cells.slice(week * 7, week * 7 + 7));
  const total = sorted.reduce((sum, day) => sum + day.count, 0);
  const levels = [tokens.surfaceMuted, `${tokens.success}55`, `${tokens.success}99`, `${tokens.success}CC`, tokens.success];
  const level = (count: number) => (count <= 0 ? 0 : count < thresholds[1] ? 1 : count < thresholds[2] ? 2 : count < thresholds[2] * 2 ? 3 : 4);
  const word = (n: number) => `${n} ${n === 1 ? unit.one : unit.other}`;
  const picked = sorted.find((day) => day.date === selected);

  return (
    <View {...props} accessible accessibilityLabel={`${label}, ${period}: ${word(total)}`} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${word(picked.count)} on ${new Date(`${picked.date}T12:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}` : `${word(total)} · ${period}`}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 3 }}>
          {weeks.map((week, index) => (
            <View key={index} style={{ gap: 3 }}>
              {week.map((day, row) =>
                day ? (
                  <Pressable
                    key={day.date}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.date}, ${word(day.count)}`}
                    accessibilityState={{ selected: selected === day.date }}
                    onPress={() => {
                      if (selectedDate === undefined) setInternal(day.date);
                      onSelectDate?.(day.date);
                    }}
                    style={[local.cell, { backgroundColor: levels[level(day.count)], borderColor: selected === day.date ? tokens.foreground : "transparent" }, parts?.cell]}
                  />
                ) : (
                  <View key={`empty-${row}`} style={local.cell} />
                ),
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[local.legend, parts?.legend]}>
        <Text style={{ color: tokens.textMuted, fontSize: 11 }}>Less</Text>
        {levels.map((fill, index) => (
          <View key={index} style={[local.cell, { backgroundColor: fill }]} />
        ))}
        <Text style={{ color: tokens.textMuted, fontSize: 11 }}>More</Text>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  cell: { width: CELL, height: CELL, borderRadius: 3, borderWidth: 1, borderColor: "transparent" },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end" },
});

export default ActivityHeatmap;
