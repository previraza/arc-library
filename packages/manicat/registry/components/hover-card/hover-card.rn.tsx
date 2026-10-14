import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface HoverCardProps {
  children: ReactNode;
  content: ReactNode;
  /** Extend the inner, named parts of the card: overlay or card. The React Native counterpart of `classNames`. */
  styles?: {
    overlay?: StyleProp<ViewStyle>;
    card?: StyleProp<ViewStyle>;
  };
}

/** There is no hover on a phone, so a press on the trigger opens the card as a small floating panel. */
export function HoverCard({ children, content, styles: parts }: HoverCardProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={{ alignSelf: "flex-start" }}>
        {children}
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close" onPress={() => setOpen(false)} style={[local.overlay, parts?.overlay]}>
          <Pressable onPress={() => undefined} style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.card]}>
            {content}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export interface HoverCardProfileProps {
  name: string;
  role?: string;
  bio?: string;
  stats?: { label: string; value: string }[];
  meta?: string;
}

/** A ready-made profile body for the card. */
export function HoverCardProfile({ name, role, bio, stats = [], meta }: HoverCardProfileProps) {
  const tokens = useTokens();

  return (
    <View style={{ gap: metrics.space[2] }}>
      <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "600" }}>{name}</Text>
      {role ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>{role}</Text> : null}
      {bio ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>{bio}</Text> : null}
      {stats.length ? (
        <View style={{ flexDirection: "row", gap: metrics.space[4] }}>
          {stats.map((stat) => (
            <Text key={stat.label} style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>
              <Text style={{ color: tokens.foreground, fontWeight: "600" }}>{stat.value}</Text> {stat.label}
            </Text>
          ))}
        </View>
      ) : null}
      {meta ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{meta}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.3)" },
  card: { width: "100%", maxWidth: 320, borderWidth: 1, borderRadius: 26, padding: metrics.space[4] },
});

export default HoverCard;
