import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface CopyButtonProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  value: string;
  label?: string;
  /**
   * Writes the text to the clipboard. React Native has no built-in clipboard, so pass the one your app uses, for example
   * `(text) => Clipboard.setStringAsync(text)` from expo-clipboard.
   */
  copy: (value: string) => void | Promise<unknown>;
  iconOnly?: boolean;
  variant?: "outline" | "plain";
  onCopied?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the copy button: icon or label. The React Native counterpart of `classNames`. */
  styles?: {
    icon?: StyleProp<TextStyle>;
    label?: StyleProp<TextStyle>;
  };
}

export function CopyButton({ value, label = "Copy", copy, iconOnly = false, variant = "outline", disabled, onCopied, style, styles: parts, ...props }: CopyButtonProps) {
  const tokens = useTokens();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function onPress() {
    try {
      await copy(value);
      setCopied(true);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={copied ? "Copied" : label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        local.root,
        {
          minHeight: metrics.controlHeight.sm,
          borderColor: variant === "outline" ? tokens.border : "transparent",
          backgroundColor: pressed ? tokens.surfaceMuted : variant === "outline" ? tokens.surface : "transparent",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={[{ color: copied ? tokens.success : tokens.textSecondary, fontSize: 14 }, parts?.icon]}>{copied ? "✓" : "⧉"}</Text>
      {iconOnly ? null : <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{copied ? "Copied" : label}</Text>}
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
});

export default CopyButton;
