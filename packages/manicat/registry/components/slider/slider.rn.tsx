import { useEffect, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type SliderValue = number | [number, number];

export interface SliderProps<T extends SliderValue = number> {
  label: string;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** Fires when the finger lifts, with the final value. */
  onValueCommit?: (value: T) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  showValue?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the slider: label, value, track, range or thumb. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
    track?: StyleProp<ViewStyle>;
    range?: StyleProp<ViewStyle>;
    thumb?: StyleProp<ViewStyle>;
  };
}

const THUMB = 24;

/** Pass a number for one thumb, or a `[low, high]` pair for a range. */
export function Slider<T extends SliderValue = number>({ label, value, defaultValue, onValueChange, onValueCommit, min = 0, max = 100, step = 1, format = (n) => String(n), showValue = true, disabled = false, style, styles: parts }: SliderProps<T>) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<SliderValue>(defaultValue ?? min);
  const current = (value ?? internal) as SliderValue;
  const range = Array.isArray(current);
  const [low, high] = range ? current : [min, current];
  const [width, setWidth] = useState(0);
  const snap = (n: number) => Math.max(min, Math.min(max, Math.round((n - min) / step) * step + min));

  function emit(next: SliderValue, commit = false) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next as T);
    if (commit) onValueCommit?.(next as T);
  }

  // The gesture handlers outlive a render, so they read the latest props and state through this ref, which is refreshed after each render.
  const live = useRef({ low, high, range, width, min, max, disabled, snap, emit });
  useEffect(() => {
    live.current = { low, high, range, width, min, max, disabled, snap, emit };
  });
  const dragging = useRef<0 | 1>(1);

  // The handlers only read `live` when a touch arrives, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const move = (x: number, commit: boolean) => {
      const { low: l, high: h, range: r, width: w, min: lo, max: hi, snap: round, emit: send } = live.current;
      const next = round(lo + (Math.max(0, Math.min(w - THUMB, x - THUMB / 2)) / Math.max(1, w - THUMB)) * (hi - lo));
      if (!r) send(next, commit);
      else if (dragging.current === 0) send([Math.min(next, h), h], commit);
      else send([l, Math.max(next, l)], commit);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onMoveShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderGrant: (event) => {
        const x = event.nativeEvent.locationX;
        const { low: l, high: h, range: r, width: w, min: lo, max: hi } = live.current;
        if (r) {
          const pos = (n: number) => ((n - lo) / (hi - lo)) * (w - THUMB) + THUMB / 2;
          dragging.current = Math.abs(x - pos(l)) < Math.abs(x - pos(h)) ? 0 : 1;
        }
        move(x, false);
      },
      onPanResponderMove: (event) => move(event.nativeEvent.locationX, false),
      onPanResponderRelease: (event) => move(event.nativeEvent.locationX, true),
    });
  });

  const place = (n: number) => ((n - min) / Math.max(1, max - min)) * Math.max(0, width - THUMB);

  return (
    <View style={[local.field, { opacity: disabled ? 0.5 : 1 }, style]}>
      <View style={local.head}>
        <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{label}</Text>
        {showValue ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.sm, fontVariant: ["tabular-nums"] }, parts?.value]}>{range ? `${format(low)} – ${format(high)}` : format(high)}</Text> : null}
      </View>
      <View
        {...pan.panHandlers}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: high }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={({ nativeEvent }) => {
          const delta = nativeEvent.actionName === "increment" ? step : -step;
          emit(range ? ([low, snap(high + delta)] as SliderValue) : snap(high + delta), true);
        }}
        style={local.hit}
      >
        <View style={[local.track, { backgroundColor: tokens.controlTrack }, parts?.track]}>
          <View style={[local.range, { left: range ? place(low) + THUMB / 2 : 0, width: Math.max(0, place(high) - (range ? place(low) : 0) + (range ? 0 : THUMB / 2)), backgroundColor: tokens.controlOn }, parts?.range]} />
        </View>
        {(range ? [low, high] : [high]).map((n, index) => (
          <View key={index} pointerEvents="none" style={[local.thumb, { left: place(n), backgroundColor: tokens.controlThumb, borderColor: tokens.borderStrong }, parts?.thumb]} />
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  head: { flexDirection: "row", justifyContent: "space-between" },
  hit: { height: 36, justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  range: { position: "absolute", top: 0, bottom: 0 },
  thumb: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
});

export default Slider;
