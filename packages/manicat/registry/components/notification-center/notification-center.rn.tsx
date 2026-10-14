// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  read?: boolean;
  tone?: "info" | "success" | "warning";
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  label?: string;
  onReadChange?: (notification: NotificationItem, read: boolean) => void;
  onDismiss?: (notification: NotificationItem) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extend the inner, named parts of the center: trigger, badge, panel, item, title or description. The React Native counterpart of `classNames`. */
  styles?: {
    trigger?: StyleProp<ViewStyle>;
    badge?: StyleProp<ViewStyle>;
    panel?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
  };
}

/** A bell with an unread count; the list opens as a sheet from the bottom edge. */
export function NotificationCenter({ notifications: initial, label = "Notifications", onReadChange, onDismiss, open, onOpenChange, styles: parts }: NotificationCenterProps) {
  const tokens = useTokens();
  const [items, setItems] = useState(initial);
  const [internal, setInternal] = useState(false);
  const visible = open ?? internal;
  const unread = items.filter((item) => !item.read).length;

  function change(next: boolean) {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  }

  function setRead(item: NotificationItem, read: boolean) {
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read } : entry)));
    onReadChange?.(item, read);
  }

  const toneColor = (tone?: NotificationItem["tone"]) => (tone === "success" ? tokens.success : tone === "warning" ? tokens.warning : tokens.accent);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${unread ? `, ${unread} unread` : ""}`}
        onPress={() => change(true)}
        style={[local.trigger, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.trigger]}
      >
        <Text style={{ color: tokens.foreground, fontSize: 16 }}>🔔</Text>
        {unread ? (
          <View style={[local.badge, { backgroundColor: tokens.danger }, parts?.badge]}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{unread}</Text>
          </View>
        ) : null}
      </Pressable>
      <Modal transparent animationType="slide" visible={visible} onRequestClose={() => change(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close notifications" onPress={() => change(false)} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.panel, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.panel]}>
            <View style={[local.head, { borderBottomColor: tokens.border }]}>
              <Text accessibilityRole="header" style={{ flex: 1, color: tokens.foreground, fontSize: metrics.text.lg, fontWeight: "500" }}>{label}</Text>
              <Pressable accessibilityRole="button" onPress={() => items.filter((item) => !item.read).forEach((item) => setRead(item, true))}>
                <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>Mark all read</Text>
              </Pressable>
            </View>
            <ScrollView>
              {items.length === 0 ? <Text style={{ padding: metrics.space[5], textAlign: "center", color: tokens.textMuted, fontSize: metrics.text.sm }}>You&apos;re all caught up.</Text> : null}
              {items.map((item) => (
                <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: !item.read }} onPress={() => setRead(item, !item.read)} style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.item]}>
                  <View style={[local.dot, { backgroundColor: item.read ? "transparent" : toneColor(item.tone) }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: item.read ? "400" : "600" }, parts?.title]}>{item.title}</Text>
                    {item.description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.description]}>{item.description}</Text> : null}
                    <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{item.time}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Dismiss ${item.title}`}
                    hitSlop={8}
                    onPress={() => {
                      setItems((current) => current.filter((entry) => entry.id !== item.id));
                      onDismiss?.(item);
                    }}
                  >
                    <X size={16} strokeWidth={1.75} color={tokens.textMuted} />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  trigger: { alignSelf: "flex-start", width: metrics.controlHeight.sm + 4, height: metrics.controlHeight.sm + 4, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: metrics.radiusControl },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10, 10, 10, 0.4)" },
  panel: { maxHeight: "75%", borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "center", padding: metrics.space[4], borderBottomWidth: 1 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: metrics.space[3], padding: metrics.space[4] },
  dot: { width: 8, height: 8, marginTop: 6, borderRadius: 4 },
});

export default NotificationCenter;
