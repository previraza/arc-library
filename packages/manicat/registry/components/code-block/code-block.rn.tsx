import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface CodeBlockProps extends Omit<ViewProps, "children"> {
  code: string;
  filename?: string;
  language?: string;
  /** Shows only this many lines until expanded. */
  maxLines?: number;
  /**
   * Writes text to the clipboard when the copy button is pressed. React Native has no built-in clipboard, so pass the one
   * your app uses, for example `(text) => Clipboard.setStringAsync(text)` from expo-clipboard. Without it there is no copy button.
   */
  copy?: (text: string) => void | Promise<unknown>;
  /** Extend the inner, named parts of the block: header, filename, language, code or copy. The React Native counterpart of `classNames`. */
  styles?: {
    header?: StyleProp<ViewStyle>;
    filename?: StyleProp<TextStyle>;
    language?: StyleProp<TextStyle>;
    code?: StyleProp<TextStyle>;
    copy?: StyleProp<ViewStyle>;
  };
}

/** Monospaced, horizontally scrollable, with line numbers. Colouring tokens needs a highlighter, which this port does not bundle. */
export function CodeBlock({ code, filename, language = "tsx", maxLines, copy, style, styles: parts, ...props }: CodeBlockProps) {
  const tokens = useTokens();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const lines = code.replace(/\n$/, "").split("\n");
  const shown = maxLines && !expanded ? lines.slice(0, maxLines) : lines;

  async function onCopy() {
    await copy?.(code);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <View {...props} style={[local.root, { borderColor: tokens.border, backgroundColor: tokens.background }, style]}>
      <View style={[local.header, { borderBottomColor: tokens.border, backgroundColor: tokens.surface }, parts?.header]}>
        <Text style={[{ flex: 1, color: tokens.foreground, fontSize: 11, fontFamily: "Menlo" }, parts?.filename]} numberOfLines={1}>{filename ?? ""}</Text>
        <Text style={[{ color: tokens.textMuted, fontSize: 10, textTransform: "uppercase" }, parts?.language]}>{language}</Text>
        {copy ? (
          <Pressable accessibilityRole="button" accessibilityLabel={copied ? "Copied" : "Copy code"} onPress={onCopy} style={[local.copy, { borderColor: tokens.border }, parts?.copy]}>
            <Text style={{ color: copied ? tokens.success : tokens.textSecondary, fontSize: 11 }}>{copied ? "✓ Copied" : "Copy"}</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ padding: metrics.space[4] }}>
          {shown.map((line, index) => (
            <Text key={index} style={[{ color: tokens.foreground, fontSize: 12, lineHeight: 19, fontFamily: "Menlo" }, parts?.code]}>
              <Text style={{ color: tokens.textMuted }}>{String(index + 1).padStart(String(lines.length).length, " ")}  </Text>
              {line || " "}
            </Text>
          ))}
        </View>
      </ScrollView>
      {maxLines && lines.length > maxLines ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} style={[local.more, { borderTopColor: tokens.border }]}>
          <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>{expanded ? "Show less" : `Show ${lines.length - maxLines} more lines`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 26, overflow: "hidden", alignSelf: "stretch" },
  header: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], paddingHorizontal: metrics.space[3], paddingVertical: 8, borderBottomWidth: 1 },
  copy: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  more: { alignItems: "center", paddingVertical: 10, borderTopWidth: 1 },
});

export default CodeBlock;
