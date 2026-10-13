import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TimelineEvent {
  id: string;
  /** When it happened: a timestamp in milliseconds or an ISO string. */
  at: string | number;
  actor?: string;
  title: string;
  meta?: string;
  detail?: ReactNode;
  tone?: "neutral" | "success" | "danger";
}

export interface TimelineProps extends Omit<ViewProps, "children"> {
  events: TimelineEvent[];
  /** The moment relative times are measured from, in milliseconds. Pass it in so server and client agree. */
  now: number;
  label: string;
  locale?: string;
  maxHeight?: number;
  /** Extend the inner, named parts of the timeline: event, dot, line, title, meta or time. The React Native counterpart of `classNames`. */
  styles?: {
    event?: StyleProp<ViewStyle>;
    dot?: StyleProp<ViewStyle>;
    line?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    meta?: StyleProp<TextStyle>;
    time?: StyleProp<TextStyle>;
  };
}

function ago(at: string | number, now: number, locale: string): string {
  const seconds = Math.round((new Date(at).getTime() - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, "second");
}

export function Timeline({ events, now, label, locale = "en-US", maxHeight, style, styles: parts, ...props }: TimelineProps) {
  const tokens = useTokens();
  const sorted = [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <View {...props} accessibilityRole="list" accessibilityLabel={label} style={[{ alignSelf: "stretch" }, style]}>
      <ScrollView style={{ maxHeight }} nestedScrollEnabled>
        {sorted.map((event, index) => {
          const color = event.tone === "success" ? tokens.success : event.tone === "danger" ? tokens.danger : tokens.borderStrong;
          return (
            <View key={event.id} style={[local.event, parts?.event]}>
              <View style={local.rail}>
                <View style={[local.dot, { backgroundColor: color }, parts?.dot]} />
                {index < sorted.length - 1 ? <View style={[local.line, { backgroundColor: tokens.border }, parts?.line]} /> : null}
              </View>
              <View style={local.copy}>
                <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.title]}>
                  {event.actor ? <Text style={{ fontWeight: "600" }}>{event.actor} </Text> : null}
                  {event.title}
                </Text>
                <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.time]}>{ago(event.at, now, locale)}</Text>
                {event.meta ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.meta]}>{event.meta}</Text> : null}
                {event.detail}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  event: { flexDirection: "row", gap: metrics.space[3] },
  rail: { alignItems: "center", width: 12 },
  dot: { width: 10, height: 10, marginTop: 5, borderRadius: 5 },
  line: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1 },
  copy: { flex: 1, gap: 2, paddingBottom: metrics.space[4] },
});

export default Timeline;
