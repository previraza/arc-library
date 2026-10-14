// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { X } from "lucide-react-native";

export interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  /** Whatever your picker returns, such as the asset uri. */
  source?: unknown;
  error?: string;
}

export interface FileUploadProps extends Omit<ViewProps, "children"> {
  /** Opens your file or photo picker and resolves with what was chosen (expo-document-picker, expo-image-picker…). */
  onPick: () => Promise<{ name: string; size: number; source?: unknown }[]>;
  label?: string;
  description?: string;
  multiple?: boolean;
  /** Largest file in bytes; bigger ones are listed with an error. */
  maxSize?: number;
  disabled?: boolean;
  value?: FileUploadItem[];
  onChange?: (files: FileUploadItem[]) => void;
  /** Extend the inner, named parts of the upload: button, item or name. The React Native counterpart of `classNames`. */
  styles?: {
    button?: StyleProp<ViewStyle>;
    item?: StyleProp<ViewStyle>;
    name?: StyleProp<TextStyle>;
  };
}

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** A pick button and the list of what was chosen, with a size check. Uploading the files is up to you. */
export function FileUpload({ onPick, label = "Upload a file", description, multiple = false, maxSize, disabled = false, value, onChange, style, styles: parts, ...props }: FileUploadProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState<FileUploadItem[]>([]);
  const files = value ?? internal;

  function set(next: FileUploadItem[]) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }

  async function pick() {
    const chosen = await onPick();
    const items = chosen.map((file, index): FileUploadItem => ({ id: `f-${Date.now()}-${index}`, ...file, error: maxSize && file.size > maxSize ? `Larger than ${size(maxSize)}` : undefined }));
    set(multiple ? [...files, ...items] : items.slice(0, 1));
  }

  return (
    <View {...props} style={[{ alignSelf: "stretch", gap: metrics.space[2] }, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={pick} style={({ pressed }) => [local.button, { borderColor: tokens.border, backgroundColor: pressed ? tokens.surfaceMuted : tokens.surface, opacity: disabled ? 0.5 : 1 }, parts?.button]}>
        <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }}>{label}</Text>
      </Pressable>
      {description ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{description}</Text> : null}
      {files.map((file) => (
        <View key={file.id} style={[local.item, { borderColor: file.error ? tokens.danger : tokens.border }, parts?.item]}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[{ color: tokens.foreground, fontSize: metrics.text.sm }, parts?.name]}>{file.name}</Text>
            <Text style={{ color: file.error ? tokens.danger : tokens.textMuted, fontSize: metrics.text.xs }}>{file.error ?? size(file.size)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} hitSlop={8} onPress={() => set(files.filter((entry) => entry.id !== file.id))}>
            <X size={16} strokeWidth={1.75} color={tokens.textMuted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  button: { alignSelf: "flex-start", minHeight: metrics.controlHeight.md, paddingHorizontal: metrics.space[4], justifyContent: "center", borderWidth: 1, borderRadius: metrics.radiusControl },
  item: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], padding: metrics.space[3], borderWidth: 1, borderRadius: metrics.radiusControl },
});

export default FileUpload;
