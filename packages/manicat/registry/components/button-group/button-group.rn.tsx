// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { ChevronDown } from "lucide-react-native";

export type ButtonGroupVariant = "outline" | "solid";
export type ButtonGroupSize = "sm" | "md";

export interface ButtonGroupItem {
  id: string;
  /** Visible text and the accessible name. */
  label: string;
  icon?: ReactNode;
  /** Shows only the icon; the label stays the accessible name. */
  iconOnly?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface ButtonGroupMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface ButtonGroupMenu {
  /** Accessible name of the chevron segment, such as "More actions". */
  label: string;
  items: ButtonGroupMenuItem[];
}

export interface ButtonGroupProps extends Omit<ViewProps, "children"> {
  items: ButtonGroupItem[];
  menu?: ButtonGroupMenu;
  label: string;
  variant?: ButtonGroupVariant;
  size?: ButtonGroupSize;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  /** Extend the inner, named parts of the group: segment, segmentText or menuContent. The React Native counterpart of `classNames`. */
  styles?: {
    segment?: StyleProp<ViewStyle>;
    segmentText?: StyleProp<TextStyle>;
    menuContent?: StyleProp<ViewStyle>;
  };
}

/** Joined actions that share one edge. The overflow menu opens as a sheet from the bottom. */
export function ButtonGroup({ items, menu, label, variant = "outline", size = "md", orientation = "horizontal", disabled = false, style, styles: parts, ...props }: ButtonGroupProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const solid = variant === "solid";
  const height = size === "sm" ? metrics.controlHeight.sm : metrics.controlHeight.md;
  const vertical = orientation === "vertical";
  const segments = [...items.map((item) => ({ kind: "item" as const, item })), ...(menu ? [{ kind: "menu" as const, item: menu }] : [])];

  return (
    <View {...props} accessibilityRole="toolbar" accessibilityLabel={label} style={[{ flexDirection: vertical ? "column" : "row", alignSelf: "flex-start" }, style]}>
      {segments.map((segment, index) => {
        const first = index === 0;
        const last = index === segments.length - 1;
        const radius = metrics.radiusControl;
        const corners: ViewStyle = vertical
          ? { borderTopLeftRadius: first ? radius : 0, borderTopRightRadius: first ? radius : 0, borderBottomLeftRadius: last ? radius : 0, borderBottomRightRadius: last ? radius : 0, marginTop: first ? 0 : -1 }
          : { borderTopLeftRadius: first ? radius : 0, borderBottomLeftRadius: first ? radius : 0, borderTopRightRadius: last ? radius : 0, borderBottomRightRadius: last ? radius : 0, marginLeft: first ? 0 : -1 };
        const isMenu = segment.kind === "menu";
        const off = disabled || (!isMenu && (segment.item as ButtonGroupItem).disabled);
        const item = segment.item as ButtonGroupItem;

        return (
          <Pressable
            key={isMenu ? "menu" : item.id}
            accessibilityRole="button"
            accessibilityLabel={isMenu ? menu!.label : item.label}
            accessibilityState={{ disabled: Boolean(off), expanded: isMenu ? open : undefined }}
            disabled={off}
            onPress={() => (isMenu ? setOpen(true) : item.onSelect?.())}
            style={({ pressed }) => [
              local.segment,
              corners,
              {
                minHeight: height,
                minWidth: isMenu || item.iconOnly ? height : undefined,
                borderColor: solid ? tokens.foreground : tokens.border,
                backgroundColor: solid ? tokens.foreground : pressed ? tokens.surfaceMuted : tokens.surface,
                opacity: off ? 0.5 : solid && pressed ? 0.85 : 1,
              },
              parts?.segment,
            ]}
          >
            {isMenu ? (
              <ChevronDown size={16} strokeWidth={1.75} color={solid ? tokens.background : tokens.textSecondary} />
            ) : (
              <>
                {item.icon}
                {item.iconOnly ? null : <Text style={[{ color: solid ? tokens.background : tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.segmentText]}>{item.label}</Text>}
              </>
            )}
          </Pressable>
        );
      })}
      {menu ? (
        <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
          <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={local.overlay}>
            <View accessibilityRole="menu" accessibilityLabel={menu.label} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.menuContent]}>
              {menu.items.map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: entry.disabled }}
                  disabled={entry.disabled}
                  onPress={() => {
                    setOpen(false);
                    entry.onSelect?.();
                  }}
                  style={({ pressed }) => [local.menuItem, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: entry.disabled ? 0.45 : 1 }]}
                >
                  {entry.icon}
                  <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm }}>{entry.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  segment: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: metrics.space[3], borderWidth: 1 },
  overlay: { flex: 1, justifyContent: "flex-end", padding: metrics.space[3], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { borderWidth: 1, borderRadius: 26, padding: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
});

export default ButtonGroup;
