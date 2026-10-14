import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface FilterChip {
  id: string;
  label: string;
  value?: string;
}

export interface FilterOption {
  value: string;
  label?: string;
  hint?: string | number;
}

export interface FilterField {
  id: string;
  label: string;
  options: (string | FilterOption)[];
}

export interface FilterMenuProps {
  fields: FilterField[];
  onSelect: (filter: FilterChip, field: FilterField) => void;
  active?: FilterChip[];
  label?: string;
}

/** Two steps in a sheet: pick the field, then one of its values. */
export function FilterMenu({ fields, onSelect, active = [], label = "Add filter" }: FilterMenuProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<FilterField | null>(null);

  function close() {
    setOpen(false);
    setField(null);
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={[local.add, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
        <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>+ {label}</Text>
      </Pressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={close} statusBarTranslucent>
        <Pressable accessibilityLabel="Close menu" onPress={close} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.sheet, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
            <ScrollView>
              {field ? (
                <Pressable accessibilityRole="button" onPress={() => setField(null)} style={local.row}>
                  <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.sm }}>‹ {field.label}</Text>
                </Pressable>
              ) : null}
              {(field ? field.options : fields).map((entry) => {
                const option = typeof entry === "string" ? { value: entry } : entry;
                const isField = !field;
                const text = isField ? (entry as FilterField).label : (option as FilterOption).label ?? (option as FilterOption).value;
                const taken = !isField && active.some((chip) => chip.id === field!.id && chip.label === text);
                return (
                  <Pressable
                    key={isField ? (entry as FilterField).id : (option as FilterOption).value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ disabled: taken }}
                    disabled={taken}
                    onPress={() => {
                      if (isField) return setField(entry as FilterField);
                      onSelect({ id: field!.id, label: text, value: (option as FilterOption).value }, field!);
                      close();
                    }}
                    style={({ pressed }) => [local.row, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent", opacity: taken ? 0.45 : 1 }]}
                  >
                    <Text style={{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }}>{text}</Text>
                    {!isField && (option as FilterOption).hint !== undefined ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{(option as FilterOption).hint}</Text> : null}
                    {isField ? <Text style={{ color: tokens.textMuted }}>›</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export interface FilterToolbarProps extends Omit<ViewProps, "children"> {
  filters: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  /** Your own controls, such as a search field. */
  children?: ReactNode;
  label?: string;
  addFilter?: { fields: FilterField[]; onAdd: (filter: FilterChip, field: FilterField) => void; label?: string };
  /** Extend the inner, named parts of the toolbar: chip, chipText or clear. The React Native counterpart of `classNames`. */
  styles?: {
    chip?: StyleProp<ViewStyle>;
    chipText?: StyleProp<TextStyle>;
    clear?: StyleProp<TextStyle>;
  };
}

export function FilterToolbar({ filters, onRemove, onClearAll, children, label = "Active filters", addFilter, style, styles: parts, ...props }: FilterToolbarProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="toolbar" accessibilityLabel={label} style={[local.bar, style]}>
      {children}
      {filters.map((filter) => (
        <View key={filter.id} style={[local.chip, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.chip]}>
          <Text style={[{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.chipText]}>{filter.label}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${filter.label}`} hitSlop={8} onPress={() => onRemove(filter.id)}>
            <Text style={{ color: tokens.textMuted, fontSize: 14, lineHeight: 16 }}>×</Text>
          </Pressable>
        </View>
      ))}
      {addFilter ? <FilterMenu fields={addFilter.fields} onSelect={addFilter.onAdd} active={filters} label={addFilter.label} /> : null}
      {onClearAll && filters.length > 1 ? (
        <Pressable accessibilityRole="button" onPress={onClearAll}>
          <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.clear]}>Clear all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  bar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: metrics.space[2], alignSelf: "stretch" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 8, paddingVertical: 4, borderWidth: 1, borderRadius: 999 },
  add: { minHeight: metrics.controlHeight.sm, paddingHorizontal: metrics.space[3], justifyContent: "center", borderWidth: 1, borderRadius: 999 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10, 10, 10, 0.4)" },
  sheet: { maxHeight: "60%", borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 6, paddingBottom: metrics.space[5] },
  row: { flexDirection: "row", alignItems: "center", minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], borderRadius: metrics.radiusControl - 4 },
});

export default FilterToolbar;
