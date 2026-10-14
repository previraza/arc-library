import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection };

export type DataColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  numeric?: boolean;
  /** Width in pixels. Columns without one share the free space. */
  width?: number;
};

export type SortableDataTableProps<T extends Record<string, unknown>> = Omit<ViewProps, "children"> & {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: keyof T | ((row: T) => string);
  caption?: string;
  emptyMessage?: string;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  itemName?: { one: string; other: string };
  /** Extend the inner, named parts of the table: header, headerText, row, cell, cellText or caption. The React Native counterpart of `classNames`. */
  styles?: {
    header?: StyleProp<ViewStyle>;
    headerText?: StyleProp<TextStyle>;
    row?: StyleProp<ViewStyle>;
    cell?: StyleProp<ViewStyle>;
    cellText?: StyleProp<TextStyle>;
    caption?: StyleProp<TextStyle>;
  };
};

const compare = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true }));

/** Press a header to sort by it; select rows with the checkboxes. Wide tables scroll sideways. */
export function SortableDataTable<T extends Record<string, unknown>>({ rows, columns, rowKey, caption, emptyMessage = "Nothing to show yet.", defaultSort, onSortChange, selectable = false, selectedKeys, defaultSelectedKeys = [], onSelectionChange, itemName = { one: "row", other: "rows" }, style, styles: parts, ...props }: SortableDataTableProps<T>) {
  const tokens = useTokens();
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);
  const [internal, setInternal] = useState(defaultSelectedKeys);
  const selected = selectedKeys ?? internal;
  const keyOf = (row: T) => (typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]));
  const sorted = sort ? [...rows].sort((a, b) => compare(a[sort.key], b[sort.key]) * (sort.direction === "asc" ? 1 : -1)) : rows;

  function toggleSort(column: DataColumn<T>) {
    if (!column.sortable) return;
    const next: SortState = { key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" };
    setSort(next);
    onSortChange?.(next);
  }

  function select(keys: string[]) {
    if (selectedKeys === undefined) setInternal(keys);
    onSelectionChange?.(keys);
  }

  const allKeys = rows.map(keyOf);
  const all = allKeys.length > 0 && allKeys.every((key) => selected.includes(key));
  const box = (on: boolean, label: string, onPress: () => void) => (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={onPress} hitSlop={8} style={[local.box, { borderColor: on ? tokens.controlOn : tokens.borderStrong, backgroundColor: on ? tokens.controlOn : tokens.surface }]}>
      {on ? <Text style={{ color: tokens.controlThumbOn, fontSize: 10, fontWeight: "700" }}>✓</Text> : null}
    </Pressable>
  );

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      {caption ? <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.caption]}>{caption}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View accessibilityRole="list" style={[local.table, { borderColor: tokens.border }]}>
          <View style={[local.row, { backgroundColor: tokens.surfaceMuted }, parts?.header]}>
            {selectable ? <View style={local.check}>{box(all, "Select all rows", () => select(all ? [] : allKeys))}</View> : null}
            {columns.map((column) => (
              <Pressable key={column.key} accessibilityRole="button" accessibilityLabel={`${column.label}${sort?.key === column.key ? `, sorted ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`} disabled={!column.sortable} onPress={() => toggleSort(column)} style={[local.cell, { width: column.width, flex: column.width ? undefined : 1, minWidth: column.width ?? 110 }, column.numeric && { alignItems: "flex-end" }]}>
                <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, fontWeight: "600" }, parts?.headerText]}>{column.label}{sort?.key === column.key ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</Text>
              </Pressable>
            ))}
          </View>
          {sorted.length === 0 ? <Text style={{ padding: metrics.space[4], color: tokens.textMuted, fontSize: metrics.text.sm }}>{emptyMessage}</Text> : null}
          {sorted.map((row) => {
            const key = keyOf(row);
            const on = selected.includes(key);
            return (
              <View key={key} accessibilityState={{ selected: on }} style={[local.row, { borderTopColor: tokens.border, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: on ? tokens.surfaceMuted : tokens.surface }, parts?.row]}>
                {selectable ? <View style={local.check}>{box(on, `Select ${key}`, () => select(on ? selected.filter((entry) => entry !== key) : [...selected, key]))}</View> : null}
                {columns.map((column) => (
                  <View key={column.key} style={[local.cell, { width: column.width, flex: column.width ? undefined : 1, minWidth: column.width ?? 110 }, column.numeric && { alignItems: "flex-end" }, parts?.cell]}>
                    {column.render ? column.render(row[column.key], row) : <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontVariant: column.numeric ? ["tabular-nums"] : undefined }, parts?.cellText]}>{String(row[column.key] ?? "")}</Text>}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{selectable && selected.length ? `${selected.length} of ${rows.length} ${rows.length === 1 ? itemName.one : itemName.other} selected` : `${rows.length} ${rows.length === 1 ? itemName.one : itemName.other}`}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 22, overflow: "hidden", minWidth: "100%" },
  row: { flexDirection: "row", alignItems: "center" },
  check: { width: 44, alignItems: "center" },
  cell: { paddingHorizontal: metrics.space[3], paddingVertical: metrics.space[3], justifyContent: "center" },
  box: { width: 18, height: 18, borderWidth: 1, borderRadius: 5, alignItems: "center", justifyContent: "center" },
});

export default SortableDataTable;
