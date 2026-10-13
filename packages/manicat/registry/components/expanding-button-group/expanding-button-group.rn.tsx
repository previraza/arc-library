import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ExpandingButtonGroupItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Return false to cancel the confirmation. A promise keeps the button pending. */
  onSelect?: () => void | boolean | Promise<void | boolean>;
  /** Shown briefly after the action succeeds, such as "Archived". */
  doneLabel?: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
}

export interface ExpandingButtonGroupProps extends Omit<ViewProps, "children"> {
  items: readonly ExpandingButtonGroupItem[];
  label: string;
  size?: "sm" | "md";
  onAction?: (id: string) => void;
  /** Milliseconds the done label shows. */
  confirmDuration?: number;
  /** Extend the inner, named parts of the group: button or buttonText. The React Native counterpart of `classNames`. */
  styles?: {
    button?: StyleProp<ViewStyle>;
    buttonText?: StyleProp<TextStyle>;
  };
}

/** Icon buttons: the first press expands one to show what it does, the second runs it. */
export function ExpandingButtonGroup({ items, label, size = "md", onAction, confirmDuration = 1400, style, styles: parts, ...props }: ExpandingButtonGroupProps) {
  const tokens = useTokens();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const height = size === "sm" ? 32 : 40;

  useEffect(() => () => clearTimeout(timer.current), []);

  async function press(item: ExpandingButtonGroupItem) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expanded !== item.id) return setExpanded(item.id);
    const result = await item.onSelect?.();
    if (result === false) return setExpanded(null);
    onAction?.(item.id);
    setDone(item.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDone(null);
      setExpanded(null);
    }, confirmDuration);
  }

  return (
    <View {...props} accessibilityRole="toolbar" accessibilityLabel={label} style={[local.root, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, style]}>
      {items.map((item) => {
        const open = expanded === item.id;
        const danger = item.tone === "danger";
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ expanded: open, disabled: item.disabled }}
            disabled={item.disabled}
            onPress={() => press(item)}
            style={[local.button, { height, minWidth: height, backgroundColor: open ? tokens.surface : "transparent" }, parts?.button]}
          >
            {item.icon}
            {open ? <Text style={[{ color: danger ? tokens.danger : tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.buttonText]}>{done === item.id ? (item.doneLabel ?? item.label) : item.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignSelf: "flex-start", gap: 2, padding: 3, borderWidth: 1, borderRadius: 999 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 10, borderRadius: 999 },
});

export default ExpandingButtonGroup;
