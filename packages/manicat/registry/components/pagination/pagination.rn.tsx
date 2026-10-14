import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export interface PaginationProps extends ViewProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
  /** Extend the inner, named parts of the pagination: button, current, step or text. The React Native counterpart of `classNames`. */
  styles?: {
    button?: StyleProp<ViewStyle>;
    current?: StyleProp<ViewStyle>;
    step?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
  };
}

export function Pagination({ page, pageCount, onPageChange, label = "Pagination", style, styles: parts, ...props }: PaginationProps) {
  const tokens = useTokens();
  const total = Math.max(0, Math.floor(pageCount));
  const current = total > 0 ? Math.min(Math.max(1, Math.floor(page)), total) : 0;
  // A window of five pages that follows the current one.
  const start = total > 0 ? Math.max(1, Math.min(total - 4, current - 2)) : 1;
  const visible = Array.from({ length: Math.min(total, 5) }, (_, index) => start + index);

  const cell = { width: metrics.controlHeight.sm, height: metrics.controlHeight.sm, borderRadius: metrics.radiusControl };

  return (
    <View {...props} accessibilityRole="toolbar" accessibilityLabel={label} style={[local.root, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={current <= 1}
        onPress={() => onPageChange(current - 1)}
        style={({ pressed }) => [local.cell, cell, { opacity: current <= 1 ? 0.4 : 1, backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.step]}
      >
        <Text style={[{ color: tokens.textSecondary, fontSize: 18 }, parts?.text]}>‹</Text>
      </Pressable>
      {visible.map((number) => {
        const active = number === current;
        return (
          <Pressable
            key={number}
            accessibilityRole="button"
            accessibilityLabel={`Page ${number}`}
            accessibilityState={{ selected: active }}
            onPress={() => onPageChange(number)}
            style={({ pressed }) => [
              local.cell,
              cell,
              { borderWidth: 1, borderColor: active ? tokens.border : "transparent", backgroundColor: active ? tokens.surface : pressed ? tokens.surfaceMuted : "transparent" },
              parts?.button,
              active && parts?.current,
            ]}
          >
            <Text style={[{ color: active ? tokens.foreground : tokens.textSecondary, fontSize: metrics.text.xs, fontWeight: "500" }, parts?.text]}>{number}</Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={current >= total}
        onPress={() => onPageChange(current + 1)}
        style={({ pressed }) => [local.cell, cell, { opacity: current >= total ? 0.4 : 1, backgroundColor: pressed ? tokens.surfaceMuted : "transparent" }, parts?.step]}
      >
        <Text style={[{ color: tokens.textSecondary, fontSize: 18 }, parts?.text]}>›</Text>
      </Pressable>
    </View>
  );
}

const local = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: metrics.space[1], alignSelf: "flex-start" },
  cell: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
});

export default Pagination;
