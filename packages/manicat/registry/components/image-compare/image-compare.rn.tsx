import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ImageCompareProps extends Omit<ViewProps, "children"> {
  before: ReactNode;
  after: ReactNode;
  /** The divider's position, 0 to 100. */
  position?: number;
  defaultPosition?: number;
  onPositionChange?: (position: number) => void;
  orientation?: "horizontal" | "vertical";
  labels?: [string, string] | false;
  label?: string;
  /** Width over height, such as 1.6. */
  aspectRatio?: number;
  /** Extend the inner, named parts of the comparison: handle or tag. The React Native counterpart of `classNames`. */
  styles?: {
    handle?: StyleProp<ViewStyle>;
    tag?: StyleProp<TextStyle>;
  };
}

/** Drag the handle to reveal more of one side. `before` and `after` can be any view: images, screenshots or live UI. */
export function ImageCompare({ before, after, position, defaultPosition = 50, onPositionChange, orientation = "horizontal", labels = ["Before", "After"], label = "Image comparison", aspectRatio = 1.6, style, styles: parts, ...props }: ImageCompareProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultPosition);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const current = position ?? internal;
  const horizontal = orientation === "horizontal";
  const live = useRef({ size, horizontal, set: (() => {}) as (next: number) => void });

  function set(next: number) {
    const clamped = Math.max(0, Math.min(100, next));
    if (position === undefined) setInternal(clamped);
    onPositionChange?.(clamped);
  }

  useEffect(() => {
    live.current = { size, horizontal, set };
  });

  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const move = (x: number, y: number) => {
      const { size: box, horizontal: h, set: update } = live.current;
      update(h ? (x / Math.max(1, box.width)) * 100 : (y / Math.max(1, box.height)) * 100);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => move(event.nativeEvent.locationX, event.nativeEvent.locationY),
      onPanResponderMove: (event) => move(event.nativeEvent.locationX, event.nativeEvent.locationY),
    });
  });

  return (
    <View
      {...props}
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(current) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={({ nativeEvent }) => set(current + (nativeEvent.actionName === "increment" ? 10 : -10))}
      onLayout={(event: LayoutChangeEvent) => setSize(event.nativeEvent.layout)}
      style={[local.root, { aspectRatio, borderColor: tokens.border }, style]}
    >
      <View style={StyleSheet.absoluteFill}>{after}</View>
      <View style={[local.clip, horizontal ? { width: `${current}%` } : { height: `${current}%`, width: "100%" }]}>
        <View style={{ width: size.width || "100%", height: size.height || "100%" }}>{before}</View>
      </View>
      <View pointerEvents="none" style={[horizontal ? local.lineV : local.lineH, horizontal ? { left: `${current}%` } : { top: `${current}%` }, { backgroundColor: "#fff" }]}>
        <View style={[local.handle, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.handle]}>
          <Text style={{ color: tokens.textSecondary, fontSize: 12 }}>{horizontal ? "↔" : "↕"}</Text>
        </View>
      </View>
      {labels ? (
        <>
          <Text style={[local.tag, { left: 8, top: 8 }, parts?.tag]}>{labels[0]}</Text>
          <Text style={[local.tag, { right: 8, bottom: 8 }, parts?.tag]}>{labels[1]}</Text>
        </>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { width: "100%", overflow: "hidden", borderWidth: 1, borderRadius: 26 },
  clip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
  lineV: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, alignItems: "center", justifyContent: "center" },
  lineH: { position: "absolute", left: 0, right: 0, height: 2, marginTop: -1, alignItems: "center", justifyContent: "center" },
  handle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tag: { position: "absolute", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", fontSize: metrics.text.xs, overflow: "hidden" },
});

export default ImageCompare;
