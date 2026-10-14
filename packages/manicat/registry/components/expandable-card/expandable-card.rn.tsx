import { useState } from "react";
import type { ReactNode } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);

export interface ExpandableCardProps extends Omit<ViewProps, "children"> {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Extend the inner, named parts of the card: header, title, description, chevron or body. The React Native counterpart of `classNames`. */
  styles?: {
    header?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    chevron?: StyleProp<TextStyle>;
    body?: StyleProp<ViewStyle>;
  };
}

/** The card grows in place to show its content, pushing what is below it down. */
export function ExpandableCard({ title, description, children, defaultExpanded = false, style, styles: parts, ...props }: ExpandableCardProps) {
  const tokens = useTokens();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View {...props} style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((value) => !value);
        }}
        style={[local.header, parts?.header]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[{ color: tokens.foreground, fontSize: metrics.text.lg, fontWeight: "500" }, parts?.title]}>{title}</Text>
          {description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.sm }, parts?.description]}>{description}</Text> : null}
        </View>
        <Text style={[{ color: tokens.textMuted, fontSize: 18, transform: [{ rotate: expanded ? "180deg" : "0deg" }] }, parts?.chevron]}>⌄</Text>
      </Pressable>
      {expanded ? <View style={[local.body, { borderTopColor: tokens.border }, parts?.body]}>{children}</View> : null}
    </View>
  );
}

const local = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 26, overflow: "hidden", alignSelf: "stretch" },
  header: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], padding: metrics.space[5] },
  body: { padding: metrics.space[5], borderTopWidth: 1 },
});

export default ExpandableCard;
