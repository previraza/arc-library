// @manicat-dependencies react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { arcPath } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DonutChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps extends Omit<ViewProps, "children"> {
  data: DonutChartDatum[];
  label: string;
  unit?: string;
  formatValue?: (value: number) => string;
  totalLabel?: string;
  size?: number;
  thickness?: number;
  /** Segments below this share of the total fold into one "Other". */
  groupBelow?: number;
  otherLabel?: string;
  legend?: boolean;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: center, total, legend or legendItem. The React Native counterpart of `classNames`. */
  styles?: {
    center?: StyleProp<ViewStyle>;
    total?: StyleProp<TextStyle>;
    legend?: StyleProp<ViewStyle>;
    legendItem?: StyleProp<ViewStyle>;
  };
}

export function DonutChart({ data, label, unit = "", formatValue = (n) => n.toLocaleString(), totalLabel = "Total", size = 180, thickness = 22, groupBelow = 0, otherLabel = "Other", legend = true, emptyLabel = "No data yet", style, styles: parts, ...props }: DonutChartProps) {
  const tokens = useTokens();
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const grandTotal = data.reduce((sum, datum) => sum + datum.value, 0);
  const small = groupBelow > 0 ? data.filter((datum) => datum.value / Math.max(1, grandTotal) < groupBelow) : [];
  const items: DonutChartDatum[] = small.length > 1 ? [...data.filter((datum) => !small.includes(datum)), { key: "other", label: otherLabel, value: small.reduce((sum, datum) => sum + datum.value, 0) }] : data;
  const visible = items.filter((datum) => !hidden.includes(datum.key));
  const total = visible.reduce((sum, datum) => sum + datum.value, 0);
  const color = (datum: DonutChartDatum) => datum.color ?? tokens.series[items.indexOf(datum) % tokens.series.length];

  if (grandTotal <= 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const radius = size / 2;
  const spans = visible.map((datum) => (datum.value / Math.max(1, total)) * Math.PI * 2);
  const arcs = visible.map((datum, index) => {
    const from = spans.slice(0, index).reduce((sum, span) => sum + span, 0);
    return { datum, d: arcPath(radius, radius, radius - 2, radius - thickness, from, from + Math.max(0.001, spans[index] - 0.02)) };
  });
  const picked = items.find((datum) => datum.key === active);

  return (
    <View {...props} accessible accessibilityLabel={`${label}. ${items.map((datum) => `${datum.label} ${formatValue(datum.value)}`).join(", ")}`} style={[{ alignItems: "center", gap: metrics.space[3] }, style]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {arcs.map(({ datum, d }) => (
            <Path key={datum.key} d={d} fill={color(datum)} opacity={active === null || active === datum.key ? 1 : 0.35} onPress={() => setActive(active === datum.key ? null : datum.key)} />
          ))}
        </Svg>
        <View pointerEvents="none" style={[local.center, parts?.center]}>
          <Text style={[{ color: tokens.foreground, fontSize: 22, fontWeight: "600", fontVariant: ["tabular-nums"] }, parts?.total]}>{formatValue(picked ? picked.value : total)}</Text>
          <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{picked ? picked.label : totalLabel}{unit && !picked ? ` · ${unit}` : ""}</Text>
        </View>
      </View>
      {legend ? (
        <View style={[local.legend, parts?.legend]}>
          {items.map((datum) => (
            <Pressable key={datum.key} accessibilityRole="button" accessibilityState={{ selected: !hidden.includes(datum.key) }} onPress={() => setHidden((current) => (current.includes(datum.key) ? current.filter((key) => key !== datum.key) : [...current, datum.key]))} style={[local.legendItem, parts?.legendItem]}>
              <View style={[local.swatch, { backgroundColor: hidden.includes(datum.key) ? tokens.border : color(datum) }]} />
              <Text style={{ color: hidden.includes(datum.key) ? tokens.textMuted : tokens.foreground, fontSize: metrics.text.xs }}>{datum.label}</Text>
              <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, fontVariant: ["tabular-nums"] }}>{Math.round((datum.value / grandTotal) * 100)}%</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: metrics.space[3] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
});

export default DonutChart;
