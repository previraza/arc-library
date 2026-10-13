import { ScrollView } from "react-native";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";

export interface ScrollAreaProps extends Omit<ScrollViewProps, "horizontal"> {
  orientation?: "vertical" | "horizontal";
  /** Cap the height; the content scrolls inside. */
  maxHeight?: number;
  label?: string;
  /** Extend the inner, named parts of the area: content. The React Native counterpart of `classNames`. */
  styles?: { content?: StyleProp<ViewStyle> };
}

/** A bounded scrolling region. React Native draws its own indicator, so there is no custom scrollbar to style. */
export function ScrollArea({ orientation = "vertical", maxHeight, label, style, styles: parts, children, ...props }: ScrollAreaProps) {
  return (
    <ScrollView
      {...props}
      horizontal={orientation === "horizontal"}
      accessibilityLabel={label}
      showsVerticalScrollIndicator
      indicatorStyle="default"
      contentContainerStyle={parts?.content}
      style={[{ flexGrow: 0, maxHeight }, style]}
    >
      {children}
    </ScrollView>
  );
}

export default ScrollArea;
