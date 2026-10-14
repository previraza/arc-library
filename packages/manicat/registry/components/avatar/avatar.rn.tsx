import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { ImageStyle, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends ViewProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: "online" | "offline";
  /** Extend the inner, named parts of the avatar: image, fallback or status. The React Native counterpart of `classNames`. */
  styles?: {
    image?: StyleProp<ImageStyle>;
    fallback?: StyleProp<TextStyle>;
    status?: StyleProp<ViewStyle>;
  };
}

const dimension: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48, xl: 88 };
const fontSize: Record<AvatarSize, number> = { sm: 10, md: metrics.text.xs, lg: metrics.text.sm, xl: 22 };

export function Avatar({ name, src, size = "md", status, style, styles: parts, ...props }: AvatarProps) {
  const tokens = useTokens();
  const [failed, setFailed] = useState<string>();
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const box = dimension[size];
  const showImage = Boolean(src) && failed !== src;

  return (
    <View
      {...props}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name}${status ? `, ${status}` : ""}`}
      style={[
        local.root,
        { width: box, height: box, borderRadius: metrics.radiusPill, borderColor: tokens.border, backgroundColor: tokens.surfaceMuted },
        style,
      ]}
    >
      {showImage ? (
        <Image alt="" source={{ uri: src }} onError={() => setFailed(src)} style={[local.image, parts?.image]} />
      ) : (
        <Text style={[{ color: tokens.foreground, fontSize: fontSize[size], fontWeight: "500" }, parts?.fallback]}>{initials}</Text>
      )}
      {status ? (
        <View
          style={[
            local.status,
            { backgroundColor: status === "online" ? tokens.success : tokens.textMuted, borderColor: tokens.background },
            parts?.status,
          ]}
        />
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "visible" },
  image: { ...StyleSheet.absoluteFillObject, borderRadius: metrics.radiusPill },
  status: { position: "absolute", right: 0, bottom: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});

export default Avatar;
