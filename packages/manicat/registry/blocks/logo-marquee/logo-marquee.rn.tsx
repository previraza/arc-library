import { useEffect, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { ImageSourcePropType, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { useTokens } from "@/lib/rn-tokens";

export interface LogoMarqueeBrand {
  name: string;
  /** The mark, as any React Native image source (a bundled PNG or a `{ uri }`). */
  source?: ImageSourcePropType;
}

export interface LogoMarqueeProps extends ViewProps {
  title?: string;
  description?: string;
  brands?: LogoMarqueeBrand[];
  /** Pixels per second the row travels. Defaults to 40. */
  speed?: number;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; brand?: StyleProp<ViewStyle>; name?: StyleProp<TextStyle> };
}

const exampleBrands: LogoMarqueeBrand[] = ["Figma", "Linear", "Notion", "Slack", "GitHub", "Stripe", "Vercel"].map((name) => ({ name }));

export function LogoMarquee({ title = "Good work moves between tools", description = "From the first idea to the final handoff, a familiar set of tools stays close to the work.", brands = exampleBrands, speed = 40, style, styles: parts, ...props }: LogoMarqueeProps) {
  const tokens = useTokens();
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (paused || width === 0) return;
    const loop = Animated.loop(Animated.timing(offset, { toValue: -width, duration: (width / speed) * 1000, easing: Easing.linear, useNativeDriver: true }));
    offset.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [paused, width, speed, offset]);

  const row = (hidden?: boolean) => (
    <View accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? "no-hide-descendants" : "auto"} style={local.list} onLayout={hidden ? undefined : (event) => setWidth(event.nativeEvent.layout.width)}>
      {brands.map((brand, index) => (
        <View key={`${brand.name}-${index}`} style={[local.brand, parts?.brand]}>
          {brand.source ? <Image source={brand.source} alt="" accessibilityIgnoresInvertColors style={local.mark} /> : null}
          <Text style={[{ color: tokens.textSecondary, fontSize: 16, fontWeight: "500" }, parts?.name]}>{brand.name}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text>
      <View accessibilityLabel="Illustrative tool logos" style={{ overflow: "hidden" }}>
        <Animated.View style={{ flexDirection: "row", width: width * 2 || undefined, transform: [{ translateX: offset }] }}>
          {row()}
          {row(true)}
        </Animated.View>
      </View>
      <Button variant="ghost" size="sm" accessibilityLabel={paused ? "Play logo motion" : "Pause logo motion"} onPress={() => setPaused((value) => !value)}>
        {paused ? "Play" : "Pause"}
      </Button>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  list: { flexDirection: "row", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  mark: { width: 22, height: 22 },
});

export default LogoMarquee;
