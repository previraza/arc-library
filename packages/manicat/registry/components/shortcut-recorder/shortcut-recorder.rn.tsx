import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface ShortcutBinding {
  shortcut: string;
  label: string;
}

const MODIFIERS = ["mod", "ctrl", "alt", "shift", "meta"] as const;
const SYMBOLS: Record<string, string> = { mod: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘", enter: "↵", escape: "esc", space: "␣", up: "↑", down: "↓", left: "←", right: "→" };

/** "Cmd + K", "ctrl+shift+p" → "mod+k", "ctrl+shift+p": modifiers first in a fixed order, lowercase. */
export function normalizeShortcut(text: string): string {
  const parts = text.toLowerCase().split(/[+\s-]+/).filter(Boolean).map((part) => (part === "cmd" || part === "command" ? "mod" : part === "control" ? "ctrl" : part === "option" ? "alt" : part));
  const mods = MODIFIERS.filter((modifier) => parts.includes(modifier));
  const keys = parts.filter((part) => !(MODIFIERS as readonly string[]).includes(part));
  return [...mods, ...keys.slice(0, 1)].join("+");
}

export interface ShortcutRecorderProps {
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, details: { replaced?: ShortcutBinding }) => void;
  resetValue?: string | null;
  bindings?: ShortcutBinding[];
  requireModifier?: boolean;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the recorder: label, field, key, input or hint. The React Native counterpart of `classNames`. */
  styles?: {
    label?: StyleProp<TextStyle>;
    field?: StyleProp<ViewStyle>;
    key?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    hint?: StyleProp<TextStyle>;
  };
}

/**
 * Phones have no keyboard to record from, so this port takes the shortcut as text ("mod+k", "ctrl+shift+p") and shows it as key caps.
 * Use the web version where users have a hardware keyboard and you want to capture real key presses.
 */
export function ShortcutRecorder({ label, value, defaultValue = null, onValueChange, resetValue, bindings = [], requireModifier = true, placeholder = "e.g. mod+k", description, disabled = false, style, styles: parts }: ShortcutRecorderProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const current = value === undefined ? internal : value;

  function commit(text: string) {
    const next = normalizeShortcut(text);
    if (!next) return setProblem(null);
    if (requireModifier && !MODIFIERS.some((modifier) => next.startsWith(modifier))) return setProblem("Add a modifier such as mod, ctrl or alt.");
    const replaced = bindings.find((binding) => normalizeShortcut(binding.shortcut) === next);
    setProblem(replaced ? `Replaces "${replaced.label}".` : null);
    if (value === undefined) setInternal(next);
    onValueChange?.(next, { replaced });
  }

  return (
    <View style={[local.field, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={[local.label, { color: tokens.foreground }, parts?.label]}>{label}</Text>
      <View style={[local.field2, { minHeight: metrics.controlHeight.md, borderColor: problem ? tokens.warning : tokens.borderStrong, backgroundColor: tokens.surface }, parts?.field]}>
        <View style={local.caps}>
          {(current ?? "").split("+").filter(Boolean).map((part) => (
            <View key={part} style={[local.key, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.key]}>
              <Text style={{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "600" }}>{SYMBOLS[part] ?? part.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <TextInput
          value={draft ?? ""}
          onChangeText={setDraft}
          onSubmitEditing={() => (commit(draft ?? ""), setDraft(null))}
          onBlur={() => {
            if (draft) commit(draft);
            setDraft(null);
          }}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={current ? "Change…" : placeholder}
          placeholderTextColor={tokens.textMuted}
          accessibilityLabel={label}
          style={[local.input, { color: tokens.foreground }, parts?.input]}
        />
        {resetValue !== undefined && current !== resetValue ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Reset shortcut" hitSlop={8} onPress={() => (value === undefined && setInternal(resetValue), onValueChange?.(resetValue, {}))}>
            <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>Reset</Text>
          </Pressable>
        ) : null}
      </View>
      {problem ? <Text accessibilityRole="alert" style={[{ color: tokens.warning, fontSize: metrics.text.xs }, parts?.hint]}>{problem}</Text> : description ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.hint]}>{description}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  field: { alignSelf: "stretch", gap: metrics.space[2] },
  label: { fontSize: metrics.text.sm, fontWeight: "500" },
  field2: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  caps: { flexDirection: "row", gap: 4 },
  key: { minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 6 },
  input: { flex: 1, paddingVertical: 0, fontSize: metrics.text.sm },
});

export default ShortcutRecorder;
