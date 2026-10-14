import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { AnimatedText } from "@/lib/rn-text";
import type { TextProps } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export interface TextShimmerProps extends Omit<TextProps, "children"> {
  children: string;
  /** Turn the shimmer off when the work is done. */
  active?: boolean;
  /** Seconds for one pass. */
  duration?: number;
}

/** React Native cannot clip a gradient to text, so the shimmer is a soft pulse of the text's own opacity. */
export function TextShimmer({ children, active = true, duration = 1.8, style, ...props }: TextShimmerProps) {
  const tokens = useTokens();
  const [pulse] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!active || reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: (duration * 1000) / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: (duration * 1000) / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, pulse, reduceMotion]);

  return (
    <AnimatedText {...props} accessibilityState={{ busy: active }} style={[{ color: active ? tokens.textSecondary : tokens.textMuted, opacity: pulse }, style]}>
      {children}
    </AnimatedText>
  );
}

export default TextShimmer;
