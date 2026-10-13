import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface FloatingButtonGroupAction {
  type?: "action";
  id: string;
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  shortcut?: string;
}

export interface FloatingButtonGroupSeparator {
  type: "separator";
  id?: string;
}

export type FloatingButtonGroupItem = FloatingButtonGroupAction | FloatingButtonGroupSeparator;

export interface FloatingButtonGroupProps extends Omit<ViewProps, "children"> {
  items: FloatingButtonGroupItem[];
  label: string;
  variant?: "muted" | "floating";
  size?: "sm" | "md";
  orientation?: "horizontal" | "vertical";
  iconOnly?: boolean;
  onAction?: (id: string) => void;
  /** Extend the inner, named parts of the group: button, buttonText or separator. The React Native counterpart of `classNames`. */
  styles?: {
    button?: StyleProp<ViewStyle>;
    buttonText?: StyleProp<TextStyle>;
    separator?: StyleProp<ViewStyle>;
  };
}

/** A pill of tools that floats over content, such as a canvas toolbar. */
export function FloatingButtonGroup({ items, label, variant = "muted", size = "md", orientation = "horizontal", iconOnly: groupIconOnly = false, onAction, style, styles: parts, ...props }: FloatingButtonGroupProps) {
  const tokens = useTokens();
  const vertical = orientation === "vertical";
  const height = size === "sm" ? 32 : 40;

  return (
    <View
      {...props}
      accessibilityRole="toolbar"
      accessibilityLabel={label}
      style={[
        local.root,
        { flexDirection: vertical ? "column" : "row", borderColor: tokens.border, backgroundColor: variant === "floating" ? tokens.surface : tokens.surfaceMuted },
        variant === "floating" && local.shadow,
        style,
      ]}
    >
      {items.map((item, index) => {
        if (item.type === "separator") {
          return <View key={item.id ?? `sep-${index}`} style={[vertical ? local.hr : local.vr, { backgroundColor: tokens.border }, parts?.separator]} />;
        }
        const iconOnly = groupIconOnly || item.iconOnly;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ disabled: item.disabled, selected: item.pressed }}
            disabled={item.disabled}
            onPress={() => {
              item.onSelect?.();
              onAction?.(item.id);
            }}
            style={({ pressed }) => [
              local.button,
              { minHeight: height, minWidth: iconOnly ? height : undefined, backgroundColor: item.pressed ? tokens.surface : pressed ? tokens.border : "transparent", opacity: item.disabled ? 0.45 : 1 },
              parts?.button,
            ]}
          >
            {item.icon}
            {iconOnly ? null : <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.buttonText]}>{item.label}</Text>}
            {item.shortcut && !iconOnly ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{item.shortcut}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignSelf: "flex-start", alignItems: "center", gap: 2, padding: 3, borderWidth: 1, borderRadius: 999 },
  shadow: { shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, borderRadius: 999 },
  vr: { width: 1, height: 18, marginHorizontal: 4 },
  hr: { height: 1, width: 18, marginVertical: 4 },
});

export default FloatingButtonGroup;
