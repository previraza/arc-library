import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Avatar } from "@/registry/components/avatar/avatar.rn";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type UserStatus = "available" | "busy" | "away";

export const userStatuses: { value: UserStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "away", label: "Away" },
];

export interface UserMenuUser {
  name: string;
  email: string;
  plan?: string;
  avatarSrc?: string;
}

export interface UserMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
}

export interface UserMenuProps {
  user: UserMenuUser;
  /** Passing `status` or `onStatusChange` shows the inline status switch. */
  status?: UserStatus;
  defaultStatus?: UserStatus;
  onStatusChange?: (status: UserStatus) => void;
  /** Account destinations. Keep it to three or four. */
  items?: UserMenuItem[];
  onSignOut?: () => void | Promise<unknown>;
  /** Extend the inner, named parts of the menu: trigger, content, header, item, itemText or status. The React Native counterpart of `classNames`. */
  styles?: {
    trigger?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
    header?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    itemText?: StyleProp<TextStyle>;
    status?: StyleProp<ViewStyle>;
  };
}

export function UserMenu({ user, status, defaultStatus = "available", onStatusChange, items = [], onSignOut, styles: parts }: UserMenuProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultStatus);
  const current = status ?? internal;
  const withStatus = status !== undefined || onStatusChange !== undefined;
  const avatarStatus = current === "available" ? "online" : "offline";

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${user.name} account menu`} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={[{ alignSelf: "flex-start" }, parts?.trigger]}>
        <Avatar name={user.name} src={user.avatarSrc} status={withStatus ? avatarStatus : undefined} />
      </Pressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={local.overlay}>
          <View accessibilityRole="menu" style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            <View style={[local.header, { borderBottomColor: tokens.border }, parts?.header]}>
              <Avatar name={user.name} src={user.avatarSrc} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "600" }}>{user.name}</Text>
                <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{user.email}</Text>
              </View>
              {user.plan ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>{user.plan}</Text> : null}
            </View>
            {withStatus ? (
              <View style={[local.status, parts?.status]}>
                {userStatuses.map((entry) => (
                  <Pressable
                    key={entry.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: current === entry.value }}
                    onPress={() => {
                      if (status === undefined) setInternal(entry.value);
                      onStatusChange?.(entry.value);
                    }}
                    style={[local.chip, { borderColor: current === entry.value ? tokens.foreground : tokens.border, backgroundColor: current === entry.value ? tokens.surfaceMuted : tokens.surface }]}
                  >
                    <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }}>{entry.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {items.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                onPress={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.item]}
              >
                {item.icon}
                <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.itemText]}>{item.label}</Text>
              </Pressable>
            ))}
            {onSignOut ? (
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  setOpen(false);
                  void onSignOut();
                }}
                style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.item]}
              >
                <Text style={[{ color: tokens.danger, fontSize: metrics.text.sm }, parts?.itemText]}>Sign out</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", padding: metrics.space[3], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { borderWidth: 1, borderRadius: 26, padding: 6 },
  header: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], padding: metrics.space[3], marginBottom: 4, borderBottomWidth: 1 },
  status: { flexDirection: "row", gap: 6, padding: metrics.space[3] },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
});

export default UserMenu;
