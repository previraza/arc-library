import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type GaugeTone = "accent" | "success" | "warning" | "danger";

/** A band that starts at `from`: the highest band the value reaches sets the tone and names the state. */
export interface GaugeThreshold {
  from: number;
  tone: GaugeTone;
  label: string;
}

export interface GaugeProps extends Omit<ViewProps, "children"> {
  value: number;
  min?: number;
  max?: number;
  label: string;
  detail?: string;
  tone?: GaugeTone;
  thresholds?: GaugeThreshold[];
  /** Extend the inner, named parts of the gauge: track, fill, readout, label or detail. The React Native counterpart of `classNames`. */
  styles?: {
    track?: StyleProp<ViewStyle>;
    fill?: StyleProp<ViewStyle>;
    readout?: StyleProp<TextStyle>;
    label?: StyleProp<TextStyle>;
    detail?: StyleProp<TextStyle>;
  };
}

/** Drawn as a bar: a ring needs an SVG library, which this port does not assume. Swap in react-native-svg if you want the dial. */
export function Gauge({ value, min = 0, max = 100, label, detail, tone = "accent", thresholds, style, styles: parts, ...props }: GaugeProps) {
  const tokens = useTokens();
  const clamped = Math.max(min, Math.min(max, value));
  const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const band = thresholds ? [...thresholds].sort((a, b) => a.from - b.from).filter((entry) => clamped >= entry.from).at(-1) : undefined;
  const resolved = band?.tone ?? tone;
  const color = { accent: tokens.accent, success: tokens.success, warning: tokens.warning, danger: tokens.danger }[resolved];

  return (
    <View
      {...props}
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}${band ? `, ${band.label}` : ""}`}
      accessibilityValue={{ min, max, now: clamped }}
      style={[local.root, style]}
    >
      <Text style={[local.readout, { color: tokens.foreground }, parts?.readout]}>{Math.round(percent)}%</Text>
      <View style={[local.track, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }, parts?.track]}>
        <View style={[local.fill, { width: `${percent}%`, backgroundColor: color }, parts?.fill]} />
      </View>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      {band ? <Text style={[local.detail, { color }]}>{band.label}</Text> : detail ? <Text style={[local.detail, { color: tokens.textMuted }, parts?.detail]}>{detail}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 6, minWidth: 120 },
  readout: { fontSize: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
  track: { height: 8, borderWidth: 1, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  detail: { fontSize: metrics.text.xs },
});

export default Gauge;
