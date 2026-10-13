import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  icon?: ReactNode;
  shortcut?: string;
}

export interface CommandPaletteProps extends Omit<ViewProps, "children"> {
  items: CommandItem[];
  placeholder?: string;
  onSelect?: (item: CommandItem) => void;
  label?: string;
  autoFocus?: boolean;
  /** Extend the inner, named parts of the palette: input, list, group, item, itemText or empty. The React Native counterpart of `classNames`. */
  styles?: {
    input?: StyleProp<TextStyle>;
    list?: StyleProp<ViewStyle>;
    group?: StyleProp<TextStyle>;
    item?: StyleProp<ViewStyle>;
    itemText?: StyleProp<TextStyle>;
    empty?: StyleProp<TextStyle>;
  };
}

/** Search and run commands. Shortcuts show as hints; on a phone, tapping a row is the way to run it. */
export function CommandPalette({ items, placeholder = "Search commands", onSelect, label = "Command palette", autoFocus = false, style, styles: parts, ...props }: CommandPaletteProps) {
  const tokens = useTokens();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const results = needle ? items.filter((item) => [item.label, item.description ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle))) : items;
  const groups = [...new Set(results.map((item) => item.group ?? ""))];

  return (
    <View {...props} accessibilityLabel={label} style={[local.root, { borderColor: tokens.border, backgroundColor: tokens.surface }, style]}>
      <TextInput
        autoFocus={autoFocus}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={tokens.textMuted}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={[local.input, { color: tokens.foreground, borderBottomColor: tokens.border }, parts?.input]}
      />
      <ScrollView keyboardShouldPersistTaps="handled" style={[local.list, parts?.list]}>
        {results.length === 0 ? <Text style={[local.empty, { color: tokens.textMuted }, parts?.empty]}>No results</Text> : null}
        {groups.map((group) => (
          <View key={group || "all"}>
            {group ? <Text style={[local.group, { color: tokens.textMuted }, parts?.group]}>{group}</Text> : null}
            {results
              .filter((item) => (item.group ?? "") === group)
              .map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => onSelect?.(item)}
                  style={({ pressed }) => [local.item, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.item]}
                >
                  {item.icon}
                  <View style={{ flex: 1 }}>
                    <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.itemText]}>{item.label}</Text>
                    {item.description ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{item.description}</Text> : null}
                  </View>
                  {item.shortcut ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{item.shortcut}</Text> : null}
                </Pressable>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 26, overflow: "hidden", alignSelf: "stretch" },
  input: { minHeight: metrics.controlHeight.lg, paddingHorizontal: metrics.space[4], fontSize: metrics.text.sm, borderBottomWidth: 1 },
  list: { maxHeight: 340, padding: 6 },
  group: { paddingHorizontal: metrics.space[3], paddingTop: metrics.space[2], paddingBottom: 4, fontSize: metrics.text.xs, fontWeight: "500" },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
  empty: { padding: metrics.space[4], fontSize: metrics.text.sm, textAlign: "center" },
});

export default CommandPalette;
