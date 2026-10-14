import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Text } from "@/lib/rn-text";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ActionButtonProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  label: string;
  successLabel?: string;
  pendingLabel?: string;
  /** Runs when pressed. A promise drives the pending and success states. */
  onAction: () => void | Promise<void>;
  /** Milliseconds the success state shows before the button returns to idle. */
  resetAfterMs?: number;
  onActionError?: (error: unknown) => void;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the action button: label or spinner. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
  };
}

type Phase = "idle" | "pending" | "success";

export function ActionButton({ label, successLabel = "Done", pendingLabel, onAction, resetAfterMs = 1600, onActionError, disabled, style, styles: parts, ...props }: ActionButtonProps) {
  const tokens = useTokens();
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function press() {
    if (phase !== "idle") return;
    setPhase("pending");
    try {
      await onAction();
      setPhase("success");
      timer.current = setTimeout(() => setPhase("idle"), resetAfterMs);
    } catch (error) {
      setPhase("idle");
      onActionError?.(error);
    }
  }

  const color = phase === "success" ? tokens.success : tokens.background;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ busy: phase === "pending", disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={press}
      style={({ pressed }) => [
        local.root,
        { minHeight: metrics.controlHeight.md, borderColor: phase === "success" ? tokens.success : tokens.foreground, backgroundColor: phase === "success" ? tokens.surface : tokens.foreground, opacity: disabled ? 0.52 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {phase === "pending" ? <ActivityIndicator size="small" color={color} /> : null}
      <Text style={[{ color, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>
        {phase === "success" ? `✓ ${successLabel}` : phase === "pending" ? (pendingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "flex-start", gap: 8, paddingHorizontal: metrics.space[4], borderWidth: 1, borderRadius: metrics.radiusControl },
});

export default ActionButton;
