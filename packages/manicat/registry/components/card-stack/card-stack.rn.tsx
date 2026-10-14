import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type CardDecision = "left" | "right";

export interface CardStackProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onDecide?: (item: T, decision: CardDecision) => void;
  onUndo?: (item: T, decision: CardDecision) => void;
  onReset?: () => void;
  labels?: { left: string; right: string };
  outcomes?: { left: string; right: string };
  label?: string;
  renderEmpty?: (reset: () => void) => ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the stack: card, button, buttonText or status. The React Native counterpart of `classNames`. */
  styles?: {
    card?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    buttonText?: StyleProp<TextStyle>;
    status?: StyleProp<TextStyle>;
  };
}

const THRESHOLD = 90;

/** Swipe the top card left or right, or use the buttons. Every decision can be undone. */
export function CardStack<T>({ items, getKey, getLabel, renderCard, onDecide, onUndo, onReset, labels = { left: "Skip", right: "Keep" }, outcomes = { left: "skipped", right: "kept" }, label = "Cards", renderEmpty, style, styles: parts }: CardStackProps<T>) {
  const tokens = useTokens();
  const [history, setHistory] = useState<{ item: T; decision: CardDecision }[]>([]);
  const [x] = useState(() => new Animated.Value(0));
  const decided = new Set(history.map((entry) => getKey(entry.item)));
  const queue = items.filter((item) => !decided.has(getKey(item)));
  const top = queue[0];
  const live = useRef<{ decide: (decision: CardDecision) => void }>({ decide: () => undefined });

  function decide(decision: CardDecision) {
    if (!top) return;
    Animated.timing(x, { toValue: decision === "right" ? 420 : -420, duration: 180, useNativeDriver: false }).start(() => {
      x.setValue(0);
      setHistory((current) => [...current, { item: top, decision }]);
      onDecide?.(top, decision);
    });
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((current) => current.slice(0, -1));
    onUndo?.(last.item, last.decision);
  }

  function reset() {
    setHistory([]);
    onReset?.();
  }

  // The gesture handlers outlive a render, so they call the latest `decide` through this ref, refreshed after each render.
  useEffect(() => {
    live.current = { decide };
  });
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) live.current.decide("right");
        else if (g.dx < -THRESHOLD) live.current.decide("left");
        else Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();
      },
    }),
  );
  const next = queue[1];

  return (
    <View accessibilityLabel={label} style={[{ alignSelf: "stretch", gap: metrics.space[3] }, style]}>
      <View style={local.deck}>
        {!top ? (
          renderEmpty ? renderEmpty(reset) : (
            <Pressable accessibilityRole="button" onPress={reset} style={local.empty}>
              <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>All done. Start over</Text>
            </Pressable>
          )
        ) : (
          <>
            {next ? <View key={getKey(next)} style={[local.card, local.behind, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.card]}>{renderCard(next)}</View> : null}
            <Animated.View
              key={getKey(top)}
              {...pan.panHandlers}
              accessible
              accessibilityLabel={getLabel(top)}
              accessibilityActions={[{ name: "left", label: labels.left }, { name: "right", label: labels.right }]}
              onAccessibilityAction={({ nativeEvent }) => decide(nativeEvent.actionName as CardDecision)}
              style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface, transform: [{ translateX: x }, { rotate: x.interpolate({ inputRange: [-200, 200], outputRange: ["-8deg", "8deg"] }) }] }, parts?.card]}
            >
              {renderCard(top)}
            </Animated.View>
          </>
        )}
      </View>
      <View style={local.buttons}>
        {(["left", "right"] as const).map((side) => (
          <Pressable key={side} accessibilityRole="button" disabled={!top} onPress={() => decide(side)} style={({ pressed }) => [local.button, { borderColor: tokens.border, backgroundColor: pressed ? tokens.surfaceMuted : tokens.surface, opacity: top ? 1 : 0.4 }, parts?.button]}>
            <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.buttonText]}>{side === "left" ? "← " : ""}{labels[side]}{side === "right" ? " →" : ""}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" disabled={history.length === 0} onPress={undo} style={{ opacity: history.length ? 1 : 0.4 }}>
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>Undo</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={[{ color: tokens.textMuted, fontSize: metrics.text.xs, textAlign: "center", minHeight: 16 }, parts?.status]}>
        {history.length ? `${getLabel(history[history.length - 1].item)} ${outcomes[history[history.length - 1].decision]}` : " "}
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  deck: { minHeight: 200, justifyContent: "center" },
  card: { borderWidth: 1, borderRadius: 26, overflow: "hidden" },
  behind: { position: "absolute", left: 10, right: 10, top: 8, opacity: 0.6, transform: [{ scale: 0.97 }] },
  empty: { alignItems: "center", justifyContent: "center", minHeight: 160 },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: metrics.space[3] },
  button: { paddingHorizontal: metrics.space[4], minHeight: metrics.controlHeight.sm, justifyContent: "center", borderWidth: 1, borderRadius: 999 },
});

export default CardStack;
