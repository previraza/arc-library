import { useEffect, useState } from "react";
import { Animated, Easing } from "react-native";
import { AnimatedText } from "@/lib/rn-text";
import type { StyleProp, TextProps, TextStyle } from "react-native";

export interface TextMorphProps extends Omit<TextProps, "children"> {
  children: string;
  /** Extend the inner, named parts of the morph: glyph. The React Native counterpart of `classNames`. */
  styles?: { glyph?: StyleProp<TextStyle> };
}

/** When the text changes, the old copy leaves upward and the new one rises in, so a word swaps in place. */
export function TextMorph({ children, style, styles: parts, ...props }: TextMorphProps) {
  const [shown, setShown] = useState(children);
  const [progress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (children === shown) return;
    Animated.timing(progress, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setShown(children);
      Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, [children, shown, progress]);

  return (
    <AnimatedText
      {...props}
      accessibilityLabel={children}
      style={[style, parts?.glyph, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}
    >
      {shown}
    </AnimatedText>
  );
}

export default TextMorph;
