// @manicat-dependencies react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import { areaPath, compact, linePath, linearScale, niceMax, ticks } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface LineChartSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
  area?: boolean;
}

export interface LineChartDatum {
  key: string;
  label: string;
  axisLabel?: string;
  values: Record<string, number | undefined>;
}

export interface LineChartProps extends Omit<ViewProps, "children"> {
  data: LineChartDatum[];
  series: LineChartSeries[];
  label: string;
  unit?: string;
  height?: number;
  curve?: "smooth" | "linear";
  legend?: boolean;
  emptyLabel?: string;
  formatValue?: (value: number, series: LineChartSeries) => string;
  formatTick?: (value: number) => string;
  /** Extend the inner, named parts of the chart: readout, legend, legendItem or axis. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    legend?: StyleProp<ViewStyle>;
    legendItem?: StyleProp<ViewStyle>;
    axis?: StyleProp<TextStyle>;
  };
}

const LEFT = 34;

/** Press or drag across the chart to read the values at that point. Press a legend entry to hide a series. */
export function LineChart({ data, series, label, unit = "", height = 220, curve = "smooth", legend = true, emptyLabel = "No data yet", formatValue = (n) => n.toLocaleString(), formatTick = compact, style, styles: parts, ...props }: LineChartProps) {
  const tokens = useTokens();
  const [width, setWidth] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const shown = series.filter((entry) => !hidden.includes(entry.key));
  const color = (entry: LineChartSeries) => entry.color ?? tokens.series[series.indexOf(entry) % tokens.series.length];

  if (data.length === 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const max = niceMax(Math.max(...shown.flatMap((entry) => data.map((datum) => datum.values[entry.key] ?? 0)), 0));
  const x = linearScale([0, Math.max(1, data.length - 1)], [LEFT, Math.max(LEFT + 1, width - 8)]);
  const y = linearScale([0, max], [height - 22, 8]);
  const at = (locationX: number) => Math.max(0, Math.min(data.length - 1, Math.round(((locationX - LEFT) / Math.max(1, width - LEFT - 8)) * (data.length - 1))));
  const datum = active === null ? null : data[active];

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>
        {datum ? `${datum.label} · ${shown.map((entry) => `${entry.label} ${formatValue(datum.values[entry.key] ?? 0, entry)}${unit ? ` ${unit}` : ""}`).join(" · ")}` : " "}
      </Text>
      <View
        accessible
        accessibilityLabel={`${label}. ${shown.map((entry) => entry.label).join(", ")}`}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setActive(at(event.nativeEvent.locationX))}
        onResponderMove={(event) => setActive(at(event.nativeEvent.locationX))}
        onResponderRelease={() => setActive(null)}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks(max, 4).map((tick) => (
              <Line key={tick} x1={LEFT} x2={width - 8} y1={y(tick)} y2={y(tick)} stroke={tokens.border} strokeWidth={StyleSheet.hairlineWidth} />
            ))}
            {shown.map((entry) => {
              const points = data.flatMap((datum, index): [number, number][] => (datum.values[entry.key] === undefined ? [] : [[x(index), y(datum.values[entry.key] as number)]]));
              return (
                <G key={entry.key}>
                  {entry.area ? <Path d={areaPath(points, y(0), curve)} fill={color(entry)} fillOpacity={0.12} /> : null}
                  <Path d={linePath(points, curve)} fill="none" stroke={color(entry)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={entry.dashed ? "5 5" : undefined} />
                </G>
              );
            })}
            {active !== null ? <Line x1={x(active)} x2={x(active)} y1={8} y2={height - 22} stroke={tokens.borderStrong} strokeWidth={1} /> : null}
            {active !== null ? shown.map((entry) => (data[active].values[entry.key] !== undefined ? <Circle key={entry.key} cx={x(active)} cy={y(data[active].values[entry.key] as number)} r={4} fill={tokens.surface} stroke={color(entry)} strokeWidth={2} /> : null)) : null}
          </Svg>
        ) : null}
        {width > 0 ? ticks(max, 4).map((tick) => (
          <Text key={tick} style={[local.tick, { top: y(tick) - 7, color: tokens.textMuted }]}>{formatTick(tick)}</Text>
        )) : null}
      </View>
      <View style={local.axis}>
        {data.filter((datum) => datum.axisLabel).map((datum) => (
          <Text key={datum.key} style={[{ color: tokens.textMuted, fontSize: 11 }, parts?.axis]}>{datum.axisLabel}</Text>
        ))}
      </View>
      {legend ? (
        <View style={[local.legend, parts?.legend]}>
          {series.map((entry) => (
            <Pressable key={entry.key} accessibilityRole="button" accessibilityState={{ selected: !hidden.includes(entry.key) }} onPress={() => setHidden((current) => (current.includes(entry.key) ? current.filter((key) => key !== entry.key) : [...current, entry.key]))} style={[local.legendItem, parts?.legendItem]}>
              <View style={[local.swatch, { backgroundColor: hidden.includes(entry.key) ? tokens.border : color(entry) }]} />
              <Text style={{ color: hidden.includes(entry.key) ? tokens.textMuted : tokens.foreground, fontSize: metrics.text.xs }}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  tick: { position: "absolute", left: 0, width: LEFT - 6, textAlign: "right", fontSize: 10, fontVariant: ["tabular-nums"] },
  axis: { flexDirection: "row", justifyContent: "space-between", paddingLeft: LEFT },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: metrics.space[3] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
});

export default LineChart;
