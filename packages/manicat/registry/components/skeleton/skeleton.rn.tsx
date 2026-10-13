import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SkeletonProps extends Omit<ViewProps, "children"> {
  /** Accessible name announced while loading. */
  label?: string;
  lines?: number;
  avatar?: boolean;
  /** Shown instead of the placeholder once `loading` is false. */
  children?: ReactNode;
  loading?: boolean;
  /** Extend the inner, named parts of the skeleton: avatar, lines or line. The React Native counterpart of `classNames`. */
  styles?: {
    avatar?: StyleProp<ViewStyle>;
    lines?: StyleProp<ViewStyle>;
    line?: StyleProp<ViewStyle>;
  };
}

export function Skeleton({ label = "Loading", lines = 3, avatar = false, children, loading = true, style, styles: parts, ...props }: SkeletonProps) {
  const tokens = useTokens();
  const [pulse] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // A calm, finite pulse that rests after about 20 seconds, like the web version.
  useEffect(() => {
    if (!loading || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.52, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      { iterations: 11 },
    );
    loop.start();
    return () => loop.stop();
  }, [loading, reduceMotion, pulse]);

  if (!loading && children !== undefined) return <>{children}</>;

  const fill = `${tokens.borderStrong}61`;
  const bar = { backgroundColor: fill, opacity: pulse, borderRadius: metrics.radiusControl };

  return (
    <View {...props} accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={[local.root, style]}>
      {avatar ? <Animated.View style={[bar, local.avatar, parts?.avatar]} /> : null}
      <View style={[local.lines, parts?.lines]}>
        {Array.from({ length: lines }, (_, index) => (
          <Animated.View
            key={index}
            style={[
              bar,
              local.line,
              // First line is a heading, last is short, like text that ends mid-line.
              { width: index === 0 ? "48%" : index === lines - 1 ? "72%" : "100%", height: index === 0 ? metrics.space[4] : metrics.space[3] },
              parts?.line,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "flex-start", gap: metrics.space[4], alignSelf: "stretch" },
  avatar: { width: metrics.controlHeight.md, height: metrics.controlHeight.md, borderRadius: metrics.radiusPill },
  lines: { flex: 1, gap: metrics.space[3], paddingTop: metrics.space[1] },
  line: {},
});

export default Skeleton;
