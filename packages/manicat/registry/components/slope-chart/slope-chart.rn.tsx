// @manicat-dependencies react-native-svg
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { linearScale } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SlopeItem {
  key: string;
  label: string;
  start: number;
  end: number;
}

export interface SlopeChartProps extends Omit<ViewProps, "children"> {
  data: SlopeItem[];
  label: string;
  startLabel: string;
  endLabel: string;
  formatValue?: (value: number) => string;
  formatChange?: (change: number, item: SlopeItem) => string;
  height?: number;
  highlightKey?: string | null;
  ranks?: boolean;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: heading or readout. The React Native counterpart of `classNames`. */
  styles?: {
    heading?: StyleProp<TextStyle>;
    readout?: StyleProp<TextStyle>;
  };
}

const SIDE = 96;

/** Two columns of values joined by lines: what rose, what fell, and who overtook whom. */
export function SlopeChart({ data, label, startLabel, endLabel, formatValue = (n) => String(n), formatChange = (change) => `${change > 0 ? "+" : ""}${change}`, height = 220, highlightKey = null, ranks = false, emptyLabel = "No data yet", style, styles: parts, ...props }: SlopeChartProps) {
  const tokens = useTokens();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  if (data.length === 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const values = data.flatMap((item) => [item.start, item.end]);
  const y = linearScale([Math.min(...values), Math.max(...values)], [height - 12, 12]);
  const focus = active ?? highlightKey;
  const picked = data.find((item) => item.key === active);
  const leftX = SIDE;
  const rightX = Math.max(SIDE + 40, width - SIDE);

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${picked.label}: ${formatValue(picked.start)} → ${formatValue(picked.end)} (${formatChange(picked.end - picked.start, picked)})` : " "}</Text>
      <View accessible accessibilityLabel={`${label}. ${data.map((item) => `${item.label} ${formatValue(item.start)} to ${formatValue(item.end)}`).join(", ")}`} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {data.map((item) => {
                const up = item.end >= item.start;
                const stroke = focus === null || focus === item.key ? (up ? tokens.success : tokens.danger) : tokens.border;
                return (
                  <Line key={item.key} x1={leftX} y1={y(item.start)} x2={rightX} y2={y(item.end)} stroke={stroke} strokeWidth={focus === item.key ? 3 : 2} strokeLinecap="round" onPress={() => setActive(active === item.key ? null : item.key)} />
                );
              })}
              {data.flatMap((item) => [
                <Circle key={`${item.key}-a`} cx={leftX} cy={y(item.start)} r={4} fill={tokens.surface} stroke={tokens.textSecondary} strokeWidth={1.5} />,
                <Circle key={`${item.key}-b`} cx={rightX} cy={y(item.end)} r={4} fill={tokens.surface} stroke={tokens.textSecondary} strokeWidth={1.5} />,
              ])}
            </Svg>
            {data.map((item) => (
              <Text key={`${item.key}-l`} numberOfLines={1} style={[local.side, { left: 0, top: y(item.start) - 8, color: focus === null || focus === item.key ? tokens.foreground : tokens.textMuted }]}>{item.label} {formatValue(item.start)}</Text>
            ))}
            {data.map((item) => (
              <Text key={`${item.key}-r`} numberOfLines={1} style={[local.side, { right: 0, top: y(item.end) - 8, textAlign: "left", color: focus === null || focus === item.key ? tokens.foreground : tokens.textMuted }]}>{formatValue(item.end)}</Text>
            ))}
          </>
        ) : null}
      </View>
      <View style={local.heads}>
        <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.heading]}>{startLabel}</Text>
        <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.heading]}>{endLabel}</Text>
      </View>
      {ranks ? <Text style={{ color: tokens.textMuted, fontSize: 11 }}>Ranked by {endLabel}: {[...data].sort((a, b) => b.end - a.end).map((item) => item.label).join(" › ")}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  side: { position: "absolute", width: SIDE - 10, fontSize: 11, fontVariant: ["tabular-nums"] },
  heads: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SIDE - 24 },
});

export default SlopeChart;
