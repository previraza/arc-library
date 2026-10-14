import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabsProps extends ViewProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Extend the inner, named parts of the tabs: list, trigger, selection, label or content. The React Native counterpart of `classNames`. */
  styles?: {
    list?: StyleProp<ViewStyle>;
    trigger?: StyleProp<ViewStyle>;
    selection?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    content?: StyleProp<ViewStyle>;
  };
}

/** Unlike the web version, which is a set of parts, React Native takes the tabs as data: each item carries its own panel. */
export function Tabs({ items, value, defaultValue, onValueChange, style, styles: parts, ...props }: TabsProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal;
  const panel = items.find((item) => item.value === active);

  return (
    <View {...props} style={[{ alignSelf: "stretch" }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={local.scroll}>
        <View
          accessibilityRole="tablist"
          style={[local.list, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.list]}
        >
          {items.map((item) => {
            const selected = item.value === active;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityState={{ selected, disabled: item.disabled }}
                disabled={item.disabled}
                onPress={() => {
                  if (value === undefined) setInternal(item.value);
                  onValueChange?.(item.value);
                }}
                style={[
                  local.trigger,
                  selected && { borderColor: tokens.border, backgroundColor: tokens.surface },
                  item.disabled && { opacity: 0.5 },
                  parts?.trigger,
                  selected && parts?.selection,
                ]}
              >
                <Text style={[{ color: selected ? tokens.accentStrong : tokens.textSecondary, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {panel ? (
        <View accessibilityRole="none" style={[local.content, parts?.content]}>
          {panel.content}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  scroll: { flexGrow: 0 },
  list: { flexDirection: "row", alignItems: "center", gap: metrics.space[1], padding: metrics.space[1], borderWidth: 1, borderRadius: metrics.radiusControl },
  trigger: {
    minWidth: 88,
    minHeight: metrics.controlHeight.sm,
    paddingHorizontal: metrics.space[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: metrics.radiusControl - 3,
  },
  content: { marginTop: metrics.space[4] },
});

export default Tabs;
