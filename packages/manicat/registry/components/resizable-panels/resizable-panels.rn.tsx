import { Children, isValidElement, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export interface ResizablePanelProps {
  id: string;
  label: string;
  /** Share of the space it starts with, in percent. */
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A panel inside `ResizablePanels`; it renders its children and carries the sizing rules. */
export function ResizablePanel({ children, style }: ResizablePanelProps) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

export interface ResizablePanelsProps extends Omit<ViewProps, "children"> {
  label?: string;
  children: ReactNode;
  direction?: "horizontal" | "vertical";
  onLayoutChange?: (sizes: number[]) => void;
}

const HANDLE = 14;

/** Panels separated by draggable handles. Sizes are percentages that always add up to 100. */
export function ResizablePanels({ label = "Resizable panels", children, direction = "horizontal", onLayoutChange, style, ...props }: ResizablePanelsProps) {
  const tokens = useTokens();
  const panels = Children.toArray(children).filter((child): child is ReactElement<ResizablePanelProps> => isValidElement(child));
  const [sizes, setSizes] = useState(() => panels.map((panel) => panel.props.defaultSize));
  const [box, setBox] = useState(0);
  const horizontal = direction === "horizontal";
  const live = useRef({ sizes, box, panels });
  useEffect(() => {
    live.current = { sizes, box, panels };
  });
  const start = useRef<number[]>([]);

  function make(index: number) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = live.current.sizes;
      },
      onPanResponderMove: (_, g) => {
        const { box: total, panels: list } = live.current;
        const delta = ((horizontal ? g.dx : g.dy) / Math.max(1, total)) * 100;
        const a = list[index].props;
        const b = list[index + 1].props;
        const sum = start.current[index] + start.current[index + 1];
        const first = Math.max(a.minSize ?? 10, Math.min(Math.min(a.maxSize ?? 100, sum - (b.minSize ?? 10)), start.current[index] + delta));
        const next = start.current.map((size, at) => (at === index ? first : at === index + 1 ? sum - first : size));
        setSizes(next);
        onLayoutChange?.(next);
      },
    });
  }
  // eslint-disable-next-line react-hooks/refs
  const [handles] = useState(() => panels.slice(0, -1).map((_, index) => make(index)));

  return (
    <View {...props} accessibilityLabel={label} onLayout={(event: LayoutChangeEvent) => setBox(horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)} style={[{ flexDirection: horizontal ? "row" : "column", overflow: "hidden" }, style]}>
      {panels.map((panel, index) => (
        <View key={panel.props.id} style={{ flexBasis: `${sizes[index]}%`, flexGrow: 0, flexShrink: 0, overflow: "hidden" }}>
          {panel}
        </View>
      ))}
      {handles.map((handle, index) => (
        <View
          key={panels[index].props.id}
          {...handle.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${panels[index].props.label}`}
          style={[local.handle, horizontal ? { top: 0, bottom: 0, left: `${sizes.slice(0, index + 1).reduce((sum, size) => sum + size, 0)}%`, width: HANDLE, marginLeft: -HANDLE / 2 } : { left: 0, right: 0, top: `${sizes.slice(0, index + 1).reduce((sum, size) => sum + size, 0)}%`, height: HANDLE, marginTop: -HANDLE / 2 }]}
        >
          <View style={[horizontal ? local.gripV : local.gripH, { backgroundColor: tokens.borderStrong }]} />
        </View>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  handle: { position: "absolute", alignItems: "center", justifyContent: "center" },
  gripV: { width: 4, height: 28, borderRadius: 2 },
  gripH: { width: 28, height: 4, borderRadius: 2 },
});

export default ResizablePanels;
