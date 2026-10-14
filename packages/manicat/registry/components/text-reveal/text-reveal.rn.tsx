import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { AnimatedText } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export interface TextRevealProps extends Omit<ViewProps, "children"> {
  text: string;
  /** Delay before the first word, in seconds. */
  delay?: number;
  /** Extend the inner, named parts of the reveal: line or word. The React Native counterpart of `classNames`. */
  styles?: {
    line?: StyleProp<ViewStyle>;
    word?: StyleProp<TextStyle>;
  };
}

/** Each word rises out of a short offset and fades in, a beat after the one before it. */
function Word({ children, index, delay, style }: { children: string; index: number; delay: number; style: StyleProp<TextStyle> }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 620, delay: delay * 1000 + index * 55, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [delay, index, progress]);

  return (
    <AnimatedText
      style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
    >
      {children}{" "}
    </AnimatedText>
  );
}

export function TextReveal({ text, delay = 0, style, styles: parts, ...props }: TextRevealProps) {
  const tokens = useTokens();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <View {...props} accessible accessibilityRole="header" accessibilityLabel={text} style={[{ flexDirection: "row", flexWrap: "wrap" }, style, parts?.line]}>
      {words.map((word, index) => (
        <Word key={`${word}-${index}`} index={index} delay={delay} style={[{ color: tokens.foreground, fontSize: 28, fontWeight: "600", lineHeight: 34, letterSpacing: -0.8 }, parts?.word]}>
          {word}
        </Word>
      ))}
    </View>
  );
}

export default TextReveal;
