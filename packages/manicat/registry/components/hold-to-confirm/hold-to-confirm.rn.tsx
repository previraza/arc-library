import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface HoldToConfirmProps {
  label: string;
  confirmedLabel?: string;
  onConfirm: () => void;
  /** Milliseconds the press must last. */
  duration?: number;
  tone?: "accent" | "danger" | "neutral";
  confirmed?: boolean;
  onHoldChange?: (holding: boolean) => void;
  disabled?: boolean;
  /** Extend the inner, named parts of the button: fill or label. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    fill?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
  };
}

/** Press and hold; a fill sweeps across, and the action fires only when it completes. Letting go early rewinds it. */
export function HoldToConfirm({ label, confirmedLabel = "Done", onConfirm, duration = 1200, tone = "accent", confirmed, onHoldChange, disabled, styles: parts }: HoldToConfirmProps) {
  const tokens = useTokens();
  const [progress] = useState(() => new Animated.Value(0));
  const [done, setDone] = useState(false);
  const holding = useRef(false);
  const finished = confirmed ?? done;
  const color = tone === "danger" ? tokens.danger : tone === "neutral" ? tokens.textSecondary : tokens.accent;

  // A controlled `confirmed` of false rewinds the fill; the internal flag is ignored while the prop is given.
  useEffect(() => {
    if (confirmed === false) progress.setValue(0);
  }, [confirmed, progress]);

  function start() {
    if (disabled || finished) return;
    holding.current = true;
    onHoldChange?.(true);
    Animated.timing(progress, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: false }).start(({ finished: complete }) => {
      if (!complete || !holding.current) return;
      holding.current = false;
      setDone(true);
      onHoldChange?.(false);
      onConfirm();
    });
  }

  function cancel() {
    if (!holding.current) return;
    holding.current = false;
    onHoldChange?.(false);
    Animated.timing(progress, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={finished ? confirmedLabel : `${label}, press and hold`}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPressIn={start}
      onPressOut={cancel}
      style={[local.root, { minHeight: metrics.controlHeight.md, borderColor: finished ? color : tokens.border, backgroundColor: tokens.surface, opacity: disabled ? 0.52 : 1 }, parts?.root]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }), backgroundColor: `${color}26` }, parts?.fill]}
      />
      <View style={local.content}>
        <Text style={[{ color: finished ? color : tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{finished ? confirmedLabel : label}</Text>
      </View>
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { alignSelf: "flex-start", overflow: "hidden", borderWidth: 1, borderRadius: metrics.radiusControl, paddingHorizontal: metrics.space[4], justifyContent: "center" },
  content: { alignItems: "center", justifyContent: "center" },
});

export default HoldToConfirm;
