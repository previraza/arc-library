// @manicat-dependencies react-native-svg
import { useEffect, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { linePath } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type InkColor = "black" | "blue" | "violet";
export type InkWidth = "fine" | "medium" | "bold";

export interface InkPoint {
  x: number;
  y: number;
}

export interface InkStroke {
  id: string;
  points: InkPoint[];
  color: InkColor;
  width: InkWidth;
}

export interface SignaturePadProps extends Omit<ViewProps, "children"> {
  signer?: string;
  hint?: string;
  defaultColor?: InkColor;
  defaultWidth?: InkWidth;
  onChange?: (strokes: InkStroke[]) => void;
  height?: number;
  /** Extend the inner, named parts of the pad: surface, line, hint or action. The React Native counterpart of `classNames`. */
  styles?: {
    surface?: StyleProp<ViewStyle>;
    line?: StyleProp<ViewStyle>;
    hint?: StyleProp<TextStyle>;
    action?: StyleProp<TextStyle>;
  };
}

const ink: Record<InkColor, string> = { black: "#111111", blue: "#1f5fd1", violet: "#6d3cc9" };
const thickness: Record<InkWidth, number> = { fine: 1.5, medium: 2.5, bold: 4 };

/** Draw with a finger or a stylus. The strokes are reported as plain points, so you can store them or render them yourself. */
export function SignaturePad({ signer, hint = "Sign above the line", defaultColor = "black", defaultWidth = "medium", onChange, height = 180, style, styles: parts, ...props }: SignaturePadProps) {
  const tokens = useTokens();
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [color, setColor] = useState(defaultColor);
  const [width, setWidth] = useState(defaultWidth);
  const live = useRef({ strokes, color, width, onChange });
  useEffect(() => {
    live.current = { strokes, color, width, onChange };
  });

  function commit(next: InkStroke[]) {
    setStrokes(next);
    live.current.onChange?.(next);
  }

  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { color: c, width: w, strokes: all } = live.current;
        commit([...all, { id: `s-${all.length}-${Date.now()}`, color: c, width: w, points: [{ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }] }]);
      },
      onPanResponderMove: (event) => {
        const all = live.current.strokes;
        const current = all[all.length - 1];
        if (current) commit([...all.slice(0, -1), { ...current, points: [...current.points, { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }] }]);
      },
    }),
  );

  const empty = strokes.length === 0;

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <View accessible accessibilityLabel={`Signature pad${signer ? ` for ${signer}` : ""}`} {...pan.panHandlers} style={[local.surface, { height, borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.surface]}>
        <Svg width="100%" height={height} pointerEvents="none">
          {strokes.map((stroke) => (
            <Path key={stroke.id} d={linePath(stroke.points.map((point): [number, number] => [point.x, point.y]), "smooth") || `M${stroke.points[0].x},${stroke.points[0].y}`} fill="none" stroke={ink[stroke.color]} strokeWidth={thickness[stroke.width]} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        <View pointerEvents="none" style={[local.line, { backgroundColor: tokens.borderStrong }, parts?.line]} />
        {empty ? <Text pointerEvents="none" style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{hint}</Text> : null}
      </View>
      <View style={local.actions}>
        {(["black", "blue", "violet"] as const).map((name) => (
          <Pressable key={name} accessibilityRole="radio" accessibilityLabel={`${name} ink`} accessibilityState={{ checked: color === name }} onPress={() => setColor(name)} style={[local.swatch, { backgroundColor: ink[name], borderColor: color === name ? tokens.foreground : "transparent" }]} />
        ))}
        {(["fine", "medium", "bold"] as const).map((name) => (
          <Pressable key={name} accessibilityRole="radio" accessibilityLabel={`${name} pen`} accessibilityState={{ checked: width === name }} onPress={() => setWidth(name)} style={[local.pen, { backgroundColor: width === name ? tokens.surfaceMuted : "transparent" }]}>
            <View style={{ width: 18, height: thickness[name], borderRadius: 2, backgroundColor: tokens.foreground }} />
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" disabled={empty} onPress={() => commit(strokes.slice(0, -1))} style={{ opacity: empty ? 0.4 : 1 }}>
          <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.action]}>Undo</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={empty} onPress={() => commit([])} style={{ opacity: empty ? 0.4 : 1 }}>
          <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.action]}>Clear</Text>
        </Pressable>
      </View>
      {signer ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{signer}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: 26, overflow: "hidden" },
  line: { position: "absolute", left: 24, right: 24, bottom: 36, height: 1 },
  hint: { position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontSize: metrics.text.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: metrics.space[3] },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  pen: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14 },
});

export default SignaturePad;
