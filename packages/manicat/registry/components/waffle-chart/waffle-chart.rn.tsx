import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface WaffleCategory {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface WaffleChartProps extends Omit<ViewProps, "children"> {
  data: WaffleCategory[];
  label: string;
  unit?: string;
  formatValue?: (value: number, category: WaffleCategory) => string;
  rows?: number;
  columns?: number;
  accentKey?: string | null;
  legend?: boolean;
  decimals?: number;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: grid, cell, readout or legend. The React Native counterpart of `classNames`. */
  styles?: {
    grid?: StyleProp<ViewStyle>;
    cell?: StyleProp<ViewStyle>;
    readout?: StyleProp<TextStyle>;
    legend?: StyleProp<ViewStyle>;
  };
}

/** A grid of squares, one per share of the whole. Squares are views, so no SVG library is needed. */
export function WaffleChart({ data, label, unit = "", formatValue = (n) => n.toLocaleString(), rows = 10, columns = 10, accentKey = null, legend = true, decimals = 0, emptyLabel = "No data yet", style, styles: parts, ...props }: WaffleChartProps) {
  const tokens = useTokens();
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((sum, category) => sum + category.value, 0);
  if (total <= 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  // Largest-remainder allocation, so the squares always add up to the grid.
  const cells = rows * columns;
  const exact = data.map((category) => (category.value / total) * cells);
  const counts = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  for (let left = cells - counts.reduce((sum, count) => sum + count, 0), at = 0; left > 0; left -= 1, at += 1) counts[order[at % order.length].index] += 1;
  const owners = counts.flatMap((count, index) => Array<number>(count).fill(index));
  const color = (index: number) => data[index].color ?? tokens.series[index % tokens.series.length];
  const picked = data.find((category) => category.key === active);

  return (
    <View {...props} accessible accessibilityLabel={`${label}. ${data.map((category) => `${category.label} ${formatValue(category.value, category)}${unit ? ` ${unit}` : ""}, ${((category.value / total) * 100).toFixed(decimals)}%`).join(", ")}`} style={[{ alignSelf: "flex-start", gap: metrics.space[3] }, style]}>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${picked.label}: ${formatValue(picked.value, picked)}${unit ? ` ${unit}` : ""} · ${((picked.value / total) * 100).toFixed(decimals)}%` : " "}</Text>
      <View style={[local.grid, { width: columns * 22 }, parts?.grid]}>
        {owners.map((owner, index) => (
          <Pressable key={index} onPress={() => setActive(active === data[owner].key ? null : data[owner].key)} style={[local.cell, { backgroundColor: color(owner), opacity: (accentKey && data[owner].key !== accentKey) || (active && data[owner].key !== active) ? 0.3 : 1 }, parts?.cell]} />
        ))}
      </View>
      {legend ? (
        <View style={[local.legend, parts?.legend]}>
          {data.map((category, index) => (
            <Pressable key={category.key} accessibilityRole="button" onPress={() => setActive(active === category.key ? null : category.key)} style={local.legendItem}>
              <View style={[local.swatch, { backgroundColor: color(index) }]} />
              <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs }}>{category.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: 18, height: 18, margin: 2, borderRadius: 4 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: metrics.space[3] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
});

export default WaffleChart;
