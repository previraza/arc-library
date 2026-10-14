import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface RichTextValue {
  markdown: string;
  text: string;
  empty: boolean;
}

export interface RichTextEditorProps extends Omit<ViewProps, "children"> {
  value?: string;
  defaultValue?: string;
  /** Called on every edit with the Markdown, the plain text and whether it is empty. */
  onChange?: (value: RichTextValue) => void;
  placeholder?: string;
  readOnly?: boolean;
  "aria-label"?: string;
  minHeight?: number;
  /** Extend the inner, named parts of the editor: toolbar, tool, toolText or editor. The React Native counterpart of `classNames`. */
  styles?: {
    toolbar?: StyleProp<ViewStyle>;
    tool?: StyleProp<ViewStyle>;
    toolText?: StyleProp<TextStyle>;
    editor?: StyleProp<TextStyle>;
  };
}

const strip = (markdown: string) => markdown.replace(/^#{1,3}\s+/gm, "").replace(/^[-*]\s+|^\d+\.\s+|^>\s?/gm, "").replace(/(\*\*|__|\*|_|`)/g, "");

/**
 * A native text input cannot show styled spans, so this port edits Markdown: the toolbar wraps the selection (or starts a line)
 * with the right syntax, and `onChange` reports the Markdown. Render it for readers with your Markdown renderer.
 */
export function RichTextEditor({ value, defaultValue = "", onChange, placeholder = "Start typing…", readOnly = false, "aria-label": ariaLabel = "Editor", minHeight = 160, style, styles: parts, ...props }: RichTextEditorProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultValue);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const input = useRef<TextInput>(null);
  const markdown = value ?? internal;

  function set(next: string, cursor?: number) {
    if (value === undefined) setInternal(next);
    const text = strip(next);
    onChange?.({ markdown: next, text, empty: text.trim() === "" });
    if (cursor !== undefined) requestAnimationFrame(() => input.current?.setNativeProps({ selection: { start: cursor, end: cursor } }));
  }

  // Wraps the selection, or inserts the markers and leaves the caret between them.
  function wrap(marker: string) {
    const { start, end } = selection;
    const chosen = markdown.slice(start, end);
    set(`${markdown.slice(0, start)}${marker}${chosen}${marker}${markdown.slice(end)}`, start + marker.length + chosen.length + (chosen ? marker.length : 0));
  }

  // Puts the prefix at the start of the current line.
  function prefix(mark: string) {
    const lineStart = markdown.lastIndexOf("\n", selection.start - 1) + 1;
    const line = markdown.slice(lineStart);
    const clean = line.replace(/^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s?)/, "");
    set(`${markdown.slice(0, lineStart)}${mark}${clean}`, lineStart + mark.length);
  }

  const tools: { label: string; name: string; run: () => void; style?: TextStyle }[] = [
    { label: "B", name: "Bold", run: () => wrap("**"), style: { fontWeight: "700" } },
    { label: "I", name: "Italic", run: () => wrap("*"), style: { fontStyle: "italic" } },
    { label: "H", name: "Heading", run: () => prefix("## ") },
    { label: "•", name: "Bulleted list", run: () => prefix("- ") },
    { label: "1.", name: "Numbered list", run: () => prefix("1. ") },
    { label: "❝", name: "Quote", run: () => prefix("> ") },
    { label: "</>", name: "Code", run: () => wrap("`") },
  ];

  return (
    <View {...props} style={[{ alignSelf: "stretch", borderWidth: 1, borderRadius: 26, borderColor: tokens.border, backgroundColor: tokens.surface, overflow: "hidden" }, style]}>
      {!readOnly ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[local.toolbar, { borderBottomColor: tokens.border, backgroundColor: tokens.surfaceMuted }, parts?.toolbar]} contentContainerStyle={{ gap: 2, padding: 4 }}>
          {/* eslint-disable-next-line react-hooks/refs */}
          {tools.map((tool) => (
            <Pressable key={tool.name} accessibilityRole="button" accessibilityLabel={tool.name} onPress={tool.run} style={({ pressed }) => [local.tool, { backgroundColor: pressed ? tokens.border : "transparent" }, parts?.tool]}>
              <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, tool.style, parts?.toolText]}>{tool.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <TextInput ref={input} multiline editable={!readOnly} value={markdown} onChangeText={(text) => set(text)} onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)} placeholder={placeholder} placeholderTextColor={tokens.textMuted} accessibilityLabel={ariaLabel} textAlignVertical="top" style={[local.editor, { minHeight, color: tokens.foreground }, parts?.editor]} />
    </View>
  );
}

const local = StyleSheet.create({
  toolbar: { flexGrow: 0, borderBottomWidth: 1 },
  tool: { minWidth: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  editor: { padding: metrics.space[4], fontSize: metrics.text.sm, lineHeight: 22 },
});

export default RichTextEditor;
