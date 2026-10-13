import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ToastProps {
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Milliseconds before it closes itself. Pass 0 to keep it until dismissed. */
  duration?: number;
  /** Extend the inner, named parts of the toast: root, title, description or close. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    close?: StyleProp<ViewStyle>;
  };
}

/** Place it near the end of your screen component: it floats over the bottom edge, above the home indicator. */
export function Toast({ title, description, open = true, onOpenChange, duration = 4500, styles: parts }: ToastProps) {
  const tokens = useTokens();
  // Stays mounted while it animates out: `exiting` is set the render `open` turns false, and cleared when the exit finishes.
  const [exiting, setExiting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setExiting(!open);
  }
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));

  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: open ? 1 : 0, duration: open ? 280 : 160, easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad), useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished && !open) setExiting(false);
    });
    return () => animation.stop();
  }, [open, progress]);

  useEffect(() => {
    if (!open || !duration) return;
    const timer = setTimeout(() => onOpenChange?.(false), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onOpenChange]);

  if (!open && !exiting) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[local.wrap, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
    >
      <View accessibilityRole="alert" style={[local.toast, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.root]}>
        <View style={local.copy}>
          <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.title]}>{title}</Text>
          {description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.description]}>{description}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={() => onOpenChange?.(false)} style={parts?.close}>
          <Text style={{ color: tokens.textMuted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const local = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 24, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], maxWidth: 420, width: "100%", paddingVertical: metrics.space[3], paddingHorizontal: metrics.space[4], borderWidth: 1, borderRadius: metrics.radiusControl, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  copy: { flex: 1, gap: 2 },
});

export default Toast;
