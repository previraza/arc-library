// @manicat-dependencies react-native-svg
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps } from "react-native";
import Svg, { Path } from "react-native-svg";
import { areaPath, linearScale } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface RidgelineSeries {
  id: string;
  label: string;
  values: number[];
}

export interface RidgelineProps extends Omit<ViewProps, "children"> {
  series: RidgelineSeries[];
  label: string;
  unit?: string;
  formatValue?: (value: number) => string;
  /** How far each ridge climbs into the one above, as a multiple of the row height. */
  overlap?: number;
  rowHeight?: number;
  /** Colour each ridge from the series palette instead of one tone. */
  tint?: boolean;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: readout or rowLabel. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    rowLabel?: StyleProp<TextStyle>;
  };
}

/** One filled curve per series, stacked with overlap, to compare how values are distributed. */
export function Ridgeline({ series, label, unit = "", formatValue = (n) => n.toLocaleString(), overlap = 0.6, rowHeight = 56, tint = false, emptyLabel = "No data yet", style, styles: parts, ...props }: RidgelineProps) {
  const tokens = useTokens();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  if (series.length === 0 || series.every((entry) => entry.values.length === 0)) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const all = series.flatMap((entry) => entry.values);
  const top = Math.max(...all);
  const step = rowHeight * (1 - overlap);
  const height = step * (series.length - 1) + rowHeight + 4;
  const picked = series.find((entry) => entry.id === active);
  const mean = (entry: RidgelineSeries) => entry.values.reduce((sum, value) => sum + value, 0) / Math.max(1, entry.values.length);

  return (
    <View {...props} accessible accessibilityLabel={`${label}. ${series.map((entry) => `${entry.label} average ${formatValue(Math.round(mean(entry)))}`).join(", ")}`} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${picked.label}: average ${formatValue(Math.round(mean(picked)))}${unit ? ` ${unit}` : ""}` : " "}</Text>
      <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {series.map((entry, index) => {
              const base = index * step + rowHeight;
              const x = linearScale([0, Math.max(1, entry.values.length - 1)], [0, width]);
              const y = linearScale([0, top], [base, base - rowHeight]);
              const points = entry.values.map((value, at): [number, number] => [x(at), y(value)]);
              const color = tint ? tokens.series[index % 4] : tokens.series[0];
              return (
                <Path key={entry.id} d={areaPath(points, base, "smooth")} fill={color} fillOpacity={active === null || active === entry.id ? 0.35 : 0.12} stroke={color} strokeWidth={1.5} onPress={() => setActive(active === entry.id ? null : entry.id)} />
              );
            })}
          </Svg>
        ) : null}
        {width > 0 ? series.map((entry, index) => <Text key={entry.id} style={[local.rowLabel, { top: index * step + rowHeight - 14, color: tokens.textMuted }, parts?.rowLabel]}>{entry.label}</Text>) : null}
      </View>
    </View>
  );
}

const local = StyleSheet.create({ rowLabel: { position: "absolute", left: 0, fontSize: 11 } });

export default Ridgeline;
