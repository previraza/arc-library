// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { Check, ChevronDown } from "lucide-react-native";

export interface MorphSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  /** Short trailing detail such as an offset or a count. */
  meta?: string;
  /** Extra words that match this option when searching. */
  keywords?: string;
  disabled?: boolean;
}

export interface MorphSelectGroup {
  label: string;
  options: MorphSelectOption[];
}

export type MorphSelectItem = MorphSelectOption | MorphSelectGroup;

export interface MorphSelectProps {
  label: string;
  items: MorphSelectItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string, option: MorphSelectOption) => void;
  placeholder?: string;
  /** Show a search box. `auto` shows it from eight options up. */
  searchable?: boolean | "auto";
  searchPlaceholder?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the select: trigger, valueText, content, group, option, optionText or meta. The React Native counterpart of `classNames`. */
  styles?: {
    trigger?: StyleProp<ViewStyle>;
    valueText?: StyleProp<TextStyle>;
    content?: StyleProp<ViewStyle>;
    group?: StyleProp<TextStyle>;
    option?: StyleProp<ViewStyle>;
    optionText?: StyleProp<TextStyle>;
    meta?: StyleProp<TextStyle>;
  };
}

const isGroup = (item: MorphSelectItem): item is MorphSelectGroup => "options" in item;

/** The web version grows the trigger into the list; on a phone the list opens as a sheet and the chosen label settles into the trigger. */
export function MorphSelect({ label, items, value, defaultValue = null, onValueChange, placeholder = "Select…", searchable = "auto", searchPlaceholder = "Search", disabled = false, style, styles: parts }: MorphSelectProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = value === undefined ? internal : value;

  const groups = items.map((item) => (isGroup(item) ? item : { label: "", options: [item] }));
  const all = groups.flatMap((group) => group.options);
  const selected = all.find((option) => option.value === current);
  const showSearch = searchable === "auto" ? all.length >= 8 : searchable;
  const needle = query.trim().toLowerCase();
  const visible = groups.map((group) => ({ ...group, options: group.options.filter((option) => !needle || [option.label, option.meta ?? "", option.keywords ?? ""].some((word) => word.toLowerCase().includes(needle))) })).filter((group) => group.options.length > 0);

  function choose(option: MorphSelectOption) {
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value, option);
    setOpen(false);
    setQuery("");
  }

  return (
    <View style={[{ alignSelf: "flex-start" }, style]}>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={`${label}${selected ? `, ${selected.label}` : ""}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[local.trigger, { minHeight: metrics.controlHeight.md, borderColor: tokens.border, backgroundColor: tokens.surface, opacity: disabled ? 0.5 : 1 }, parts?.trigger]}
      >
        {selected?.icon}
        <Text style={[{ color: selected ? tokens.foreground : tokens.textMuted, fontSize: metrics.text.sm }, parts?.valueText]}>{selected?.label ?? placeholder}</Text>
        <ChevronDown size={16} strokeWidth={1.75} color={tokens.textMuted} />
      </Pressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable accessibilityLabel="Close list" onPress={() => setOpen(false)} style={local.overlay}>
          <Pressable onPress={() => undefined} style={[local.content, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.content]}>
            <Text accessibilityRole="header" style={{ color: tokens.textSecondary, fontSize: metrics.text.xs, padding: metrics.space[3], paddingBottom: 0 }}>{label}</Text>
            {showSearch ? <TextInput value={query} onChangeText={setQuery} placeholder={searchPlaceholder} placeholderTextColor={tokens.textMuted} accessibilityLabel={searchPlaceholder} style={[local.search, { color: tokens.foreground, borderBottomColor: tokens.border }]} /> : null}
            <ScrollView keyboardShouldPersistTaps="handled">
              {visible.map((group) => (
                <View key={group.label || "all"}>
                  {group.label ? <Text style={[local.group, { color: tokens.textMuted }, parts?.group]}>{group.label}</Text> : null}
                  {group.options.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: option.value === current, disabled: option.disabled }}
                      disabled={option.disabled}
                      onPress={() => choose(option)}
                      style={({ pressed }) => [local.option, { backgroundColor: pressed || option.value === current ? tokens.surfaceMuted : "transparent", opacity: option.disabled ? 0.45 : 1 }, parts?.option]}
                    >
                      {option.icon}
                      <Text style={[{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }, parts?.optionText]}>{option.label}</Text>
                      {option.meta ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs, fontVariant: ["tabular-nums"] }, parts?.meta]}>{option.meta}</Text> : null}
                      {option.value === current ? <Check size={16} strokeWidth={1.75} color={tokens.foreground} /> : null}
                    </Pressable>
                  ))}
                </View>
              ))}
              {visible.length === 0 ? <Text style={{ padding: metrics.space[4], color: tokens.textMuted, fontSize: metrics.text.sm }}>No results.</Text> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: 999 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10, 10, 10, 0.4)" },
  content: { maxHeight: "70%", borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  search: { minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], fontSize: metrics.text.sm, borderBottomWidth: 1 },
  group: { paddingHorizontal: metrics.space[4], paddingTop: metrics.space[3], paddingBottom: 4, fontSize: metrics.text.xs, fontWeight: "500" },
  option: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4] },
});

export default MorphSelect;
