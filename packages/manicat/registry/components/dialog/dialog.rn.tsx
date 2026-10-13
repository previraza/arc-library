import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface DialogProps {
  /** The element that opens the dialog, usually a Button. It is wrapped in a pressable. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extend the inner, named parts of the dialog: overlay, content, header, title, description, close or body. The React Native counterpart of `classNames`. */
  styles?: {
    overlay?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
    header?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    close?: StyleProp<ViewStyle>;
    body?: StyleProp<ViewStyle>;
  };
}

export function Dialog({ trigger, title, description, children, open, defaultOpen = false, onOpenChange, styles: parts }: DialogProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultOpen);
  const visible = open ?? internal;

  function change(next: boolean) {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  }

  return (
    <>
      {trigger ? (
        <Pressable accessibilityRole="button" onPress={() => change(true)} style={local.trigger}>
          {trigger}
        </Pressable>
      ) : null}
      {/* onRequestClose is the Android back button; the overlay handles taps outside. */}
      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => change(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close dialog" onPress={() => change(false)} style={[local.overlay, parts?.overlay]}>
          <Pressable
            accessibilityViewIsModal
            onPress={() => undefined}
            style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}
          >
            <View style={[local.header, { borderBottomColor: tokens.border }, parts?.header]}>
              <View style={local.copy}>
                <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>
                  {title}
                </Text>
                {description ? <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => change(false)}
                style={[local.close, { borderColor: tokens.border }, parts?.close]}
              >
                <Text style={{ color: tokens.textMuted, fontSize: 18, lineHeight: 20 }}>×</Text>
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
  trigger: { alignSelf: "flex-start" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.46)" },
  content: { width: "100%", maxWidth: 440, borderWidth: 1, borderRadius: 26, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: metrics.space[5], padding: metrics.space[5], borderBottomWidth: 1 },
  copy: { flex: 1, gap: metrics.space[2] },
  title: { fontSize: metrics.text.lg, fontWeight: "500" },
  description: { fontSize: metrics.text.sm },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: metrics.radiusControl },
  body: { padding: metrics.space[5] },
});

export default Dialog;
