import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type FileDropzoneStatus = "uploading" | "uploaded" | "failed";

export interface FileDropzoneItem {
  id: string;
  name: string;
  size: number;
  status?: FileDropzoneStatus;
  /** 0 to 100 while uploading. */
  progress?: number;
  error?: string;
  retryable?: boolean;
  /** Whatever your picker returns, such as the asset uri. It comes back to `onUpload`. */
  source?: unknown;
}

export type FileDropzoneUpload = (item: FileDropzoneItem, options: { onProgress: (percent: number) => void }) => Promise<void>;

export interface FileDropzoneProps extends Omit<ViewProps, "children"> {
  /**
   * Opens your file or photo picker (expo-document-picker, expo-image-picker…) and resolves with what was chosen.
   * React Native has no drag and drop, so the dropzone is a button that calls this.
   */
  onPick: () => Promise<{ name: string; size: number; source?: unknown }[]>;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  label?: string;
  description?: string;
  defaultItems?: FileDropzoneItem[];
  onUpload?: FileDropzoneUpload;
  onItemsChange?: (items: FileDropzoneItem[]) => void;
  note?: string;
  /** Extend the inner, named parts of the dropzone: zone, item, name, progress or note. The React Native counterpart of `classNames`. */
  styles?: {
    zone?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    name?: StyleProp<TextStyle>;
    progress?: StyleProp<ViewStyle>;
    note?: StyleProp<TextStyle>;
  };
}

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function FileDropzone({ onPick, multiple = true, maxFiles = Infinity, maxSize, label = "Add files", description, defaultItems = [], onUpload, onItemsChange, note, style, styles: parts, ...props }: FileDropzoneProps) {
  const tokens = useTokens();
  const [items, setItems] = useState(defaultItems);

  function update(next: FileDropzoneItem[]) {
    setItems(next);
    onItemsChange?.(next);
  }

  async function run(item: FileDropzoneItem) {
    if (!onUpload) return setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "uploaded", progress: 100 } : entry)));
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "uploading", progress: 0, error: undefined } : entry)));
    try {
      await onUpload(item, { onProgress: (percent) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, progress: percent } : entry))) });
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "uploaded", progress: 100 } : entry)));
    } catch (error) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "failed", error: error instanceof Error ? error.message : "Upload failed", retryable: true } : entry)));
    }
  }

  async function pick() {
    const chosen = (await onPick()).slice(0, Math.max(0, maxFiles - items.length));
    const added: FileDropzoneItem[] = chosen.map((file, index) => (maxSize && file.size > maxSize ? { id: `f-${Date.now()}-${index}`, ...file, status: "failed", error: `Larger than ${size(maxSize)}` } : { id: `f-${Date.now()}-${index}`, ...file, status: "uploading", progress: 0 }));
    update([...items, ...added]);
    added.filter((item) => item.status === "uploading").forEach(run);
  }

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[3] }, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={pick} style={({ pressed }) => [local.zone, { borderColor: tokens.borderStrong, backgroundColor: pressed ? tokens.surfaceMuted : tokens.surface }, parts?.zone]}>
        <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
        {description ? <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs, textAlign: "center" }}>{description}</Text> : null}
        <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>Tap to choose {multiple ? "files" : "a file"}</Text>
      </Pressable>
      {note ? <Text style={[{ color: tokens.textMuted, fontSize: metrics.text.xs }, parts?.note]}>{note}</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={[local.item, { borderColor: item.status === "failed" ? tokens.danger : tokens.border, backgroundColor: tokens.surface }, parts?.item]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text numberOfLines={1} style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.name]}>{item.name}</Text>
            <Text style={{ color: item.status === "failed" ? tokens.danger : tokens.textMuted, fontSize: metrics.text.xs }}>{item.status === "failed" ? item.error : item.status === "uploading" ? `Uploading ${Math.round(item.progress ?? 0)}%` : size(item.size)}</Text>
            {item.status === "uploading" ? (
              <View style={[local.track, { backgroundColor: tokens.surfaceMuted }, parts?.progress]}>
                <View style={{ width: `${item.progress ?? 0}%`, height: "100%", backgroundColor: tokens.accent, borderRadius: 2 }} />
              </View>
            ) : null}
          </View>
          {item.status === "failed" && item.retryable ? (
            <Pressable accessibilityRole="button" onPress={() => run(item)}><Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>Retry</Text></Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} hitSlop={8} onPress={() => update(items.filter((entry) => entry.id !== item.id))}>
            <Text style={{ color: tokens.textMuted, fontSize: 18 }}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  zone: { alignItems: "center", gap: 4, padding: metrics.space[5], borderWidth: 1.5, borderStyle: "dashed", borderRadius: 26 },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], padding: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
  track: { height: 4, borderRadius: 2, overflow: "hidden" },
});

export default FileDropzone;
