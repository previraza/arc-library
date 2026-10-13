import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface PopoverProps {
  /** The element that opens the popover, usually a Button. It is wrapped in a pressable. */
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extend the inner, named parts of the popover: overlay or content. The React Native counterpart of `classNames`. */
  styles?: {
    overlay?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
  };
}

/** A small floating panel. Pressing outside it, or the Android back button, closes it. */
export function Popover({ trigger, children, open, defaultOpen = false, onOpenChange, styles: parts }: PopoverProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultOpen);
  const visible = open ?? internal;

  function change(next: boolean) {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: visible }} onPress={() => change(true)} style={local.trigger}>
        {trigger}
      </Pressable>
      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => change(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close" onPress={() => change(false)} style={[local.overlay, parts?.overlay]}>
          <Pressable onPress={() => undefined} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            {children}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  trigger: { alignSelf: "flex-start" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: metrics.space[5], backgroundColor: "rgba(10, 10, 10, 0.3)" },
  content: { width: "100%", maxWidth: 320, borderWidth: 1, borderRadius: 26, padding: metrics.space[4] },
});

export default Popover;
