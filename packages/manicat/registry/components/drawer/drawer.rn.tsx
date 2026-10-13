import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DrawerProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extend the inner, named parts of the drawer: overlay, panel, header, title, description or body. The React Native counterpart of `classNames`. */
  styles?: {
    overlay?: StyleProp<ViewStyle>;
    panel?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    body?: StyleProp<ViewStyle>;
  };
}

/** A panel that slides in from an edge of the screen. */
export function Drawer({ trigger, title, description, children, side = "right", open, defaultOpen = false, onOpenChange, styles: parts }: DrawerProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultOpen);
  const visible = open ?? internal;
  const horizontal = side === "left" || side === "right";

  function change(next: boolean) {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  }

  const align = { left: { alignItems: "flex-start" }, right: { alignItems: "flex-end" }, top: { justifyContent: "flex-start" }, bottom: { justifyContent: "flex-end" } }[side] as ViewStyle;

  return (
    <>
      {trigger ? (
        <Pressable accessibilityRole="button" onPress={() => change(true)} style={{ alignSelf: "flex-start" }}>
          {trigger}
        </Pressable>
      ) : null}
      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => change(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close drawer" onPress={() => change(false)} style={[local.overlay, align, parts?.overlay]}>
          <Pressable
            accessibilityViewIsModal
            onPress={() => undefined}
            style={[
              local.panel,
              horizontal ? { width: "85%", maxWidth: 380, height: "100%" } : { width: "100%", maxHeight: "70%" },
              { borderColor: tokens.border, backgroundColor: tokens.surface },
              parts?.panel,
            ]}
          >
            <View style={local.header}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text accessibilityRole="header" style={[{ color: tokens.foreground, fontSize: metrics.text.lg, fontWeight: "500" }, parts?.title]}>{title}</Text>
                {description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.sm }, parts?.description]}>{description}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => change(false)}>
                <Text style={{ color: tokens.textMuted, fontSize: 20, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
            <View style={[local.body, parts?.body]}>{children}</View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(10, 10, 10, 0.4)" },
  panel: { borderWidth: 1, padding: metrics.space[5], gap: metrics.space[4] },
  header: { flexDirection: "row", alignItems: "flex-start", gap: metrics.space[3] },
  body: { gap: metrics.space[3] },
});

export default Drawer;
