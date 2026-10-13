import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface SwipeAction {
  label: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "danger";
  onSelect: () => void;
  /** Keep the row in place after the action runs instead of closing it away. */
  keepRow?: boolean;
}

export interface SwipeActionsProps extends ViewProps {
  label: string;
}

/** A list container for swipeable rows. */
export function SwipeActions({ label, children, style, ...props }: SwipeActionsProps) {
  return (
    <View {...props} accessibilityRole="list" accessibilityLabel={label} style={[{ alignSelf: "stretch" }, style]}>
      {children}
    </View>
  );
}

export interface SwipeActionsRowProps {
  label: string;
  leading?: SwipeAction[];
  trailing?: SwipeAction[];
  children: ReactNode;
  /** Extend the inner, named parts of the row: row, action or actionText. The React Native counterpart of `classNames`. */
  styles?: {
    row?: StyleProp<ViewStyle>;
    action?: StyleProp<ViewStyle>;
    actionText?: StyleProp<TextStyle>;
  };
}

const WIDTH = 84;

/** Drag the row sideways to reveal actions. Each action is also a plain button in the accessibility actions, so it isn't gesture-only. */
export function SwipeActionsRow({ label, leading = [], trailing = [], children, styles: parts }: SwipeActionsRowProps) {
  const tokens = useTokens();
  const [x] = useState(() => new Animated.Value(0));
  const [open, setOpen] = useState<"leading" | "trailing" | null>(null);
  const maxLeft = leading.length * WIDTH;
  const maxRight = trailing.length * WIDTH;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => x.setValue(Math.max(-maxRight, Math.min(maxLeft, g.dx))),
        onPanResponderRelease: (_, g) => {
          const target = g.dx > WIDTH / 2 && maxLeft ? maxLeft : g.dx < -WIDTH / 2 && maxRight ? -maxRight : 0;
          setOpen(target > 0 ? "leading" : target < 0 ? "trailing" : null);
          Animated.spring(x, { toValue: target, useNativeDriver: false, bounciness: 0 }).start();
        },
      }),
    [x, maxLeft, maxRight],
  );

  function close() {
    setOpen(null);
    Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
  }

  const color = (tone: SwipeAction["tone"]) => (tone === "danger" ? tokens.danger : tone === "accent" ? tokens.accent : tokens.textSecondary);
  const accessibilityActions = [...leading, ...trailing].map((action) => ({ name: action.label, label: action.label }));

  const strip = (actions: SwipeAction[], side: "left" | "right") => (
    <View style={[local.strip, side === "left" ? { left: 0 } : { right: 0 }]}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            action.onSelect();
            if (!action.keepRow) close();
          }}
          style={[local.action, { width: WIDTH, backgroundColor: color(action.tone) }, parts?.action]}
        >
          {action.icon}
          <Text style={[{ color: "#fff", fontSize: metrics.text.xs, fontWeight: "500" }, parts?.actionText]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[local.row, { borderBottomColor: tokens.border }, parts?.row]}>
      {leading.length ? strip(leading, "left") : null}
      {trailing.length ? strip(trailing, "right") : null}
      <Animated.View
        {...pan.panHandlers}
        accessible
        accessibilityLabel={label}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={({ nativeEvent }) => [...leading, ...trailing].find((action) => action.label === nativeEvent.actionName)?.onSelect()}
        style={[{ backgroundColor: tokens.surface, paddingHorizontal: metrics.space[4], paddingVertical: metrics.space[2], transform: [{ translateX: x }] }]}
      >
        {children}
      </Animated.View>
      {open ? <Pressable accessibilityLabel="Close actions" onPress={close} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
    </View>
  );
}

const local = StyleSheet.create({
  row: { overflow: "hidden", borderBottomWidth: 1 },
  strip: { position: "absolute", top: 0, bottom: 0, flexDirection: "row" },
  action: { alignItems: "center", justifyContent: "center", gap: 4 },
});

export default SwipeActions;
