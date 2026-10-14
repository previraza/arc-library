import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface CardProps extends Omit<PressableProps, "style" | "children"> {
  title: string;
  description?: string;
  /** A hero image or illustration across the top. */
  media?: ReactNode;
  /** Buttons or links at the end of the footer. */
  action?: ReactNode;
  /** A small avatar at the start of the footer. */
  avatar?: ReactNode;
  meta?: ReactNode;
  status?: string;
  /** Extra content between the description and the footer. */
  children?: ReactNode;
  /** Style of the outer card. */
  style?: StyleProp<ViewStyle>;
  /** Extend the inner, named parts of the card: media, content, title, description, footer, meta, status or action. The React Native counterpart of `classNames`. */
  styles?: {
    media?: StyleProp<ViewStyle>;
    content?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    footer?: StyleProp<ViewStyle>;
    meta?: StyleProp<TextStyle>;
    status?: StyleProp<TextStyle>;
    action?: StyleProp<ViewStyle>;
  };
}

export function Card({ title, description, media, action, avatar, meta, status, children, onPress, style, styles: parts, ...props }: CardProps) {
  const tokens = useTokens();
  const hasFooter = Boolean(action || avatar || meta || status);

  return (
    <Pressable
      {...props}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={props.accessibilityLabel ?? title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        local.root,
        { borderColor: pressed ? tokens.borderStrong : tokens.border, backgroundColor: tokens.surface },
        style,
      ]}
    >
      {media ? <View style={[local.media, { backgroundColor: tokens.surfaceMuted }, parts?.media]}>{media}</View> : null}
      <View style={[local.content, parts?.content]}>
        <Text style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
        {description ? <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text> : null}
        {children}
        {hasFooter ? (
          <View style={[local.footer, parts?.footer]}>
            <View style={local.byline}>
              {avatar ? <View style={local.avatar}>{avatar}</View> : null}
              <View style={local.bylineText}>
                {meta ? <Text style={[local.meta, { color: tokens.foreground }, parts?.meta]}>{meta}</Text> : null}
                {status ? <Text style={[local.status, { color: tokens.textMuted }, parts?.status]}>{status}</Text> : null}
              </View>
            </View>
            {action ? <View style={[local.action, parts?.action]}>{action}</View> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { overflow: "hidden", borderWidth: 1, borderRadius: 26, alignSelf: "stretch" },
  media: { minHeight: 112, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  content: { padding: metrics.space[5] },
  title: { fontSize: metrics.text.lg, fontWeight: "500", lineHeight: 23 },
  description: { marginTop: metrics.space[2], fontSize: metrics.text.sm, lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: metrics.space[3], marginTop: metrics.space[5] },
  byline: { flex: 1, flexDirection: "row", alignItems: "center", gap: metrics.space[3], minWidth: 0 },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  bylineText: { flex: 1, minWidth: 0 },
  meta: { fontSize: metrics.text.xs, fontWeight: "500" },
  status: { fontSize: metrics.text.xs, fontVariant: ["tabular-nums"] },
  action: { flexDirection: "row", gap: metrics.space[3] },
});

export default Card;
