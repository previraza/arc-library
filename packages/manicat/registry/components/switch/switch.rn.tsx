import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SwitchProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  /** Style of the outer pressable. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the switch: track, thumb or label. The React Native counterpart of `classNames`. */
  styles?: {
    track?: StyleProp<ViewStyle>;
    thumb?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
  };
}

/** Track inner width (42 - 6 padding) minus the 18px thumb. */
const size = 18;
const travel = 18;

export function Switch({ checked, defaultChecked = false, onCheckedChange, label, disabled, style, styles: parts, ...props }: SwitchProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;
  const [position] = useState(() => new Animated.Value(on ? 1 : 0));

  useEffect(() => {
    Animated.timing(position, { toValue: on ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [on, position]);

  const trackColor = position.interpolate({ inputRange: [0, 1], outputRange: [tokens.controlTrack, tokens.controlOn] });
  const thumbColor = position.interpolate({ inputRange: [0, 1], outputRange: [tokens.controlThumb, tokens.controlThumbOn] });
  const x = position.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });

  return (
    <Pressable
      {...props}
      accessibilityRole="switch"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ checked: on, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        if (checked === undefined) setInternal(!on);
        onCheckedChange?.(!on);
      }}
      style={[local.root, { minHeight: metrics.controlHeight.md, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Animated.View style={[local.track, { backgroundColor: trackColor }, parts?.track]}>
        <Animated.View style={[local.thumb, { backgroundColor: thumbColor, transform: [{ translateX: x }] }, parts?.thumb]} />
      </Animated.View>
      {label ? <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text> : null}
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], alignSelf: "flex-start" },
  track: { width: 42, height: 24, padding: 3, justifyContent: "center", borderRadius: metrics.radiusPill },
  thumb: {
    width: size,
    height: size,
    borderRadius: metrics.radiusPill,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: { fontSize: metrics.text.sm },
});

export default Switch;
