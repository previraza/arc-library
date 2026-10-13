import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface BottomSheetProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeLabel?: string;
  /** Extend the inner, named parts of the sheet: overlay, sheet, handle, header, title, description or body. The React Native counterpart of `classNames`. */
  styles?: {
    overlay?: StyleProp<ViewStyle>;
    sheet?: StyleProp<ViewStyle>;
    handle?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    body?: StyleProp<ViewStyle>;
  };
}

/** Rises from the bottom edge. Press the dim area, the handle or the back button to close. */
export function BottomSheet({ trigger, title, description, children, open, defaultOpen = false, onOpenChange, closeLabel = "Close", styles: parts }: BottomSheetProps) {
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
        <Pressable accessibilityRole="button" onPress={() => change(true)}>
          {trigger}
        </Pressable>
      ) : null}
      <Modal transparent animationType="slide" visible={visible} onRequestClose={() => change(false)} statusBarTranslucent>
        <Pressable accessibilityLabel={closeLabel} onPress={() => change(false)} style={[local.overlay, parts?.overlay]}>
          <Pressable accessibilityViewIsModal onPress={() => undefined} style={[local.sheet, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.sheet]}>
            <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={() => change(false)} style={local.handleHit}>
              <View style={[local.handle, { backgroundColor: tokens.borderStrong }, parts?.handle]} />
            </Pressable>
            <View style={local.header}>
              <Text accessibilityRole="header" style={[{ color: tokens.foreground, fontSize: metrics.text.lg, fontWeight: "500" }, parts?.title]}>{title}</Text>
              {description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.sm }, parts?.description]}>{description}</Text> : null}
            </View>
            <View style={[local.body, parts?.body]}>{children}</View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10, 10, 10, 0.4)" },
  sheet: { borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: metrics.space[5] },
  handleHit: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: { gap: 4, paddingHorizontal: metrics.space[5], paddingBottom: metrics.space[3] },
  body: { gap: metrics.space[3], paddingHorizontal: metrics.space[5] },
});

export default BottomSheet;
