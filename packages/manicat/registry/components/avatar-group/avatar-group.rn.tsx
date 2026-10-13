import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Avatar } from "@/registry/components/avatar/avatar.rn";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface AvatarGroupMember {
  name: string;
  src?: string;
  status?: "online" | "offline";
}

export interface AvatarGroupProps extends ViewProps {
  members: AvatarGroupMember[];
  /** How many avatars show before the rest collapse into a +N. */
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** Extend the inner, named parts of the group: slot or overflow. The React Native counterpart of `classNames`. */
  styles?: {
    slot?: StyleProp<ViewStyle>;
    overflow?: StyleProp<ViewStyle>;
    overflowText?: StyleProp<TextStyle>;
  };
}

const dimension = { sm: 28, md: 36, lg: 48 } as const;

export function AvatarGroup({ members, max = 4, size = "md", label = "Team members", style, styles: parts, ...props }: AvatarGroupProps) {
  const tokens = useTokens();
  const visible = members.slice(0, Math.max(0, max));
  const overflow = Math.max(0, members.length - visible.length);
  const box = dimension[size];
  // Neighbours overlap by a third of their width.
  const step = -Math.round(box / 3);

  return (
    <View {...props} accessibilityRole="summary" accessibilityLabel={`${label}, ${members.length}`} style={[local.row, style]}>
      {visible.map((member, index) => (
        <View key={member.name} style={[{ marginLeft: index === 0 ? 0 : step, borderRadius: box, borderWidth: 2, borderColor: tokens.background }, parts?.slot]}>
          <Avatar {...member} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            local.overflow,
            { width: box + 4, height: box + 4, marginLeft: step, borderColor: tokens.background, backgroundColor: tokens.surfaceMuted },
            parts?.overflow,
          ]}
        >
          <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.overflowText]}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  overflow: { borderRadius: 999, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});

export default AvatarGroup;
