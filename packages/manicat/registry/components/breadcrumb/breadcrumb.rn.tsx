// @manicat-dependencies lucide-react-native react-native-svg
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { GestureResponderEvent, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface BreadcrumbItem {
  label: string;
  /** Called when the crumb is pressed; navigate here with your router. The last crumb is the current page and is not pressable. */
  onPress?: (event: GestureResponderEvent) => void;
}

export interface BreadcrumbProps extends ViewProps {
  items: BreadcrumbItem[];
  /** Extend the inner, named parts of the breadcrumb: list, crumb, current or separator. The React Native counterpart of `classNames`. */
  styles?: {
    list?: StyleProp<ViewStyle>;
    crumb?: StyleProp<TextStyle>;
    current?: StyleProp<TextStyle>;
    separator?: StyleProp<TextStyle>;
  };
}

export function Breadcrumb({ items, style, styles: parts, ...props }: BreadcrumbProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="header" style={[local.list, style, parts?.list]}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <View key={`${item.label}-${index}`} style={local.crumb}>
            {last ? (
              <Text accessibilityRole="text" style={[local.text, { color: tokens.accentStrong, fontWeight: "500" }, parts?.current]}>
                {item.label}
              </Text>
            ) : (
              <Pressable accessibilityRole="link" hitSlop={8} onPress={item.onPress}>
                <Text style={[local.text, { color: tokens.textSecondary }, parts?.crumb]}>{item.label}</Text>
              </Pressable>
            )}
            {last ? null : <Text style={[local.separator, { color: tokens.borderStrong }, parts?.separator]}>/</Text>}
          </View>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  list: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", rowGap: 2 },
  crumb: { flexDirection: "row", alignItems: "center" },
  text: { fontSize: metrics.text.sm, paddingVertical: 4 },
  separator: { fontSize: 18, marginHorizontal: 6 },
});

export default Breadcrumb;
