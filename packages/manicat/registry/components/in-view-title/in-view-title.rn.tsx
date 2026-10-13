import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export type InViewTitleVariant = "word" | "line" | "blur" | "tracking" | "wipe";

export interface InViewTitleProps extends Omit<ViewProps, "children"> {
  text: string;
  /** `word` reveals word by word; every other variant reveals line by line (React Native has no blur or wipe, so they share the rise). */
  variant?: InViewTitleVariant;
  /** Explicit line breaks for the line variants. */
  lines?: string[];
  /** Extend the inner, named parts of the title: line or text. The React Native counterpart of `classNames`. */
  styles?: {
    line?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
  };
}

function Piece({ children, index, step, style }: { children: string; index: number; step: number; style: StyleProp<TextStyle> }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 720, delay: index * step, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index, step, progress]);

  return (
    <Animated.Text style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.Text>
  );
}

export function InViewTitle({ text, variant = "blur", lines, style, styles: parts, ...props }: InViewTitleProps) {
  const tokens = useTokens();
  const byWord = variant === "word";
  const pieces = byWord ? text.split(/\s+/).filter(Boolean) : (lines ?? [text]);
  const textStyle: TextStyle = { color: tokens.foreground, fontSize: 30, fontWeight: "600", lineHeight: 36, letterSpacing: -0.9 };

  return (
    <View {...props} accessible accessibilityRole="header" accessibilityLabel={text} style={[byWord && { flexDirection: "row", flexWrap: "wrap" }, style, parts?.line]}>
      {pieces.map((piece, index) => (
        <Piece key={`${piece}-${index}`} index={index} step={byWord ? 60 : 140} style={[textStyle, parts?.text]}>
          {byWord ? `${piece} ` : piece}
        </Piece>
      ))}
    </View>
  );
}

export default InViewTitle;
