// @manicat-dependencies react-native-svg
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { Slider } from "@/registry/components/slider/slider.rn";
import { areaPath, compact, linePath, linearScale, niceMax, ticks } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface BrushChartDatum {
  date: Date | number;
  value: number;
}

export interface BrushChartAnnotation {
  date: Date | number;
  label: string;
  description?: string;
}

export interface BrushChartProps extends Omit<ViewProps, "children"> {
  data: BrushChartDatum[];
  label: string;
  unit?: string;
  formatValue?: (value: number) => string;
  formatDate?: (date: Date) => string;
  annotations?: BrushChartAnnotation[];
  /** The visible window as two timestamps. */
  range?: [number, number];
  defaultRange?: [number, number];
  onRangeChange?: (range: [number, number]) => void;
  height?: number;
  emptyLabel?: string;
  /** Extend the inner, named parts of the chart: readout or annotation. The React Native counterpart of `classNames`. */
  styles?: {
    readout?: StyleProp<TextStyle>;
    annotation?: StyleProp<TextStyle>;
  };
}

const time = (date: Date | number) => new Date(date).getTime();
const LEFT = 34;

/** A line chart with a range slider underneath: drag the two handles to zoom into a window. */
export function BrushChart({ data, label, unit = "", formatValue = (n) => n.toLocaleString(), formatDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), annotations = [], range, defaultRange, onRangeChange, height = 200, emptyLabel = "No data yet", style, styles: parts, ...props }: BrushChartProps) {
  const tokens = useTokens();
  const sorted = [...data].sort((a, b) => time(a.date) - time(b.date));
  const [width, setWidth] = useState(0);
  const [internal, setInternal] = useState<[number, number] | undefined>(defaultRange);
  const [active, setActive] = useState<number | null>(null);
  if (sorted.length === 0) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const first = time(sorted[0].date);
  const last = time(sorted[sorted.length - 1].date);
  const [from, to] = range ?? internal ?? [first, last];
  const visible = sorted.filter((datum) => time(datum.date) >= from && time(datum.date) <= to);
  const shown = visible.length > 1 ? visible : sorted;
  const max = niceMax(Math.max(...shown.map((datum) => datum.value)));
  const x = linearScale([time(shown[0].date), time(shown[shown.length - 1].date)], [LEFT, Math.max(LEFT + 1, width - 8)]);
  const y = linearScale([0, max], [height - 8, 8]);
  const points = shown.map((datum): [number, number] => [x(time(datum.date)), y(datum.value)]);
  const picked = active === null ? null : shown[active];
  const nearest = (locationX: number) => shown.reduce((best, datum, index) => (Math.abs(x(time(datum.date)) - locationX) < Math.abs(x(time(shown[best].date)) - locationX) ? index : best), 0);

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${formatDate(new Date(picked.date))}: ${formatValue(picked.value)}${unit ? ` ${unit}` : ""}` : `${formatDate(new Date(from))} – ${formatDate(new Date(to))}`}</Text>
      <View
        accessible
        accessibilityLabel={`${label}, ${formatDate(new Date(from))} to ${formatDate(new Date(to))}`}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setActive(nearest(event.nativeEvent.locationX))}
        onResponderMove={(event) => setActive(nearest(event.nativeEvent.locationX))}
        onResponderRelease={() => setActive(null)}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks(max, 3).map((tick) => (
              <Line key={tick} x1={LEFT} x2={width - 8} y1={y(tick)} y2={y(tick)} stroke={tokens.border} strokeWidth={StyleSheet.hairlineWidth} />
            ))}
            <Path d={areaPath(points, y(0), "smooth")} fill={tokens.series[0]} fillOpacity={0.1} />
            <Path d={linePath(points, "smooth")} fill="none" stroke={tokens.series[0]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {annotations.filter((note) => time(note.date) >= from && time(note.date) <= to).map((note) => (
              <Line key={String(note.date)} x1={x(time(note.date))} x2={x(time(note.date))} y1={8} y2={height - 8} stroke={tokens.warning} strokeDasharray="3 3" strokeWidth={1} />
            ))}
            {picked ? <Circle cx={x(time(picked.date))} cy={y(picked.value)} r={4} fill={tokens.surface} stroke={tokens.series[0]} strokeWidth={2} /> : null}
          </Svg>
        ) : null}
        {width > 0 ? ticks(max, 3).map((tick) => <Text key={tick} style={[local.tick, { top: y(tick) - 7, color: tokens.textMuted }]}>{compact(tick)}</Text>) : null}
      </View>
      <Slider<[number, number]> label="Window" value={[from, to]} min={first} max={last} step={Math.max(1, Math.round((last - first) / 200))} showValue={false} format={(n) => formatDate(new Date(n))} onValueChange={(next) => (range === undefined && setInternal(next), onRangeChange?.(next))} />
      {annotations.filter((note) => time(note.date) >= from && time(note.date) <= to).map((note) => (
        <Text key={String(note.date)} style={[{ color: tokens.warning, fontSize: metrics.text.xs }, parts?.annotation]}>{formatDate(new Date(note.date))} · {note.label}{note.description ? ` — ${note.description}` : ""}</Text>
      ))}
    </View>
  );
}

const local = StyleSheet.create({ tick: { position: "absolute", left: 0, width: LEFT - 6, textAlign: "right", fontSize: 10, fontVariant: ["tabular-nums"] } });

export default BrushChart;
