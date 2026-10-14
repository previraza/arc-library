import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ExpandingSearchItem {
  id: string;
  title: string;
  meta?: string;
  group?: string;
  icon?: ReactNode;
  keywords?: string[];
}

export interface ExpandingSearchProps {
  label: string;
  items: ExpandingSearchItem[];
  /** Shown under the field before anything is typed. */
  suggestions?: ExpandingSearchItem[];
  suggestionsLabel?: string;
  placeholder?: string;
  onSelect?: (item: ExpandingSearchItem) => void;
  onExpandedChange?: (expanded: boolean) => void;
  maxResults?: number;
  emptyHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the search: trigger, field, input, results, result or empty. The React Native counterpart of `classNames`. */
  styles?: {
    trigger?: StyleProp<ViewStyle>;
    field?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    results?: StyleProp<ViewStyle>;
    result?: StyleProp<ViewStyle>;
    empty?: StyleProp<TextStyle>;
  };
}

/** A search icon that grows into a field with results under it. */
export function ExpandingSearch({ label, items, suggestions = [], suggestionsLabel = "Recent", placeholder = "Search", onSelect, onExpandedChange, maxResults = 6, emptyHint = "Try a shorter word.", style, styles: parts }: ExpandingSearchProps) {
  const tokens = useTokens();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const results = needle ? items.filter((item) => [item.title, item.meta ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle))).slice(0, maxResults) : suggestions.slice(0, maxResults);

  function toggle(next: boolean) {
    setExpanded(next);
    if (!next) setQuery("");
    onExpandedChange?.(next);
  }

  if (!expanded) {
    return (
      <Pressable accessibilityRole="search" accessibilityLabel={label} onPress={() => toggle(true)} style={[local.trigger, { borderColor: tokens.border, backgroundColor: tokens.surface }, style, parts?.trigger]}>
        <Text style={{ color: tokens.textSecondary, fontSize: 16 }}>⌕</Text>
      </Pressable>
    );
  }

  return (
    <View style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <View style={[local.field, { borderColor: tokens.foreground, backgroundColor: tokens.surface }, parts?.field]}>
        <Text style={{ color: tokens.textMuted, fontSize: 16 }}>⌕</Text>
        <TextInput autoFocus value={query} onChangeText={setQuery} placeholder={placeholder} placeholderTextColor={tokens.textMuted} accessibilityLabel={label} returnKeyType="search" style={[local.input, { color: tokens.foreground }, parts?.input]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close search" hitSlop={8} onPress={() => toggle(false)}>
          <Text style={{ color: tokens.textMuted, fontSize: 18 }}>×</Text>
        </Pressable>
      </View>
      <View style={[local.results, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.results]}>
        {!needle && suggestions.length ? <Text style={{ paddingHorizontal: metrics.space[3], paddingTop: 6, color: tokens.textMuted, fontSize: metrics.text.xs }}>{suggestionsLabel}</Text> : null}
        {results.length === 0 && needle ? <Text style={[{ padding: metrics.space[3], color: tokens.textMuted, fontSize: metrics.text.sm }, parts?.empty]}>{emptyHint}</Text> : null}
        {results.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => {
              onSelect?.(item);
              toggle(false);
            }}
            style={({ pressed }) => [local.result, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.result]}
          >
            {item.icon}
            <Text style={{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }}>{item.title}</Text>
            {item.meta ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{item.meta}</Text> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  trigger: { alignSelf: "flex-start", width: metrics.controlHeight.md, height: metrics.controlHeight.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 999 },
  field: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: 999 },
  input: { flex: 1, fontSize: metrics.text.sm, paddingVertical: 0 },
  results: { borderWidth: 1, borderRadius: 22, padding: 6 },
  result: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.sm + 4, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
});

export default ExpandingSearch;
