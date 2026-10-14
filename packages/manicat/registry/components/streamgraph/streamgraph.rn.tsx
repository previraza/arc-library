// @manicat-dependencies react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { bandPath, linearScale } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface StreamgraphSeries {
  key: string;
  label: string;
  color?: string;
}

export interface StreamgraphDatum {
  key: string;
  label: string;
  axisLabel?: string;
  values: Record<string, number | undefined>;
}

export interface StreamgraphProps extends Omit<ViewProps, "children"> {
  data: StreamgraphDatum[];
  series: StreamgraphSeries[];
  label: string;
  unit?: string;
  height?: number;
  /** `silhouette` centres the stack; `zero` sits it on a baseline. */
  offset?: "silhouette" | "zero";
  formatValue?: (value: number, series: StreamgraphSeries) => string;
  legend?: boolean;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: readout, legend or axis. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    legend?: StyleProp<ViewStyle>;
    axis?: StyleProp<TextStyle>;
  };
}

/** Stacked flowing areas showing how the mix of series changes over time. Press a band or a legend entry to focus it. */
export function Streamgraph({ data, series, label, unit = "", height = 220, offset = "silhouette", formatValue = (n) => n.toLocaleString(), legend = true, emptyLabel = "No data yet", style, styles: parts, ...props }: StreamgraphProps) {
  const tokens = useTokens();
  const [width, setWidth] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  if (data.length === 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const totals = data.map((datum) => series.reduce((sum, entry) => sum + (datum.values[entry.key] ?? 0), 0));
  const peak = Math.max(...totals, 1);
  const x = linearScale([0, Math.max(1, data.length - 1)], [0, width]);
  const y = linearScale(offset === "zero" ? [0, peak] : [-peak / 2, peak / 2], [height, 0]);
  const base = data.map((_, index) => (offset === "zero" ? 0 : -totals[index] / 2));
  const color = (entry: StreamgraphSeries) => entry.color ?? tokens.series[series.indexOf(entry) % 4];
  const bands = series.map((entry, at) => {
    const lower = base.map((value, index) => value + series.slice(0, at).reduce((sum, other) => sum + (data[index].values[other.key] ?? 0), 0));
    const upper = lower.map((value, index) => value + (data[index].values[entry.key] ?? 0));
    const d = bandPath(upper.map((value, index): [number, number] => [x(index), y(value)]), lower.map((value, index): [number, number] => [x(index), y(value)]), "smooth");
    return { entry, d };
  });
  const picked = series.find((entry) => entry.key === focus);

  return (
    <View {...props} accessible accessibilityLabel={`${label}. ${series.map((entry) => entry.label).join(", ")}`} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${picked.label}: peak ${formatValue(Math.max(...data.map((datum) => datum.values[picked.key] ?? 0)), picked)}${unit ? ` ${unit}` : ""}` : " "}</Text>
      <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {bands.map(({ entry, d }) => (
              <Path key={entry.key} d={d} fill={color(entry)} fillOpacity={focus === null || focus === entry.key ? 0.85 : 0.2} onPress={() => setFocus(focus === entry.key ? null : entry.key)} />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={local.axis}>
        {data.filter((datum) => datum.axisLabel).map((datum) => (
          <Text key={datum.key} style={[{ color: tokens.textMuted, fontSize: 11 }, parts?.axis]}>{datum.axisLabel}</Text>
        ))}
      </View>
      {legend ? (
        <View style={[local.legend, parts?.legend]}>
          {series.map((entry) => (
            <Pressable key={entry.key} accessibilityRole="button" accessibilityState={{ selected: focus === entry.key }} onPress={() => setFocus(focus === entry.key ? null : entry.key)} style={local.legendItem}>
              <View style={[local.swatch, { backgroundColor: color(entry) }]} />
              <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs }}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  axis: { flexDirection: "row", justifyContent: "space-between" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: metrics.space[3] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
});

export default Streamgraph;
