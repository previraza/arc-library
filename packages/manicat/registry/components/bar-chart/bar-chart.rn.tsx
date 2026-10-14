import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { compact, niceMax, ticks } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface BarChartDatum {
  key: string;
  label: string;
  axisLabel?: string;
  value: number;
}

export interface BarChartProps extends Omit<ViewProps, "children"> {
  data: BarChartDatum[];
  label: string;
  period: string;
  unit?: string;
  averageLabel?: string;
  showAverage?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
  /** Extend the inner, named parts of the chart: readout, plot, bar, barActive, axis or average. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    plot?: StyleProp<ViewStyle>;
    bar?: StyleProp<ViewStyle>;
    barActive?: StyleProp<ViewStyle>;
    axis?: StyleProp<TextStyle>;
    average?: StyleProp<ViewStyle>;
  };
}

/** Bars are plain views, so this chart needs no SVG library. Press a bar to read its value. */
export function BarChart({ data, label, period, unit = "", averageLabel = "Average", showAverage = false, height = 180, formatValue = (n) => n.toLocaleString(), style, styles: parts, ...props }: BarChartProps) {
  const tokens = useTokens();
  const [active, setActive] = useState<string | null>(null);
  const max = niceMax(Math.max(...data.map((datum) => datum.value), 0));
  const average = data.reduce((sum, datum) => sum + datum.value, 0) / Math.max(1, data.length);
  const picked = data.find((datum) => datum.key === active);
  const top = ticks(max, 2);

  return (
    <View {...props} accessible accessibilityLabel={`${label}, ${period}. ${data.map((datum) => `${datum.label} ${formatValue(datum.value)}${unit ? ` ${unit}` : ""}`).join(", ")}`} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <View style={local.head}>
        <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
        <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{period}</Text>
      </View>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>
        {picked ? `${picked.label}: ${formatValue(picked.value)}${unit ? ` ${unit}` : ""}` : showAverage ? `${averageLabel}: ${formatValue(Math.round(average))}${unit ? ` ${unit}` : ""}` : " "}
      </Text>
      <View style={[local.plot, { height }, parts?.plot]}>
        {top.slice(1).map((tick) => (
          <View key={tick} pointerEvents="none" style={[local.grid, { bottom: (tick / max) * height, borderTopColor: tokens.border }]}>
            <Text style={{ color: tokens.textMuted, fontSize: 10, marginTop: -14 }}>{compact(tick)}</Text>
          </View>
        ))}
        {showAverage ? <View pointerEvents="none" style={[local.average, { bottom: (average / max) * height, borderTopColor: tokens.textMuted }, parts?.average]} /> : null}
        <View style={local.bars}>
          {data.map((datum) => (
            <Pressable key={datum.key} accessibilityRole="button" accessibilityLabel={`${datum.label}, ${formatValue(datum.value)}`} onPress={() => setActive(active === datum.key ? null : datum.key)} style={local.column}>
              <View style={[local.bar, { height: Math.max(2, (datum.value / max) * height), backgroundColor: active === null || active === datum.key ? tokens.series[0] : `${tokens.series[0]}55` }, parts?.bar, active === datum.key && parts?.barActive]} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={local.axis}>
        {data.map((datum) => (
          <Text key={datum.key} style={[local.axisLabel, { color: tokens.textMuted }, parts?.axis]}>{datum.axisLabel ?? datum.label}</Text>
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between" },
  plot: { justifyContent: "flex-end" },
  grid: { position: "absolute", left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  average: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed" },
  bars: { flexDirection: "row", alignItems: "flex-end", flex: 1, gap: 6 },
  column: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  axis: { flexDirection: "row", gap: 6 },
  axisLabel: { flex: 1, fontSize: 11, textAlign: "center" },
});

export default BarChart;
