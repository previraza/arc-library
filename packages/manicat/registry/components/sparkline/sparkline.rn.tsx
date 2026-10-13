// @manicat-dependencies react-native-svg
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { areaPath, linePath, linearScale } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SparklineProps extends Omit<ViewProps, "children"> {
  data: number[];
  label: string;
  value?: string;
  change?: string;
  tone?: "accent" | "success" | "warning" | "danger";
  width?: number;
  height?: number;
  area?: boolean;
  /** Extend the inner, named parts of the sparkline: head, label, value, change or chart. The React Native counterpart of `classNames`. */
  styles?: {
    head?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
    change?: StyleProp<TextStyle>;
    chart?: StyleProp<ViewStyle>;
  };
}

/** A tiny trend line with a label, a headline number and the change. */
export function Sparkline({ data, label, value, change, tone = "accent", width = 140, height = 40, area = true, style, styles: parts, ...props }: SparklineProps) {
  const tokens = useTokens();
  const color = { accent: tokens.series[0], success: tokens.success, warning: tokens.warning, danger: tokens.danger }[tone];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const x = linearScale([0, Math.max(1, data.length - 1)], [2, width - 2]);
  const y = linearScale([min, max], [height - 3, 3]);
  const points = data.map((n, index): [number, number] => [x(index), y(n)]);
  const down = /^[-−]/.test(change?.trim() ?? "");

  return (
    <View {...props} accessible accessibilityLabel={`${label}${value ? `: ${value}` : ""}${change ? `, ${change}` : ""}`} style={[local.root, { borderColor: tokens.border, backgroundColor: tokens.surface }, style]}>
      <View style={[local.head, parts?.head]}>
        <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.label]}>{label}</Text>
        {change ? <Text style={[{ color: down ? tokens.danger : tokens.success, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.change]}>{change}</Text> : null}
      </View>
      {value ? <Text style={[{ color: tokens.foreground, fontSize: 24, fontWeight: "600", fontVariant: ["tabular-nums"] }, parts?.value]}>{value}</Text> : null}
      <View style={parts?.chart}>
        <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {area ? <Path d={areaPath(points, height, "smooth")} fill={color} fillOpacity={0.12} /> : null}
          <Path d={linePath(points, "smooth")} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 4, padding: metrics.space[4], borderWidth: 1, borderRadius: 26, alignSelf: "flex-start" },
  head: { flexDirection: "row", justifyContent: "space-between", gap: metrics.space[3] },
});

export default Sparkline;
