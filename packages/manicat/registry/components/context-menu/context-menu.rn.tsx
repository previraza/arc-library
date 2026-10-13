import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  checked?: boolean;
}

export interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  label?: string;
  /** Extend the inner, named parts of the menu: content, item or itemText. The React Native counterpart of `classNames`. */
  styles?: {
    content?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    itemText?: StyleProp<TextStyle>;
  };
}

/** A long press on the content opens the menu as a sheet from the bottom edge. */
export function ContextMenu({ children, items, label = "Context menu", styles: parts }: ContextMenuProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable accessibilityHint="Long press for more actions" onLongPress={() => setOpen(true)} delayLongPress={380}>
        {children}
      </Pressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={local.overlay}>
          <View accessibilityRole="menu" accessibilityLabel={label} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: item.disabled, checked: item.checked }}
                disabled={item.disabled}
                onPress={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: item.disabled ? 0.45 : 1 }, parts?.item]}
              >
                {item.icon}
                <Text style={[{ flex: 1, color: item.destructive ? tokens.danger : tokens.foreground, fontSize: metrics.text.sm }, parts?.itemText]}>{item.label}</Text>
                {item.checked ? <Text style={{ color: tokens.foreground }}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", padding: metrics.space[3], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { borderWidth: 1, borderRadius: 26, padding: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
});

export default ContextMenu;
