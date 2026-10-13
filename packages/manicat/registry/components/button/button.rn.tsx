import { useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
  /** Style of the outer pressable. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the button: root, label or spinner. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    spinner?: StyleProp<ViewStyle>;
  };
}

/** Icon-sized buttons press a little deeper than wide ones, so every size reads as the same push. */
const pressedScale: Record<ButtonSize, number> = { sm: 0.96, md: 0.97, lg: 0.985 };

export function Button({ variant = "primary", size = "md", loading = false, disabled, children, style, styles: parts, onPress, onPressIn, onPressOut, ...props }: ButtonProps) {
  const tokens = useTokens();
  const [scale] = useState(() => new Animated.Value(1));
  const inert = Boolean(disabled) || loading;

  const palette = {
    primary: { text: tokens.background, background: tokens.foreground, border: tokens.foreground, pressed: tokens.foreground },
    secondary: { text: tokens.foreground, background: tokens.surface, border: tokens.border, pressed: tokens.surfaceMuted },
    ghost: { text: tokens.textSecondary, background: "transparent", border: "transparent", pressed: tokens.surfaceMuted },
    danger: { text: tokens.danger, background: tokens.surface, border: tokens.border, pressed: tokens.surfaceMuted },
  }[variant];

  function spring(to: number) {
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }], alignSelf: "flex-start" }, style]}>
      <Pressable
        {...props}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled), busy: loading }}
        disabled={disabled}
        // Loading keeps the button focusable (a disabled one drops focus mid-action) and swallows presses instead.
        onPress={loading ? undefined : onPress}
        onPressIn={(event) => {
          if (!inert) spring(pressedScale[size]);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          spring(1);
          onPressOut?.(event);
        }}
        style={({ pressed }) => [
          local.root,
          {
            minHeight: metrics.controlHeight[size],
            paddingHorizontal: size === "sm" ? metrics.space[3] : size === "lg" ? metrics.space[5] : metrics.space[4],
            borderRadius: metrics.radiusControl,
            borderColor: palette.border,
            backgroundColor: pressed && !inert ? palette.pressed : palette.background,
            opacity: disabled ? 0.52 : pressed && variant === "primary" && !inert ? 0.84 : 1,
          },
          parts?.root,
        ]}
      >
        <Text style={[local.label, { color: palette.text, opacity: loading ? 0 : 1 }, parts?.label]} numberOfLines={1}>
          {children}
        </Text>
        {loading ? (
          <View style={[StyleSheet.absoluteFill, local.spinner, parts?.spinner]} pointerEvents="none">
            <ActivityIndicator size="small" color={palette.text} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const local = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", flexDirection: "row", borderWidth: 1 },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  spinner: { alignItems: "center", justifyContent: "center" },
});

export default Button;
