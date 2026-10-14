// @manicat-dependencies lucide-react-native react-native-svg
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";

export interface AnnouncementAction {
  label: string;
  onClick?: () => void;
}

export interface Announcement {
  id: string;
  message: ReactNode;
  action?: AnnouncementAction;
}

export interface AnnouncementBarProps {
  messages: Announcement[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Milliseconds each message stays before the next one. */
  interval?: number;
  autoPlay?: boolean;
  /** Extend the inner, named parts of the bar: root, message, action, dots or dismiss. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    message?: StyleProp<TextStyle>;
    action?: StyleProp<TextStyle>;
    dismiss?: StyleProp<ViewStyle>;
  };
}

export function AnnouncementBar({ messages, open, defaultOpen = true, onOpenChange, interval = 6000, autoPlay = true, styles: parts }: AnnouncementBarProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultOpen);
  const [index, setIndex] = useState(0);
  const visible = open ?? internal;

  useEffect(() => {
    if (!autoPlay || messages.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % messages.length), interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, messages.length]);

  if (!visible || messages.length === 0) return null;
  const current = messages[index % messages.length];

  return (
    <View accessibilityRole="alert" style={[local.root, { backgroundColor: tokens.foreground }, parts?.root]}>
      <View style={local.copy}>
        {typeof current.message === "string" ? <Text style={[{ color: tokens.background, fontSize: metrics.text.sm }, parts?.message]}>{current.message}</Text> : current.message}
        {current.action ? (
          <Pressable accessibilityRole="link" onPress={current.action.onClick} hitSlop={6}>
            <Text style={[{ color: tokens.background, fontSize: metrics.text.sm, fontWeight: "600", textDecorationLine: "underline" }, parts?.action]}>{current.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss announcement"
        hitSlop={8}
        onPress={() => {
          if (open === undefined) setInternal(false);
          onOpenChange?.(false);
        }}
        style={parts?.dismiss}
      >
        <X size={16} strokeWidth={1.75} color={tokens.background} />
      </Pressable>
    </View>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: metrics.space[3], paddingVertical: metrics.space[3], paddingHorizontal: metrics.space[4] },
  copy: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: metrics.space[2] },
});

export default AnnouncementBar;
