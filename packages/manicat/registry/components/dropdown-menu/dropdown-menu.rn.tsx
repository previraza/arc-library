import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DropdownItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
}

export interface DropdownMenuProps {
  /** Accessible name of the trigger and the menu. */
  label: string;
  items: DropdownItem[];
  /** Icon shown in the trigger. Without it the trigger shows the label. */
  icon?: ReactNode;
  /** Extend the inner, named parts of the menu: trigger, content, item, itemText or separator. The React Native counterpart of `classNames`. */
  styles?: {
    trigger?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    itemText?: StyleProp<TextStyle>;
    separator?: StyleProp<ViewStyle>;
  };
}

/** On a phone the menu opens as a sheet from the bottom edge, which is where a thumb reaches. */
export function DropdownMenu({ label, items, icon, styles: parts }: DropdownMenuProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          local.trigger,
          { borderColor: open || pressed ? tokens.borderStrong : tokens.border, backgroundColor: open || pressed ? tokens.surfaceMuted : tokens.surface },
          parts?.trigger,
        ]}
      >
        {icon ?? <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>}
      </Pressable>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={local.overlay}>
          <View accessibilityRole="menu" accessibilityLabel={label} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            {items.map((item, index) => (
              <View key={`${item.label}-${index}`}>
                {item.separatorBefore ? <View style={[local.separator, { backgroundColor: tokens.border }, parts?.separator]} /> : null}
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: item.disabled }}
                  disabled={item.disabled}
                  onPress={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: item.disabled ? 0.45 : 1 }, parts?.item]}
                >
                  {item.icon}
                  <Text style={[{ color: item.destructive ? tokens.danger : tokens.foreground, fontSize: metrics.text.sm }, parts?.itemText]}>{item.label}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  trigger: { alignSelf: "flex-start", minHeight: metrics.controlHeight.sm, minWidth: metrics.controlHeight.sm, paddingHorizontal: metrics.space[3], flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: metrics.radiusControl },
  overlay: { flex: 1, justifyContent: "flex-end", padding: metrics.space[3], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { borderWidth: 1, borderRadius: 26, padding: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
  separator: { height: 1, marginVertical: 4, marginHorizontal: metrics.space[2] },
});

export default DropdownMenu;
