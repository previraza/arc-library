import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type JsonValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "other";

export interface JsonViewerProps extends Omit<ViewProps, "children"> {
  data: unknown;
  rootName?: string;
  /** How many levels are open at first. */
  defaultExpandDepth?: number;
  expanded?: string[];
  onExpandedChange?: (paths: string[]) => void;
  onSelect?: (detail: { path: string; value: unknown; type: JsonValueType }) => void;
  maxHeight?: number;
  label?: string;
  /** Extend the inner, named parts of the viewer: row, key or value. The React Native counterpart of `classNames`. */
  styles?: {
    key?: StyleProp<TextStyle>;
    value?: StyleProp<TextStyle>;
  };
}

const typeOf = (value: unknown): JsonValueType => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "object" ? "object" : typeof value === "string" ? "string" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "other");

/** A collapsible tree of any JSON value, with types told apart by colour. */
export function JsonViewer({ data, rootName = "root", defaultExpandDepth = 1, expanded, onExpandedChange, onSelect, maxHeight, label = "JSON", style, styles: parts, ...props }: JsonViewerProps) {
  const tokens = useTokens();
  const initial: string[] = [];
  const collect = (value: unknown, path: string, depth: number) => {
    if (typeOf(value) === "object" || typeOf(value) === "array") {
      if (depth < defaultExpandDepth) initial.push(path);
      Object.entries(value as object).forEach(([key, child]) => collect(child, `${path}.${key}`, depth + 1));
    }
  };
  const [internal, setInternal] = useState(() => (collect(data, "$", 0), initial));
  const open = expanded ?? internal;

  function toggle(path: string) {
    const next = open.includes(path) ? open.filter((entry) => entry !== path) : [...open, path];
    if (expanded === undefined) setInternal(next);
    onExpandedChange?.(next);
  }

  const color: Record<JsonValueType, string> = { object: tokens.textMuted, array: tokens.textMuted, string: tokens.success, number: tokens.series[0], boolean: tokens.warning, null: tokens.textMuted, other: tokens.foreground };

  function row(name: string, value: unknown, path: string, depth: number): ReactNode {
    const type = typeOf(value);
    const branch = type === "object" || type === "array";
    const entries = branch ? Object.entries(value as object) : [];
    const isOpen = open.includes(path);
    return (
      <View key={path}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: branch ? isOpen : undefined }} onPress={() => (branch && toggle(path), onSelect?.({ path, value, type }))} style={[local.row, { paddingLeft: depth * 14 }]}>
          <Text style={{ width: 14, color: tokens.textMuted, fontSize: 12 }}>{branch ? (isOpen ? "▾" : "▸") : ""}</Text>
          <Text style={[{ color: tokens.foreground, fontSize: 12, fontFamily: "Menlo" }, parts?.key]}>{name}</Text>
          <Text style={{ color: tokens.textMuted, fontSize: 12, fontFamily: "Menlo" }}>: </Text>
          <Text style={[{ color: color[type], fontSize: 12, fontFamily: "Menlo", flexShrink: 1 }, parts?.value]}>
            {branch ? (isOpen ? (type === "array" ? "[" : "{") : `${type === "array" ? "[" : "{"}…${type === "array" ? "]" : "}"} ${entries.length} ${entries.length === 1 ? "item" : "items"}`) : type === "string" ? `"${String(value)}"` : String(value)}
          </Text>
        </Pressable>
        {branch && isOpen ? entries.map(([key, child]) => row(key, child, `${path}.${key}`, depth + 1)) : null}
      </View>
    );
  }

  return (
    <View {...props} accessibilityLabel={label} style={[{ alignSelf: "stretch", borderWidth: 1, borderRadius: 22, borderColor: tokens.border, backgroundColor: tokens.surface, padding: metrics.space[3] }, style]}>
      <ScrollView style={{ maxHeight }} horizontal={false} nestedScrollEnabled>
        {row(rootName, data, "$", 0)}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({ row: { flexDirection: "row", alignItems: "flex-start", minHeight: 24, paddingVertical: 2 } });

export default JsonViewer;
