import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { squarify } from "@/lib/chart";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TreemapNode {
  id: string;
  label: string;
  value?: number;
  /** A second measure drawn as colour, such as growth. Negative reads red, positive green. */
  color?: number;
  children?: TreemapNode[];
}

export interface TreemapProps extends Omit<ViewProps, "children"> {
  data: TreemapNode;
  label: string;
  formatValue?: (value: number) => string;
  colorLabel?: string;
  formatColor?: (value: number) => string;
  colorDomain?: [number, number];
  height?: number;
  emptyLabel?: string;
  /** Extend the inner, named parts of the treemap: cell, cellText, crumb or readout. The React Native counterpart of `classNames`. */
  styles?: {
    cell?: StyleProp<ViewStyle>;
    cellText?: StyleProp<TextStyle>;
    crumb?: StyleProp<TextStyle>;
    readout?: StyleProp<TextStyle>;
  };
}

const sum = (node: TreemapNode): number => node.value ?? (node.children ?? []).reduce((total, child) => total + sum(child), 0);

/** Area is the value and colour is the second measure. Press a group to zoom in, the breadcrumb to zoom out. Cells are views, so no SVG is needed. */
export function Treemap({ data, label, formatValue = (n) => n.toLocaleString(), colorLabel = "Change", formatColor = (n) => `${n > 0 ? "+" : ""}${n}%`, colorDomain = [-50, 100], height = 240, emptyLabel = "No data yet", style, styles: parts, ...props }: TreemapProps) {
  const tokens = useTokens();
  const [width, setWidth] = useState(0);
  const [trail, setTrail] = useState<TreemapNode[]>([data]);
  const [active, setActive] = useState<string | null>(null);
  const current = trail[trail.length - 1];
  const children = (current.children ?? []).filter((child) => sum(child) > 0);

  if (children.length === 0 && !current.children) return <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyLabel}</Text>;

  const rects = squarify(children.map(sum), { x: 0, y: 0, width, height });
  const tone = (value?: number) => {
    if (value === undefined) return tokens.surfaceMuted;
    const [lo, hi] = colorDomain;
    return value >= 0 ? `${tokens.success}${Math.round(40 + Math.min(1, value / Math.max(1, hi)) * 170).toString(16).padStart(2, "0")}` : `${tokens.danger}${Math.round(40 + Math.min(1, value / Math.min(-1, lo)) * 170).toString(16).padStart(2, "0")}`;
  };
  const picked = children.find((child) => child.id === active);

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <View style={local.crumbs}>
        {trail.map((node, index) => (
          <Pressable key={node.id} accessibilityRole="button" disabled={index === trail.length - 1} onPress={() => setTrail(trail.slice(0, index + 1))}>
            <Text style={[{ color: index === trail.length - 1 ? tokens.foreground : tokens.textSecondary, fontSize: metrics.text.sm, fontWeight: index === trail.length - 1 ? "600" : "400" }, parts?.crumb]}>{index === 0 ? label : node.label}{index < trail.length - 1 ? "  ›" : ""}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, minHeight: 16 }, parts?.readout]}>{picked ? `${picked.label}: ${formatValue(sum(picked))}${picked.color !== undefined ? ` · ${colorLabel} ${formatColor(picked.color)}` : ""}` : `${formatValue(sum(current))} total`}</Text>
      <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
        {width > 0
          ? children.map((child, index) => {
              const rect = rects[index];
              return (
                <Pressable
                  key={child.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${child.label}, ${formatValue(sum(child))}${child.color !== undefined ? `, ${colorLabel} ${formatColor(child.color)}` : ""}`}
                  onPress={() => (child.children?.length ? setTrail([...trail, child]) : setActive(active === child.id ? null : child.id))}
                  style={[local.cell, { left: rect.x, top: rect.y, width: Math.max(0, rect.width - 2), height: Math.max(0, rect.height - 2), backgroundColor: child.color !== undefined ? tone(child.color) : tokens.series[index % 4] + "33", borderColor: active === child.id ? tokens.foreground : tokens.border }, parts?.cell]}
                >
                  {rect.width > 54 && rect.height > 32 ? <Text numberOfLines={2} style={[{ color: tokens.foreground, fontSize: 11, fontWeight: "500" }, parts?.cellText]}>{child.label}</Text> : null}
                </Pressable>
              );
            })
          : null}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  crumbs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { position: "absolute", padding: 6, borderWidth: 1, borderRadius: 8, overflow: "hidden" },
});

export default Treemap;
