import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";

export interface ConfirmMorphProps {
  label: ReactNode;
  icon?: ReactNode;
  prompt?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  doneLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  undoLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm?: () => void | Promise<unknown>;
  onUndo?: () => void | Promise<unknown>;
  onCancel?: () => void;
  /** Milliseconds the confirmation waits before backing out on its own. */
  confirmTimeout?: number;
  /** Milliseconds the result shows before returning to idle. */
  resultTimeout?: number;
  disabled?: boolean;
  /** Extend the inner, named parts of the button: root, label or action. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    label?: StyleProp<TextStyle>;
    action?: StyleProp<ViewStyle>;
  };
}

/** One control that walks through idle → confirm → pending → done (with undo) or error (with retry). */
export function ConfirmMorph({
  label,
  icon,
  prompt = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Working…",
  doneLabel = "Done",
  errorLabel = "Something went wrong",
  retryLabel = "Retry",
  undoLabel = "Undo",
  tone = "neutral",
  onConfirm,
  onUndo,
  onCancel,
  confirmTimeout = 5000,
  resultTimeout = 4000,
  disabled = false,
  styles: parts,
}: ConfirmMorphProps) {
  const tokens = useTokens();
  const [state, setState] = useState<ConfirmMorphState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accent = tone === "danger" ? tokens.danger : tokens.foreground;

  function go(next: ConfirmMorphState) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState(next);
  }

  useEffect(() => {
    clearTimeout(timer.current);
    if (state === "confirming") timer.current = setTimeout(() => go("idle"), confirmTimeout);
    if (state === "done" || state === "error") timer.current = setTimeout(() => go("idle"), resultTimeout);
    return () => clearTimeout(timer.current);
  }, [state, confirmTimeout, resultTimeout]);

  async function confirm() {
    go("pending");
    try {
      await onConfirm?.();
      go("done");
    } catch {
      go("error");
    }
  }

  async function undo() {
    go("pending");
    try {
      await onUndo?.();
      go("idle");
    } catch {
      go("error");
    }
  }

  const small = (text: string, onPress: () => void, strong = false) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [local.action, { backgroundColor: strong ? accent : pressed ? tokens.surfaceMuted : "transparent", borderColor: strong ? accent : tokens.border }, parts?.action]}>
      <Text style={{ color: strong ? tokens.background : tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }}>{text}</Text>
    </Pressable>
  );

  return (
    <View accessibilityLiveRegion="polite" style={[local.root, { minHeight: metrics.controlHeight.md, borderColor: state === "error" ? tokens.danger : tokens.border, backgroundColor: tokens.surface, opacity: disabled ? 0.5 : 1 }, parts?.root]}>
      {state === "idle" ? (
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => go("confirming")} style={local.row}>
          {icon}
          {typeof label === "string" ? <Text style={[{ color: accent, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{label}</Text> : label}
        </Pressable>
      ) : null}
      {state === "confirming" ? (
        <View style={local.row}>
          <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm }}>{prompt}</Text>
          {small(cancelLabel, () => (go("idle"), onCancel?.()))}
          {small(confirmLabel, confirm, true)}
        </View>
      ) : null}
      {state === "pending" ? (
        <View style={local.row}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>{pendingLabel}</Text>
        </View>
      ) : null}
      {state === "done" ? (
        <View style={local.row}>
          <Text style={{ color: tokens.success, fontSize: metrics.text.sm, fontWeight: "500" }}>✓ {doneLabel}</Text>
          {onUndo ? small(undoLabel, undo) : null}
        </View>
      ) : null}
      {state === "error" ? (
        <View style={local.row}>
          <Text style={{ color: tokens.danger, fontSize: metrics.text.sm }}>{errorLabel}</Text>
          {small(retryLabel, confirm)}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignSelf: "flex-start", justifyContent: "center", paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  row: { flexDirection: "row", alignItems: "center", gap: metrics.space[2] },
  action: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderRadius: 999 },
});

export default ConfirmMorph;
