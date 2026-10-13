import { Pressable, StyleSheet, Text } from "react-native";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type Theme = "light" | "dark";

export interface ThemeSwitchProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  label?: string;
  iconOnly?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the theme switch: icon or label. The React Native counterpart of `classNames`. */
  styles?: {
    icon?: StyleProp<TextStyle>;
    label?: StyleProp<TextStyle>;
  };
}

/** The React version animates a circular reveal over the whole page; here the switch just flips the value you own. */
export function ThemeSwitch({ theme, onThemeChange, label, iconOnly = true, style, styles: parts, ...props }: ThemeSwitchProps) {
  const tokens = useTokens();
  const next: Theme = theme === "dark" ? "light" : "dark";
  const text = label ?? (theme === "dark" ? "Dark" : "Light");

  return (
    <Pressable
      {...props}
      accessibilityRole="switch"
      accessibilityLabel={`Switch to ${next} theme`}
      accessibilityState={{ checked: theme === "dark" }}
      onPress={() => onThemeChange(next)}
      style={({ pressed }) => [
        local.root,
        { minHeight: metrics.controlHeight.sm, minWidth: metrics.controlHeight.sm, borderColor: tokens.border, backgroundColor: pressed ? tokens.surfaceMuted : tokens.surface },
        style,
      ]}
    >
      <Text style={[{ color: tokens.foreground, fontSize: 16 }, parts?.icon]}>{theme === "dark" ? "☾" : "☀"}</Text>
      {iconOnly ? null : <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{text}</Text>}
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
});

export default ThemeSwitch;
