import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export interface SlotTextProps extends Omit<ViewProps, "children"> {
  value: string | number;
  /** Formats a numeric value before it is shown, such as `(n) => n.toLocaleString()`. */
  format?: (value: number) => string;
  /** Seconds one character takes to roll. */
  duration?: number;
  /** Extend the inner, named parts of the slot text: text. The React Native counterpart of `classNames`. */
  styles?: { text?: StyleProp<TextStyle> };
}

/** A character that rolls up from below whenever it changes, a beat after the character before it. */
function Cell({ char, index, duration, style }: { char: string; index: number; duration: number; style: StyleProp<TextStyle> }) {
  const [progress] = useState(() => new Animated.Value(1));
  const last = useRef(char);

  useEffect(() => {
    if (last.current === char) return;
    last.current = char;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: duration * 1000, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [char, duration, index, progress]);

  return (
    <Animated.Text style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{char}</Animated.Text>
  );
}

export function SlotText({ value, format, duration = 0.6, style, styles: parts, ...props }: SlotTextProps) {
  const tokens = useTokens();
  const text = typeof value === "number" ? (format ? format(value) : value.toLocaleString()) : value;

  return (
    <View {...props} accessible accessibilityLabel={text} style={[local.row, style]}>
      {Array.from(text).map((char, index, all) => (
        // Keyed from the end, so a digit gained on the left does not make every column roll.
        <Cell key={all.length - index} char={char} index={index} duration={duration} style={[{ color: tokens.foreground, fontVariant: ["tabular-nums"] }, parts?.text]} />
      ))}
    </View>
  );
}

const local = StyleSheet.create({ row: { flexDirection: "row", overflow: "hidden" } });

export default SlotText;
