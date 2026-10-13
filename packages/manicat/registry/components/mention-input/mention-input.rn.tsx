import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type MentionKind = "person" | "channel";

export interface MentionPerson {
  id: string;
  name: string;
  role?: string;
}

export interface MentionChannel {
  id: string;
  name: string;
  members?: number;
}

export interface Mention {
  kind: MentionKind;
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface MentionValue {
  text: string;
  mentions: Mention[];
}

export interface MentionInputProps {
  value?: MentionValue;
  defaultValue?: MentionValue;
  onChange?: (value: MentionValue) => void;
  people?: MentionPerson[];
  channels?: MentionChannel[];
  onMentionAdd?: (mention: Mention) => void;
  placeholder?: string;
  maxSuggestions?: number;
  disabled?: boolean;
  "aria-label"?: string;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the mention input: input, suggestions, suggestion or suggestionText. The React Native counterpart of `classNames`. */
  styles?: {
    input?: StyleProp<TextStyle>;
    suggestions?: StyleProp<ViewStyle>;
    suggestion?: StyleProp<ViewStyle>;
    suggestionText?: StyleProp<TextStyle>;
  };
}

/** Type @ for people and # for channels. A picked mention is inserted as text and recorded with its position. */
export function MentionInput({ value, defaultValue = { text: "", mentions: [] }, onChange, people = [], channels = [], onMentionAdd, placeholder = "Write a message…", maxSuggestions = 5, disabled = false, "aria-label": ariaLabel = "Message", style, styles: parts }: MentionInputProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [caret, setCaret] = useState(0);
  const current = value ?? internal;

  function set(next: MentionValue) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }

  // The word being typed, when it starts with a trigger.
  const upToCaret = current.text.slice(0, caret);
  const trigger = /(^|\s)([@#])([\w-]*)$/.exec(upToCaret);
  const kind: MentionKind | null = trigger ? (trigger[2] === "@" ? "person" : "channel") : null;
  const needle = (trigger?.[3] ?? "").toLowerCase();
  const suggestions = kind === "person" ? people.filter((person) => person.name.toLowerCase().includes(needle)).slice(0, maxSuggestions).map((person) => ({ id: person.id, label: person.name, meta: person.role })) : kind === "channel" ? channels.filter((channel) => channel.name.toLowerCase().includes(needle)).slice(0, maxSuggestions).map((channel) => ({ id: channel.id, label: channel.name, meta: channel.members ? `${channel.members} members` : undefined })) : [];

  function pick(suggestion: { id: string; label: string }) {
    if (!trigger || !kind) return;
    const start = caret - (trigger[2].length + trigger[3].length);
    const label = `${trigger[2]}${suggestion.label}`;
    const text = `${current.text.slice(0, start)}${label} ${current.text.slice(caret)}`;
    const shift = label.length + 1 - (caret - start);
    const mention: Mention = { kind, id: suggestion.id, label, start, end: start + label.length };
    const kept = current.mentions.filter((entry) => entry.end <= start).concat(current.mentions.filter((entry) => entry.start >= caret).map((entry) => ({ ...entry, start: entry.start + shift, end: entry.end + shift })));
    set({ text, mentions: [...kept, mention].sort((a, b) => a.start - b.start) });
    setCaret(start + label.length + 1);
    onMentionAdd?.(mention);
  }

  return (
    <View style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <TextInput
        multiline
        editable={!disabled}
        value={current.text}
        onChangeText={(text) => set({ text, mentions: current.mentions.filter((entry) => text.slice(entry.start, entry.end) === entry.label) })}
        onSelectionChange={({ nativeEvent }) => setCaret(nativeEvent.selection.start)}
        placeholder={placeholder}
        placeholderTextColor={tokens.textMuted}
        accessibilityLabel={ariaLabel}
        style={[local.input, { color: tokens.foreground, borderColor: tokens.borderStrong, backgroundColor: tokens.surface }, parts?.input]}
      />
      {suggestions.length ? (
        <View accessibilityRole="menu" style={[local.suggestions, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.suggestions]}>
          {suggestions.map((suggestion) => (
            <Pressable key={suggestion.id} accessibilityRole="menuitem" onPress={() => pick(suggestion)} style={({ pressed }) => [local.suggestion, { backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.suggestion]}>
              <Text style={[{ flex: 1, color: tokens.foreground, fontSize: metrics.text.sm }, parts?.suggestionText]}>{kind === "person" ? "@" : "#"}{suggestion.label}</Text>
              {suggestion.meta ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{suggestion.meta}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  input: { minHeight: 88, padding: metrics.space[3], textAlignVertical: "top", fontSize: metrics.text.sm, borderWidth: 1, borderRadius: metrics.radiusControl },
  suggestions: { borderWidth: 1, borderRadius: 22, padding: 4 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], minHeight: metrics.controlHeight.sm + 4, paddingHorizontal: metrics.space[3], borderRadius: metrics.radiusControl - 4 },
});

export default MentionInput;
