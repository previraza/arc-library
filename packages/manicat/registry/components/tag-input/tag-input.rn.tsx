// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";

export interface TagInputProps {
  label: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  description?: string;
  /** Style of the field wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the tag input: label, shell, tag, tagText, input or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    shell?: StyleProp<ViewStyle>;
    tag?: StyleProp<ViewStyle>;
    tagText?: StyleProp<TextStyle>;
    input?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

export function TagInput({ label, value, defaultValue = [], onValueChange, placeholder = "Add a tag", description, style, styles: parts }: TagInputProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const tags = value ?? internal;

  function commit(next: string[]) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function add() {
    const tag = draft.trim().replace(/,$/, "");
    setDraft("");
    if (tag && !tags.includes(tag)) commit([...tags, tag]);
  }

  return (
    <View style={[local.field, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.shell, { minHeight: metrics.controlHeight.md, borderColor: focused ? tokens.foreground : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.shell]}>
        {tags.map((tag) => (
          <View key={tag} style={[local.tag, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }, parts?.tag]}>
            <Text style={[{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.tagText]}>{tag}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${tag}`} hitSlop={8} onPress={() => commit(tags.filter((entry) => entry !== tag))}>
              <X size={16} strokeWidth={1.75} color={tokens.textMuted} />
            </Pressable>
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={(text) => (text.endsWith(",") ? (setDraft(text), setTimeout(add, 0)) : setDraft(text))}
          onSubmitEditing={add}
          onKeyPress={({ nativeEvent }) => nativeEvent.key === "Backspace" && !draft && tags.length > 0 && commit(tags.slice(0, -1))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            add();
          }}
          accessibilityLabel={label}
          placeholder={tags.length ? "" : placeholder}
          placeholderTextColor={tokens.textMuted}
          returnKeyType="done"
          blurOnSubmit={false}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
      </View>
      {description ? <Text style={[local.hint, { color: tokens.textMuted }, parts?.hint]}>{description}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  shell: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, padding: 6, borderWidth: 1, borderRadius: metrics.radiusControl },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderRadius: 999 },
  input: { flexGrow: 1, minWidth: 80, paddingVertical: 4, paddingHorizontal: 6, fontSize: metrics.text.sm },
  hint: { fontSize: metrics.text.xs },
});

export default TagInput;
