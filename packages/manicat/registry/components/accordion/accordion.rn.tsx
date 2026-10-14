import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Text, AnimatedText } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

export interface AccordionProps extends ViewProps {
  items: AccordionItem[];
  /** Index of the item open at first. */
  defaultOpen?: number;
  size?: "md" | "lg";
  /** Extend the inner, named parts of the accordion: item, trigger, title, icon, panel or text. The React Native counterpart of `classNames`. */
  styles?: {
    item?: StyleProp<ViewStyle>;
    trigger?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    icon?: StyleProp<TextStyle>;
    panel?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
  };
}

function Chevron({ open, style, color }: { open: boolean; style?: StyleProp<TextStyle>; color: string }) {
  const [turn] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    Animated.timing(turn, { toValue: open ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [open, turn]);

  return (
    <AnimatedText style={[{ color, fontSize: 18, transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }, style]}>⌄</AnimatedText>
  );
}

export function Accordion({ items, defaultOpen, size = "md", style, styles: parts, ...props }: AccordionProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState<number | undefined>(defaultOpen);
  const large = size === "lg";

  return (
    <View {...props} style={[{ borderTopWidth: 1, borderTopColor: tokens.border, alignSelf: "stretch" }, style]}>
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <View key={`${item.title}-${index}`} style={[{ borderBottomWidth: 1, borderBottomColor: tokens.border }, parts?.item]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? undefined : index)}
              style={({ pressed }) => [local.trigger, { minHeight: large ? 76 : metrics.controlHeight.lg, opacity: pressed ? 0.7 : 1 }, parts?.trigger]}
            >
              <Text style={[{ flex: 1, color: tokens.foreground, fontSize: large ? metrics.text.lg : metrics.text.sm, fontWeight: "500" }, parts?.title]}>{item.title}</Text>
              <Chevron open={expanded} color={expanded ? tokens.foreground : tokens.textMuted} style={parts?.icon} />
            </Pressable>
            {expanded ? (
              <View style={[local.panel, parts?.panel]}>
                {typeof item.content === "string" ? (
                  <Text style={[{ color: tokens.textSecondary, fontSize: large ? 16 : metrics.text.sm, lineHeight: large ? 26 : 20 }, parts?.text]}>{item.content}</Text>
                ) : (
                  item.content
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: metrics.space[5], paddingVertical: metrics.space[2] },
  panel: { paddingBottom: metrics.space[5], paddingRight: 32 },
});

export default Accordion;
