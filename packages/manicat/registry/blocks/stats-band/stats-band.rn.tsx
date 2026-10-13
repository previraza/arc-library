import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export type StatVisual =
  | { kind: "trend"; values: number[] }
  | { kind: "uptime"; days: number[] }
  | { kind: "distribution"; bins: number[]; max: number; marker: number };

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** `compact` shortens large numbers to 2.3M or 12K. */
  notation?: "standard" | "compact";
  label: string;
  detail?: string;
  context?: string;
  visual?: StatVisual;
}

const uptimeDays = Array.from({ length: 90 }, (_, day) => (day === 51 ? 99.24 : day === 23 ? 99.93 : 100));

export const exampleStats: Stat[] = [
  { value: 2_334_000, notation: "compact", decimals: 1, label: "Deploys in the last 12 months", detail: "Across 12,400 teams", context: "Up from 1.4M the year before", visual: { kind: "trend", values: [141, 148, 139, 162, 171, 184, 196, 203, 221, 238, 257, 274] } },
  { value: 99.99, decimals: 2, suffix: "%", label: "API uptime over 90 days", detail: "Measured every 30 seconds", context: "12 minutes down, 11 of them on July 14", visual: { kind: "uptime", days: uptimeDays } },
  { value: 38, suffix: "ms", label: "Median response time", detail: "At the edge, worldwide", context: "p95 is 96 ms, down from 141 ms", visual: { kind: "distribution", bins: [2, 8, 18, 26, 15, 10, 7, 5, 3, 2, 1.5, 1, 0.8, 0.7, 0.5, 0.3], max: 160, marker: 38 } },
  { value: 35, label: "Edge regions on six continents", detail: "Most people are under 20 ms away", context: "Eight added this year, including Lagos" },
];

export interface StatsBandProps extends ViewProps {
  stats?: Stat[];
  /** `plain` lets the stats float on whitespace; `divided` rules them with hairlines. */
  layout?: "plain" | "divided";
  title?: string;
  description?: string;
  /** Milliseconds each number takes to count up. Defaults to 1600. */
  duration?: number;
  locale?: string;
  /** Extend the inner, named parts of the band. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; stat?: StyleProp<ViewStyle>; number?: StyleProp<TextStyle>; label?: StyleProp<TextStyle> };
}

function format(stat: Stat, value: number, locale: string) {
  const decimals = stat.decimals ?? 0;
  const digits = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (stat.notation !== "compact") return { text: digits.format(value), unit: "" };
  const size = Math.abs(stat.value);
  const [scale, unit] = size >= 1e9 ? [1e9, "B"] : size >= 1e6 ? [1e6, "M"] : size >= 1e3 ? [1e3, "K"] : [1, ""];
  return { text: digits.format(value / scale), unit };
}

function Count({ stat, duration, locale, style }: { stat: Stat; duration: number; locale: string; style: StyleProp<TextStyle> }) {
  const [shown, setShown] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(value * stat.value));
    Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => progress.removeListener(id);
  }, [progress, stat.value, duration]);
  const { text, unit } = format(stat, shown, locale);
  const final = format(stat, stat.value, locale);
  return (
    <Text accessibilityLabel={`${stat.prefix ?? ""}${final.text}${final.unit}${stat.suffix ?? ""}`} style={style}>
      {stat.prefix}{text}{unit}{stat.suffix}
    </Text>
  );
}

function Visual({ visual, color, muted }: { visual: StatVisual; color: string; muted: string }) {
  const bars = useMemo(() => {
    if (visual.kind === "trend") {
      const min = Math.min(...visual.values), span = Math.max(...visual.values) - min || 1;
      return visual.values.map((value) => ({ height: 0.2 + ((value - min) / span) * 0.8, ink: true }));
    }
    if (visual.kind === "uptime") return visual.days.map((uptime) => ({ height: Math.min(1, Math.max(0.3, 1 - (100 - uptime) * 0.7)), ink: uptime < 100 }));
    const peak = Math.max(...visual.bins) || 1, width = visual.max / visual.bins.length;
    return visual.bins.map((count, index) => ({ height: Math.max(0.04, count / peak), ink: index * width < visual.marker }));
  }, [visual]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={local.bars}>
      {bars.map((bar, index) => <View key={index} style={{ flex: 1, height: `${bar.height * 100}%`, borderRadius: 1, backgroundColor: bar.ink ? color : muted }} />)}
    </View>
  );
}

export function StatsBand({ stats = exampleStats, layout = "plain", title, description, duration = 1600, locale = "en-US", style, styles: parts, ...props }: StatsBandProps) {
  const tokens = useTokens();
  const [active, setActive] = useState<number | null>(null);
  return (
    <View {...props} accessibilityLabel={title ?? "Key numbers"} style={[local.root, layout === "divided" && { borderTopWidth: 1, borderBottomWidth: 1, borderColor: tokens.border }, style]}>
      {title || description ? (
        <View style={local.header}>
          {title ? <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text> : null}
          {description ? <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text> : null}
        </View>
      ) : null}
      {stats.map((stat, index) => (
        <View key={`${stat.label}-${index}`} onTouchStart={() => setActive(index)} onTouchEnd={() => setActive(null)} style={[local.stat, layout === "divided" && index > 0 && { borderTopWidth: 1, borderColor: tokens.border }, parts?.stat]}>
          <Text style={[{ color: tokens.textSecondary, fontSize: 13 }, parts?.label]}>{stat.label}</Text>
          <Count stat={stat} duration={duration} locale={locale} style={[local.number, { color: tokens.foreground }, parts?.number]} />
          <Text style={{ color: tokens.textMuted, fontSize: 13 }}>{active === index && stat.context ? stat.context : stat.detail}</Text>
          {stat.visual ? <Visual visual={stat.visual} color={active === index ? tokens.series[0] : tokens.foreground} muted={tokens.borderStrong} /> : null}
        </View>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 8 },
  header: { gap: 6, paddingVertical: 8 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  stat: { gap: 4, paddingVertical: 14 },
  number: { fontSize: 38, fontWeight: "600", letterSpacing: -1, fontVariant: ["tabular-nums"] },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 36, gap: 1, marginTop: 6 },
});

export default StatsBand;
