import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface UsageMeterSegment {
  id: string;
  label: string;
  value: number;
}

export interface UsageMeterProps extends Omit<ViewProps, "children"> {
  label: string;
  segments: UsageMeterSegment[];
  limit: number;
  unit?: string;
  decimals?: number;
  freeLabel?: string;
  overLabel?: string;
  /** Share of the limit at which the meter warns. */
  warnAt?: number;
  /** Extend the inner, named parts of the meter: track, segment, legend or readout. The React Native counterpart of `classNames`. */
  styles?: {
    track?: StyleProp<ViewStyle>;
    segment?: StyleProp<ViewStyle>;
    legend?: StyleProp<TextStyle>;
    readout?: StyleProp<TextStyle>;
  };
}

export function UsageMeter({ label, segments, limit, unit = "", decimals = 1, freeLabel = "Free", overLabel = "Over limit", warnAt = 0.9, style, styles: parts, ...props }: UsageMeterProps) {
  const tokens = useTokens();
  const used = segments.reduce((sum, segment) => sum + segment.value, 0);
  const share = limit > 0 ? used / limit : 0;
  const over = used > limit;
  const warn = !over && share >= warnAt;
  const shades = [tokens.foreground, tokens.accent, tokens.textMuted, tokens.borderStrong];
  const format = (n: number) => `${n.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;

  return (
    <View
      {...props}
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${format(used)} of ${format(limit)}`}
      accessibilityValue={{ min: 0, max: limit, now: Math.min(used, limit) }}
      style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}
    >
      <View style={local.head}>
        <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
        <Text style={[{ color: over ? tokens.danger : warn ? tokens.warning : tokens.textSecondary, fontSize: metrics.text.xs, fontVariant: ["tabular-nums"] }, parts?.readout]}>
          {format(used)} / {format(limit)}
        </Text>
      </View>
      <View style={[local.track, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }, parts?.track]}>
        {segments.map((segment, index) => (
          <View key={segment.id} style={[{ width: `${Math.min(100, (segment.value / Math.max(used, limit)) * 100)}%`, backgroundColor: over ? tokens.danger : warn ? tokens.warning : shades[index % shades.length] }, parts?.segment]} />
        ))}
      </View>
      <Text style={[{ color: over ? tokens.danger : tokens.textMuted, fontSize: metrics.text.xs }, parts?.legend]}>
        {over ? `${overLabel} by ${format(used - limit)}` : `${format(Math.max(0, limit - used))} ${freeLabel.toLowerCase()}`}
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  track: { height: 8, flexDirection: "row", borderWidth: 1, borderRadius: 99, overflow: "hidden" },
});

export default UsageMeter;
