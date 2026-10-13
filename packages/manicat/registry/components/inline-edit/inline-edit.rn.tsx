import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface InlineEditProps {
  value: string;
  onSave: (next: string) => void | Promise<unknown>;
  label: string;
  /** Return a message to block the save, or nothing when the value is fine. */
  validate?: (next: string) => string | null | undefined;
  placeholder?: string;
  multiline?: boolean;
  variant?: "title" | "body";
  /** Extend the inner, named parts of the inline edit: text, input or error. The React Native counterpart of `classNames`. */
  styles?: {
    root?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
    input?: StyleProp<TextStyle>;
    error?: StyleProp<TextStyle>;
  };
}

/** Looks like text until pressed; submit or blur saves, an empty submit or a failed validation keeps the old value. */
export function InlineEdit({ value, onSave, label, validate, placeholder = "", multiline = false, variant = "title", styles: parts }: InlineEditProps) {
  const tokens = useTokens();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const size = variant === "title" ? { fontSize: 22, fontWeight: "600" as const } : { fontSize: metrics.text.sm, fontWeight: "400" as const };

  async function commit() {
    const next = draft.trim();
    const problem = validate?.(next);
    if (problem) return setError(problem);
    setError(null);
    setEditing(false);
    if (next && next !== value) await onSave(next);
  }

  if (!editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}. Double tap to edit`}
        onPress={() => {
          setDraft(value);
          setEditing(true);
        }}
        style={[local.read, { borderColor: "transparent" }, parts?.root]}
      >
        <Text style={[size, { color: value ? tokens.foreground : tokens.textMuted }, parts?.text]}>{value || placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View style={parts?.root}>
      <TextInput
        autoFocus
        value={draft}
        multiline={multiline}
        onChangeText={setDraft}
        onSubmitEditing={multiline ? undefined : commit}
        onBlur={commit}
        accessibilityLabel={label}
        returnKeyType="done"
        style={[local.input, size, { color: tokens.foreground, borderColor: error ? tokens.danger : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.input]}
      />
      {error ? <Text accessibilityRole="alert" style={[{ color: tokens.danger, fontSize: metrics.text.xs, marginTop: 4 }, parts?.error]}>{error}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  read: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 8 },
  input: { alignSelf: "stretch", paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 8 },
});

export default InlineEdit;
