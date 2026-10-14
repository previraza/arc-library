// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { ChevronDown } from "lucide-react-native";

export interface SplitButtonAction {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface SplitButtonProps {
  label: string;
  actions: SplitButtonAction[];
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  /** Extend the inner, named parts of the split button: main, toggle, label, content or item. The React Native counterpart of `classNames`. */
  styles?: {
    main?: StyleProp<ViewStyle>;
    toggle?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    content?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
  };
}

/** One default action and a few close variants behind the chevron, which opens as a sheet. */
export function SplitButton({ label, actions, onClick, disabled, variant = "primary", styles: parts }: SplitButtonProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const primary = variant === "primary";
  const background = primary ? tokens.foreground : tokens.surface;
  const color = primary ? tokens.background : tokens.foreground;
  const edge = primary ? tokens.foreground : tokens.border;

  return (
    <>
      <View style={[local.group, { opacity: disabled ? 0.52 : 1 }]}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onClick}
          style={({ pressed }) => [local.main, { minHeight: metrics.controlHeight.md, borderColor: edge, backgroundColor: background, opacity: pressed ? 0.85 : 1 }, parts?.main]}
        >
          <Text style={[{ color, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{label}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} options`}
          accessibilityState={{ expanded: open }}
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [local.toggle, { minHeight: metrics.controlHeight.md, borderColor: edge, backgroundColor: background, opacity: pressed ? 0.85 : 1 }, parts?.toggle]}
        >
          <ChevronDown size={16} strokeWidth={1.75} color={color} />
        </Pressable>
      </View>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={local.overlay}>
          <View accessibilityRole="menu" style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            {actions.map((action, index) => (
              <Pressable
                key={`${action.label}-${index}`}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: action.disabled }}
                disabled={action.disabled}
                onPress={() => {
                  setOpen(false);
                  action.onSelect?.();
                }}
                style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: action.disabled ? 0.45 : 1 }, parts?.item]}
              >
                {action.icon}
                <Text style={{ color: action.destructive ? tokens.danger : tokens.foreground, fontSize: metrics.text.sm }}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  group: { flexDirection: "row", alignSelf: "flex-start" },
  main: { paddingHorizontal: metrics.space[4], alignItems: "center", justifyContent: "center", borderWidth: 1, borderTopLeftRadius: metrics.radiusControl, borderBottomLeftRadius: metrics.radiusControl },
  toggle: { width: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderLeftWidth: 0, borderTopRightRadius: metrics.radiusControl, borderBottomRightRadius: metrics.radiusControl },
  overlay: { flex: 1, justifyContent: "flex-end", padding: metrics.space[3], backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { borderWidth: 1, borderRadius: 26, padding: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
});

export default SplitButton;
