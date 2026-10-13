import { Children, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface CarouselProps extends Omit<ViewProps, "children"> {
  label: string;
  children: ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Share of the width each slide takes, so the next one peeks in. */
  slideSize?: number;
  slideLabel?: (index: number, count: number) => string;
  /** Extend the inner, named parts of the carousel: slide, dots or dot. The React Native counterpart of `classNames`. */
  styles?: {
    slide?: StyleProp<ViewStyle>;
    dots?: StyleProp<ViewStyle>;
    dot?: StyleProp<ViewStyle>;
  };
}

/** Slides snap into place as you scroll. Pass the children as the slides. */
export function Carousel({ label, children, index, defaultIndex = 0, onIndexChange, slideSize = 0.72, slideLabel = (at, count) => `Slide ${at + 1} of ${count}`, style, styles: parts, ...props }: CarouselProps) {
  const tokens = useTokens();
  const slides = Children.toArray(children);
  const [width, setWidth] = useState(0);
  const [internal, setInternal] = useState(defaultIndex);
  const scroller = useRef<ScrollView>(null);
  const current = index ?? internal;
  const slide = width * slideSize;
  const gap = 12;

  function goTo(next: number, animated = true) {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    scroller.current?.scrollTo({ x: clamped * (slide + gap), animated });
    if (index === undefined) setInternal(clamped);
    onIndexChange?.(clamped);
  }

  return (
    <View {...props} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityActions={[{ name: "increment" }, { name: "decrement" }]} onAccessibilityAction={({ nativeEvent }) => goTo(current + (nativeEvent.actionName === "increment" ? 1 : -1))} style={[{ alignSelf: "stretch", gap: metrics.space[3] }, style]}>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slide + gap}
        decelerationRate="fast"
        contentOffset={{ x: current * (slide + gap), y: 0 }}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, slide + gap));
          if (index === undefined) setInternal(next);
          onIndexChange?.(next);
        }}
        contentContainerStyle={{ gap }}
      >
        {slides.map((child, at) => (
          <View key={at} accessible accessibilityLabel={slideLabel(at, slides.length)} style={[{ width: slide || undefined }, parts?.slide]}>
            {child}
          </View>
        ))}
      </ScrollView>
      <View style={[local.dots, parts?.dots]}>
        {slides.map((_, at) => (
          <Pressable key={at} accessibilityRole="button" accessibilityLabel={slideLabel(at, slides.length)} accessibilityState={{ selected: at === current }} hitSlop={6} onPress={() => goTo(at)} style={[local.dot, { backgroundColor: at === current ? tokens.foreground : tokens.borderStrong }, parts?.dot]} />
        ))}
      </View>
      <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs, textAlign: "center" }}>{current + 1} / {slides.length}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default Carousel;
