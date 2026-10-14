import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  /** Style of the wrapper around the trigger. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the tooltip: bubble or text. The React Native counterpart of `classNames`. */
  styles?: {
    bubble?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
  };
}

/** There is no hover on a phone, so the tip shows on a long press and hides itself after a moment. */
export function Tooltip({ content, children, side = "top", style, styles: parts }: TooltipProps) {
  const tokens = useTokens();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function show() {
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2600);
  }

  return (
    <View style={[local.wrap, style]}>
      <Pressable accessibilityHint={typeof content === "string" ? content : undefined} onLongPress={show} delayLongPress={350}>
        {children}
      </Pressable>
      {visible ? (
        <View
          accessibilityRole="text"
          pointerEvents="none"
          style={[
            local.bubble,
            side === "top" ? { bottom: "100%", marginBottom: 6 } : { top: "100%", marginTop: 6 },
            { backgroundColor: tokens.foreground },
            parts?.bubble,
          ]}
        >
          {typeof content === "string" ? <Text style={[{ color: tokens.background, fontSize: metrics.text.xs }, parts?.text]}>{content}</Text> : content}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { alignSelf: "flex-start", alignItems: "center" },
  bubble: { position: "absolute", minWidth: 60, maxWidth: 240, paddingVertical: metrics.space[2], paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4, zIndex: 10 },
});

export default Tooltip;
