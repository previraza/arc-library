import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: ReactNode;
}

export interface TreeViewProps extends Omit<ViewProps, "children"> {
  nodes: TreeNode[];
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (expandedIds: string[]) => void;
  onSelect?: (node: TreeNode) => void;
  /** Extend the inner, named parts of the tree: row, rowText or chevron. The React Native counterpart of `classNames`. */
  styles?: {
    row?: StyleProp<ViewStyle>;
    rowText?: StyleProp<TextStyle>;
    chevron?: StyleProp<TextStyle>;
  };
}

export function TreeView({ nodes, defaultExpandedIds = [], expandedIds, onExpandedChange, onSelect, style, styles: parts, ...props }: TreeViewProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultExpandedIds);
  const [selected, setSelected] = useState<string>();
  const expanded = expandedIds ?? internal;

  function toggle(id: string) {
    const next = expanded.includes(id) ? expanded.filter((entry) => entry !== id) : [...expanded, id];
    if (expandedIds === undefined) setInternal(next);
    onExpandedChange?.(next);
  }

  function render(list: TreeNode[], depth: number): ReactNode {
    return list.map((node) => {
      const branch = Boolean(node.children?.length);
      const open = expanded.includes(node.id);
      return (
        <View key={node.id}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: branch ? open : undefined, selected: selected === node.id }}
            onPress={() => {
              setSelected(node.id);
              if (branch) toggle(node.id);
              onSelect?.(node);
            }}
            style={({ pressed }) => [
              local.row,
              { paddingLeft: 8 + depth * 16, backgroundColor: selected === node.id || pressed ? tokens.surfaceMuted : "transparent" },
              parts?.row,
            ]}
          >
            <Text style={[{ width: 14, color: tokens.textMuted, fontSize: 14, transform: [{ rotate: open ? "90deg" : "0deg" }] }, parts?.chevron]}>{branch ? "›" : ""}</Text>
            {node.icon}
            <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.rowText]}>{node.label}</Text>
          </Pressable>
          {branch && open ? render(node.children!, depth + 1) : null}
        </View>
      );
    });
  }

  return (
    <View {...props} accessibilityRole="list" style={[{ alignSelf: "stretch" }, style]}>
      {render(nodes, 0)}
    </View>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingRight: 8, borderRadius: metrics.radiusControl - 6 },
});

export default TreeView;
